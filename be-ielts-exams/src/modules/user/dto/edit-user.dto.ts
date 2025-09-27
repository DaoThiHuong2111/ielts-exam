import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from "class-validator";
import { UserRole } from "@prisma/client";

export class EditUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
