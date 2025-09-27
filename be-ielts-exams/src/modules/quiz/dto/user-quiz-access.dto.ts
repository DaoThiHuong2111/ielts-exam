import { IsString, IsArray, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class GrantQuizAccessDto {
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class RevokeQuizAccessDto {
  @IsString()
  userId: string;
}

export class UpdateQuizAccessDto {
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}