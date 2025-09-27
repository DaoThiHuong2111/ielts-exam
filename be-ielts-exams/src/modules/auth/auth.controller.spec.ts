import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException, BadRequestException } from "@nestjs/common";
import { AuthControllerV1 } from "./auth.controller";
import { AuthService } from "./auth.service";
import { RegisterDto, ForgotPasswordDto, ResetPasswordDto } from "./dto";

describe("AuthControllerV1 - Registration", () => {
  let controller: AuthControllerV1;

  const mockAuthService = {
    register: jest.fn(),
    signIn: jest.fn(),
    logout: jest.fn(),
    changePassword: jest.fn(),
    refreshTokens: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    validateResetToken: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthControllerV1],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService
        }
      ]
    }).compile();

    controller = module.get<AuthControllerV1>(AuthControllerV1);

    // Reset all mocks
    jest.clearAllMocks();
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

    const mockAuthResponse = {
      auth: {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token"
      },
      user: {
        id: "user-id-123",
        name: "Test User",
        username: "testuser",
        email: "test@example.com",
        phoneNumber: "1234567890",
        role: "USER",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    it("should successfully register a new user", async () => {
      // Arrange
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      // Act
      const result = await controller.register(validRegisterDto);

      // Assert
      expect(mockAuthService.register).toHaveBeenCalledWith(validRegisterDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it("should handle ConflictException for existing username", async () => {
      // Arrange
      const conflictError = new ConflictException("Tên đăng nhập đã tồn tại");
      mockAuthService.register.mockRejectedValue(conflictError);

      // Act & Assert
      await expect(controller.register(validRegisterDto)).rejects.toThrow(conflictError);
      expect(mockAuthService.register).toHaveBeenCalledWith(validRegisterDto);
    });

    it("should handle ConflictException for existing email", async () => {
      // Arrange
      const conflictError = new ConflictException("Email đã được sử dụng");
      mockAuthService.register.mockRejectedValue(conflictError);

      // Act & Assert
      await expect(controller.register(validRegisterDto)).rejects.toThrow(conflictError);
      expect(mockAuthService.register).toHaveBeenCalledWith(validRegisterDto);
    });

    it("should handle BadRequestException for password mismatch", async () => {
      // Arrange
      const badRequestError = new BadRequestException("Mật khẩu xác nhận không khớp");
      mockAuthService.register.mockRejectedValue(badRequestError);

      // Act & Assert
      await expect(controller.register(validRegisterDto)).rejects.toThrow(badRequestError);
      expect(mockAuthService.register).toHaveBeenCalledWith(validRegisterDto);
    });

    it("should handle general BadRequestException", async () => {
      // Arrange
      const badRequestError = new BadRequestException("Không thể tạo tài khoản. Vui lòng thử lại.");
      mockAuthService.register.mockRejectedValue(badRequestError);

      // Act & Assert
      await expect(controller.register(validRegisterDto)).rejects.toThrow(badRequestError);
      expect(mockAuthService.register).toHaveBeenCalledWith(validRegisterDto);
    });

    it("should pass through all register DTO fields", async () => {
      // Arrange
      const fullRegisterDto: RegisterDto = {
        name: "Full Name Test",
        firstName: "First",
        middleName: "Middle",
        lastName: "Last",
        username: "fulltest",
        email: "full@test.com",
        phoneNumber: "9876543210",
        password: "securepass123",
        confirmPassword: "securepass123"
      };
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      // Act
      await controller.register(fullRegisterDto);

      // Assert
      expect(mockAuthService.register).toHaveBeenCalledWith(fullRegisterDto);
    });
  });

  describe("forgotPassword", () => {
    const forgotPasswordDto: ForgotPasswordDto = {
      email: "test@example.com"
    };

    it("should call authService.forgotPassword with correct DTO", async () => {
      // Arrange
      mockAuthService.forgotPassword.mockResolvedValue(true);

      // Act
      const result = await controller.forgotPassword(forgotPasswordDto);

      // Assert
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(forgotPasswordDto);
      expect(result).toBe(true);
    });

    it("should handle BadRequestException from authService", async () => {
      // Arrange
      const badRequestError = new BadRequestException("Không thể tạo token đặt lại mật khẩu. Vui lòng thử lại.");
      mockAuthService.forgotPassword.mockRejectedValue(badRequestError);

      // Act & Assert
      await expect(controller.forgotPassword(forgotPasswordDto)).rejects.toThrow(badRequestError);
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(forgotPasswordDto);
    });
  });

  describe("resetPassword", () => {
    const resetPasswordDto: ResetPasswordDto = {
      token: "valid-token",
      newPassword: "newPassword123",
      confirmPassword: "newPassword123"
    };

    it("should call authService.resetPassword with correct DTO", async () => {
      // Arrange
      mockAuthService.resetPassword.mockResolvedValue(true);

      // Act
      const result = await controller.resetPassword(resetPasswordDto);

      // Assert
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
      expect(result).toBe(true);
    });

    it("should handle BadRequestException for password mismatch", async () => {
      // Arrange
      const badRequestError = new BadRequestException("Mật khẩu xác nhận không khớp");
      mockAuthService.resetPassword.mockRejectedValue(badRequestError);

      // Act & Assert
      await expect(controller.resetPassword(resetPasswordDto)).rejects.toThrow(badRequestError);
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
    });

    it("should handle BadRequestException for invalid token", async () => {
      // Arrange
      const badRequestError = new BadRequestException("Token đặt lại mật khẩu không hợp lệ");
      mockAuthService.resetPassword.mockRejectedValue(badRequestError);

      // Act & Assert
      await expect(controller.resetPassword(resetPasswordDto)).rejects.toThrow(badRequestError);
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
    });

    it("should handle BadRequestException for expired token", async () => {
      // Arrange
      const badRequestError = new BadRequestException("Token đặt lại mật khẩu đã hết hạn");
      mockAuthService.resetPassword.mockRejectedValue(badRequestError);

      // Act & Assert
      await expect(controller.resetPassword(resetPasswordDto)).rejects.toThrow(badRequestError);
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
    });
  });

  describe("validateResetToken", () => {
    const validToken = "valid-token";

    it("should call authService.validateResetToken with correct token", async () => {
      // Arrange
      mockAuthService.validateResetToken.mockResolvedValue(true);

      // Act
      const result = await controller.validateResetToken(validToken);

      // Assert
      expect(mockAuthService.validateResetToken).toHaveBeenCalledWith(validToken);
      expect(result).toBe(true);
    });

    it("should return false for invalid token", async () => {
      // Arrange
      mockAuthService.validateResetToken.mockResolvedValue(false);

      // Act
      const result = await controller.validateResetToken(validToken);

      // Assert
      expect(mockAuthService.validateResetToken).toHaveBeenCalledWith(validToken);
      expect(result).toBe(false);
    });
  });
});
