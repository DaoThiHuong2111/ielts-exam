import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Validate } from "class-validator";
import { IsStrongPasswordConstraint, IsPasswordMatchingConstraint } from "./password-validators.dto";

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: "Họ và tên không được để trống" })
  name: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  middleName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsNotEmpty({ message: "Tên đăng nhập không được để trống" })
  @MinLength(3, { message: "Tên đăng nhập phải có ít nhất 3 ký tự" })
  username: string;

  @IsEmail({}, { message: "Email không hợp lệ" })
  @IsNotEmpty({ message: "Email không được để trống" })
  email: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsNotEmpty({ message: "Mật khẩu không được để trống" })
  @MinLength(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" })
  @Validate(IsStrongPasswordConstraint, {
    message: "Mật khẩu phải có ít nhất 8 ký tự"
  })
  password: string;

  @IsString()
  @IsNotEmpty({ message: "Xác nhận mật khẩu không được để trống" })
  @Validate(IsPasswordMatchingConstraint, {
    message: "Mật khẩu xác nhận không khớp"
  })
  confirmPassword: string;
}
