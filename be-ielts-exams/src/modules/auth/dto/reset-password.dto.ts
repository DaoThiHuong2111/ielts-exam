import { IsNotEmpty, IsString, MinLength, Validate } from "class-validator";
import { IsStrongPasswordConstraint, IsPasswordMatchingConstraint } from "./password-validators.dto";

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: "Token không được để trống" })
  token: string;

  @IsString()
  @IsNotEmpty({ message: "Mật khẩu mới không được để trống" })
  @MinLength(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" })
  @Validate(IsStrongPasswordConstraint, {
    message: "Mật khẩu không đủ mạnh. Vui lòng sử dụng mật khẩu có chữ hoa, chữ thường, số và ký tự đặc biệt"
  })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: "Xác nhận mật khẩu không được để trống" })
  @Validate(IsPasswordMatchingConstraint, {
    message: "Mật khẩu xác nhận không khớp"
  })
  confirmPassword: string;
}
