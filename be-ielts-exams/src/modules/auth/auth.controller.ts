import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";

import { GetCurrentUser } from "src/decorators";
import { AccessTokenGuard, RefeshTokenGuard } from "src/guards";
import RoleGuard from "src/guards/admin-role.guard";
import { AuthService } from "./auth.service";
import { AuthDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto, ValidateTokenDto } from "./dto";
import { Tokens } from "./types";
import { UserRole } from "@prisma/client";

@Controller({
  path: "/auth",
  version: "1"
})
export class AuthControllerV1 {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post("register")
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post("signIn")
  signIn(@Body() auth: AuthDto) {
    return this.authService.signIn(auth);
  }

  @Post("signOut")
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  logout(@GetCurrentUser("id") userId: string): Promise<boolean> {
    return this.authService.logout(userId);
  }

  @Post("changePassword")
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard, RoleGuard([UserRole.ADMIN, UserRole.USER]))
  changePassword(
    @GetCurrentUser("id") userId: string,
    @Body() changePasswordDto: ChangePasswordDto
  ): Promise<boolean> {
    return this.authService.changePassword(userId, changePasswordDto.newPassword);
  }

  @Post("refresh")
  @UseGuards(RefeshTokenGuard)
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @GetCurrentUser("id") userId: string,
    @GetCurrentUser("refreshToken") refreshToken: string
  ): Promise<Tokens> {
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @HttpCode(HttpStatus.OK)
  @Post("forgot-password")
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<boolean> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post("reset-password")
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<boolean> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post("validate-reset-token")
  validateResetToken(@Body() validateTokenDto: ValidateTokenDto): Promise<boolean> {
    return this.authService.validateResetToken(validateTokenDto.token);
  }
}
