import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { ConflictException, BadRequestException } from "@nestjs/common";
import * as argon from "argon2";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto, ForgotPasswordDto, ResetPasswordDto } from "./dto";

// Mock argon2
jest.mock("argon2");
const mockedArgon = argon as jest.Mocked<typeof argon>;

// Mock configuration
jest.mock("../../config/configuration", () => ({
  default: {
    accessTokenSecret: "test-access-secret",
    refreshTokenSecret: "test-refresh-secret",
    accessTokenExpires: "15m",
    refreshTokenExpires: "7d"
  }
}));

describe("AuthService - Registration", () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn()
    },
    passwordResetToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn()
    }
  };

  const mockJwtService = {
    signAsync: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService
        },
        {
          provide: JwtService,
          useValue: mockJwtService
        }
      ]
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Reset all mocks
    jest.clearAllMocks();

    // Setup common mocks
    mockedArgon.hash.mockResolvedValue("hashed-password");
    mockJwtService.signAsync.mockResolvedValueOnce("mock-access-token").mockResolvedValueOnce("mock-refresh-token");
  });

  describe("register", () => {
    const validRegisterDto: RegisterDto = {
      name: "Test User",
      firstName: "Test",
      lastName: "User",
      username: "testuser",
      email: "test@example.com",
      phoneNumber: "1234567890",
      password: "password123",
      confirmPassword: "password123"
    };

    const mockUser = {
      id: "user-id-123",
      name: "Test User",
      firstName: "Test",
      lastName: "User",
      username: "testuser",
      email: "test@example.com",
      phoneNumber: "1234567890",
      password: "hashed-password",
      role: "USER",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      hashedRt: null
    };

    const mockTokens = {
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token"
    };

    beforeEach(() => {
      // Reset specific mocks for each test
      mockPrismaService.user.findUnique.mockReset();
      mockPrismaService.user.create.mockReset();
      mockPrismaService.user.update.mockReset();

      // Re-setup mocks that are used in most tests
      mockedArgon.hash.mockResolvedValue("hashed-password");
      mockJwtService.signAsync.mockReset();
      mockJwtService.signAsync.mockResolvedValueOnce("mock-access-token").mockResolvedValueOnce("mock-refresh-token");
    });

    it("should successfully register a new user", async () => {
      // Arrange
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // username check
        .mockResolvedValueOnce(null); // email check
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      // Act
      const result = await service.register(validRegisterDto);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: validRegisterDto.username }
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: validRegisterDto.email }
      });
      expect(mockedArgon.hash).toHaveBeenCalledWith(validRegisterDto.password);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: validRegisterDto.name,
          firstName: validRegisterDto.firstName,
          middleName: validRegisterDto.middleName,
          lastName: validRegisterDto.lastName,
          username: validRegisterDto.username,
          email: validRegisterDto.email,
          phoneNumber: validRegisterDto.phoneNumber,
          password: "hashed-password",
          role: "USER",
          active: true
        }
      });
      expect(result).toHaveProperty("auth");
      expect(result).toHaveProperty("user");
      expect(result.auth).toEqual(mockTokens);
    });

    it("should throw BadRequestException when passwords don't match", async () => {
      // Arrange
      const invalidDto = {
        ...validRegisterDto,
        confirmPassword: "different-password"
      };

      // Act & Assert
      await expect(service.register(invalidDto)).rejects.toThrow(
        new BadRequestException("Mật khẩu xác nhận không khớp")
      );
      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it("should throw ConflictException when username already exists", async () => {
      // Arrange
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUser) // username exists
        .mockResolvedValueOnce(null); // email check

      // Act & Assert
      await expect(service.register(validRegisterDto)).rejects.toThrow(
        new ConflictException("Tên đăng nhập đã tồn tại")
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: validRegisterDto.username }
      });
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it("should throw ConflictException when email already exists", async () => {
      // Arrange
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // username check
        .mockResolvedValueOnce(mockUser); // email exists

      // Act & Assert
      await expect(service.register(validRegisterDto)).rejects.toThrow(new ConflictException("Email đã được sử dụng"));
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: validRegisterDto.email }
      });
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException when user creation fails", async () => {
      // Arrange
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // username check
        .mockResolvedValueOnce(null); // email check
      mockPrismaService.user.create.mockRejectedValue(new Error("Database error"));

      // Act & Assert
      await expect(service.register(validRegisterDto)).rejects.toThrow(
        new BadRequestException("Không thể tạo tài khoản. Vui lòng thử lại.")
      );
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it("should hash password before storing", async () => {
      // Arrange
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // username check
        .mockResolvedValueOnce(null); // email check
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      // Act
      await service.register(validRegisterDto);

      // Assert
      expect(mockedArgon.hash).toHaveBeenCalledWith(validRegisterDto.password);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: "hashed-password"
          })
        })
      );
    });

    it("should set default role as USER", async () => {
      // Arrange
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // username check
        .mockResolvedValueOnce(null); // email check
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      // Act
      await service.register(validRegisterDto);

      // Assert
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: "USER",
            active: true
          })
        })
      );
    });

    it("should generate tokens and update refresh token hash", async () => {
      // Arrange
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // username check
        .mockResolvedValueOnce(null); // email check
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      // Act
      await service.register(validRegisterDto);

      // Assert
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { hashedRt: expect.any(String) }
      });
    });

    describe("forgotPassword", () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: "test@example.com"
      };

      it("should return true when user exists", async () => {
        // Arrange
        mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
        mockPrismaService.passwordResetToken.deleteMany.mockResolvedValue({ count: 1 });
        mockPrismaService.passwordResetToken.create.mockResolvedValue({
          id: "token-id",
          userId: mockUser.id,
          token: "mock-token",
          expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
          used: false,
          createdAt: new Date()
        });

        // Act
        const result = await service.forgotPassword(forgotPasswordDto);

        // Assert
        expect(result).toBe(true);
        expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
          where: { email: forgotPasswordDto.email }
        });
        expect(mockPrismaService.passwordResetToken.deleteMany).toHaveBeenCalledWith({
          where: { userId: mockUser.id }
        });
        expect(mockPrismaService.passwordResetToken.create).toHaveBeenCalled();
      });

      it("should return true when user does not exist (security measure)", async () => {
        // Arrange
        mockPrismaService.user.findUnique.mockResolvedValue(null);

        // Act
        const result = await service.forgotPassword(forgotPasswordDto);

        // Assert
        expect(result).toBe(true);
        expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
          where: { email: forgotPasswordDto.email }
        });
        expect(mockPrismaService.passwordResetToken.deleteMany).not.toHaveBeenCalled();
        expect(mockPrismaService.passwordResetToken.create).not.toHaveBeenCalled();
      });

      it("should throw BadRequestException when token creation fails", async () => {
        // Arrange
        mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
        mockPrismaService.passwordResetToken.deleteMany.mockResolvedValue({ count: 1 });
        mockPrismaService.passwordResetToken.create.mockRejectedValue(new Error("Database error"));

        // Act & Assert
        await expect(service.forgotPassword(forgotPasswordDto)).rejects.toThrow(
          new BadRequestException("Không thể tạo token đặt lại mật khẩu. Vui lòng thử lại.")
        );
      });
    });

    describe("resetPassword", () => {
      const resetPasswordDto: ResetPasswordDto = {
        token: "valid-token",
        newPassword: "newPassword123",
        confirmPassword: "newPassword123"
      };

      const mockResetToken = {
        id: "reset-token-id",
        userId: mockUser.id,
        token: "valid-token",
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        used: false,
        createdAt: new Date(),
        user: mockUser
      };

      beforeEach(() => {
        mockedArgon.hash.mockResolvedValue("new-hashed-password");
      });

      it("should successfully reset password", async () => {
        // Arrange
        mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(mockResetToken);
        mockPrismaService.user.update.mockResolvedValue(mockUser);
        mockPrismaService.passwordResetToken.update.mockResolvedValue({
          ...mockResetToken,
          used: true
        });

        // Act
        const result = await service.resetPassword(resetPasswordDto);

        // Assert
        expect(result).toBe(true);
        expect(mockPrismaService.passwordResetToken.findUnique).toHaveBeenCalledWith({
          where: { token: resetPasswordDto.token },
          include: { user: true }
        });
        expect(mockedArgon.hash).toHaveBeenCalledWith(resetPasswordDto.newPassword);
        expect(mockPrismaService.user.update).toHaveBeenCalledWith({
          where: { id: mockUser.id },
          data: { password: "new-hashed-password" }
        });
        expect(mockPrismaService.passwordResetToken.update).toHaveBeenCalledWith({
          where: { id: mockResetToken.id },
          data: { used: true }
        });
      });

      it("should throw BadRequestException when passwords don't match", async () => {
        // Arrange
        const invalidDto = {
          ...resetPasswordDto,
          confirmPassword: "different-password"
        };

        // Act & Assert
        await expect(service.resetPassword(invalidDto)).rejects.toThrow(
          new BadRequestException("Mật khẩu xác nhận không khớp")
        );
        expect(mockPrismaService.passwordResetToken.findUnique).not.toHaveBeenCalled();
      });

      it("should throw BadRequestException when token is invalid", async () => {
        // Arrange
        mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
          new BadRequestException("Token đặt lại mật khẩu không hợp lệ")
        );
      });

      it("should throw BadRequestException when token is expired", async () => {
        // Arrange
        const expiredToken = {
          ...mockResetToken,
          expiresAt: new Date(Date.now() - 3600000) // 1 hour ago
        };
        mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(expiredToken);

        // Act & Assert
        await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
          new BadRequestException("Token đặt lại mật khẩu đã hết hạn")
        );
      });

      it("should throw BadRequestException when token is already used", async () => {
        // Arrange
        const usedToken = {
          ...mockResetToken,
          used: true
        };
        mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(usedToken);

        // Act & Assert
        await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
          new BadRequestException("Token đặt lại mật khẩu đã được sử dụng")
        );
      });
    });

    describe("validateResetToken", () => {
      const validToken = "valid-token";
      const mockResetToken = {
        id: "reset-token-id",
        userId: mockUser.id,
        token: validToken,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        used: false,
        createdAt: new Date()
      };

      it("should return true for valid token", async () => {
        // Arrange
        mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(mockResetToken);

        // Act
        const result = await service.validateResetToken(validToken);

        // Assert
        expect(result).toBe(true);
        expect(mockPrismaService.passwordResetToken.findUnique).toHaveBeenCalledWith({
          where: { token: validToken }
        });
      });

      it("should return false for non-existent token", async () => {
        // Arrange
        mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(null);

        // Act
        const result = await service.validateResetToken(validToken);

        // Assert
        expect(result).toBe(false);
      });

      it("should return false for expired token", async () => {
        // Arrange
        const expiredToken = {
          ...mockResetToken,
          expiresAt: new Date(Date.now() - 3600000) // 1 hour ago
        };
        mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(expiredToken);

        // Act
        const result = await service.validateResetToken(validToken);

        // Assert
        expect(result).toBe(false);
      });

      it("should return false for used token", async () => {
        // Arrange
        const usedToken = {
          ...mockResetToken,
          used: true
        };
        mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(usedToken);

        // Act
        const result = await service.validateResetToken(validToken);

        // Assert
        expect(result).toBe(false);
      });
    });
  });
});
