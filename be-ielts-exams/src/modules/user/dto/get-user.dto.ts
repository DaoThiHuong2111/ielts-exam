import { UserRole } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";
import { IQuery } from "src/dto/query";

export class GetUserDto extends IQuery {
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsOptional()
  active?: number;

  @IsOptional()
  name?: string;
}
