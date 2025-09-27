import { ForbiddenException, Injectable, Logger, ConflictException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon from "argon2";
import { plainToClass } from "class-transformer";
import { randomBytes } from "crypto";
import configuration from "src/config/configuration";
import { PrismaService } from "../prisma/prisma.service";
import { UserEntity } from "../user/entities/user.entity";
import { AuthDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto } from "./dto";
import { JwtPayload, Tokens } from "./types";

@Injectable()
export class AuthService {
  private logger = new Logger("AuthService");

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  //register
  async register(registerDto: RegisterDto) {
    // Validate password confirmation
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException("Mật khẩu xác nhận không khớp");
    }

    // Check if username already exists
    const existingUserByUsername = await this.prisma.user.findUnique({
      where: { username: registerDto.username }
    });

    if (existingUserByUsername) {
      throw new ConflictException("Tên đăng nhập đã tồn tại");
    }

    // Check if email already exists
    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email: registerDto.email }
    });

    if (existingUserByEmail) {
      throw new ConflictException("Email đã được sử dụng");
    }

    // Hash password
    const hashedPassword = await argon.hash(registerDto.password);

    try {
      // Create new user
      const newUser = await this.prisma.user.create({
        data: {
          name: registerDto.name,
          firstName: registerDto.firstName,
          middleName: registerDto.middleName,
          lastName: registerDto.lastName,
          username: registerDto.username,
          email: registerDto.email,
          phoneNumber: registerDto.phoneNumber,
          password: hashedPassword,
          role: "USER",
          active: true
        }
      });

      // Generate tokens for automatic login
      const tokens = await this.getTokens(
        newUser.id,
        newUser.username,
        newUser.email,
        newUser.phoneNumber,
        newUser.role
      );
      await this.updateRtHash(newUser.id, tokens.refresh_token);

      return {
        auth: tokens,
        user: plainToClass(UserEntity, newUser)
      };
    } catch (error) {
      this.logger.error("Error creating user:", error);
      throw new BadRequestException("Không thể tạo tài khoản. Vui lòng thử lại.");
    }
  }

  //login
  async signIn(auth: AuthDto) {
    // Try to find user by username first, then by email if not found
    let user = await this.prisma.user.findUnique({
      where: {
        username: auth.username
      }
    });

    // If not found by username, try to find by email
    if (!user) {
      user = await this.prisma.user.findUnique({
        where: {
          email: auth.username // auth.username có thể là email
        }
      });
    }

    if (!user) throw new ForbiddenException("Tên đăng nhập hoặc mật khẩu không chính xác.");

    const passwordMatches = await argon.verify(user.password, auth.password);
    if (!passwordMatches) throw new ForbiddenException("Tên đăng nhập hoặc mật khẩu không chính xác.");
    if (!user.active) throw new ForbiddenException("Tài khoản đã bị khóa.");

    const tokens = await this.getTokens(user.id, user.username, user.email, user.phoneNumber, user.role);
    await this.updateRtHash(user.id, tokens.refresh_token);

    return {
      auth: tokens,
      user: plainToClass(UserEntity, user)
    };
  }

  //get access_token + refresh_token (RSA Signed)
  async getTokens(userId: string, username: string, email: string, phoneNumber: string, role: string): Promise<Tokens> {
    const jwtPayload: JwtPayload = {
      id: userId,
      username: username,
      phoneNumber: phoneNumber,
      email: email,
      role: role
    };

    // RSA signing options
    const signOptions = {
      algorithm: "RS256" as const, // RSA SHA-256
      privateKey: configuration.jwt.privateKey
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        ...signOptions,
        expiresIn: configuration.jwt.accessTokenExpires // 15 minutes
      }),
      this.jwtService.signAsync(jwtPayload, {
        ...signOptions,
        expiresIn: configuration.jwt.refreshTokenExpires // 7 days
      })
    ]);

    return {
      access_token,
      refresh_token
    };
  }
  //update hashedRT
  async updateRtHash(userId: string, rt: string): Promise<void> {
    const hash = await argon.hash(rt);
    await this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        hashedRt: hash
      }
    });
  }
  //logout
  async logout(userId: string): Promise<boolean> {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        hashedRt: {
          not: null
        }
      },
      data: {
        hashedRt: null
      }
    });
    return true;
  }
  //change password admin
  async changePassword(userId: string, newPassword: string): Promise<boolean> {
    const hash = await argon.hash(newPassword);
    await this.prisma.user.updateMany({
      where: {
        id: userId
      },
      data: {
        password: hash
      }
    });
    return true;
  }

  // refresh token
  async refreshTokens(userId: string, rt: string): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    });
    if (!user || !user.hashedRt) throw new ForbiddenException("Quyền truy cập bị từ chối.");

    const rtMatches = await argon.verify(user.hashedRt, rt);
    if (!rtMatches) throw new ForbiddenException("Quyền truy cập bị từ chối.");

    const tokens = await this.getTokens(user.id, user.username, user.email, user.phoneNumber, user.role);
    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }

  // forgot password
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email }
    });

    // For security reasons, we don't reveal if the email exists or not
    if (!user) {
      this.logger.log(`Password reset requested for non-existent email: ${forgotPasswordDto.email}`);
      return true;
    }

    // Generate a secure random token
    const token = randomBytes(32).toString("hex");

    // Set token expiration to 1 hour from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    try {
      // Delete any existing reset tokens for this user
      await this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id }
      });

      // Create new reset token
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt
        }
      });

      // In a real application, you would send an email with the reset link
      // For now, we'll just log the token (in production, you would send this via email)
      this.logger.log(`Password reset token for ${user.email}: ${token}`);

      return true;
    } catch (error) {
      this.logger.error("Error creating password reset token:", error);
      throw new BadRequestException("Không thể tạo token đặt lại mật khẩu. Vui lòng thử lại.");
    }
  }

  // reset password
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<boolean> {
    // Validate password confirmation
    if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
      throw new BadRequestException("Mật khẩu xác nhận không khớp");
    }

    // Find the reset token
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: resetPasswordDto.token },
      include: { user: true }
    });

    if (!resetToken) {
      throw new BadRequestException("Token đặt lại mật khẩu không hợp lệ");
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException("Token đặt lại mật khẩu đã hết hạn");
    }

    // Check if token is already used
    if (resetToken.used) {
      throw new BadRequestException("Token đặt lại mật khẩu đã được sử dụng");
    }

    try {
      // Hash the new password
      const hashedPassword = await argon.hash(resetPasswordDto.newPassword);

      // Update user's password
      await this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword }
      });

      // Mark the token as used
      await this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      });

      // Invalidate all existing refresh tokens for security
      await this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { hashedRt: null }
      });

      return true;
    } catch (error) {
      this.logger.error("Error resetting password:", error);
      throw new BadRequestException("Không thể đặt lại mật khẩu. Vui lòng thử lại.");
    }
  }

  // validate reset token
  async validateResetToken(token: string): Promise<boolean> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!resetToken) {
      return false;
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      return false;
    }

    // Check if token is already used
    if (resetToken.used) {
      return false;
    }

    return true;
  }
}
