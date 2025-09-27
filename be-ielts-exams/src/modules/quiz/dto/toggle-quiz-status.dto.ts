import { IsBoolean } from 'class-validator';

export class ToggleQuizPublishDto {
  @IsBoolean()
  isPublished: boolean;
}

export class ToggleQuizPublicDto {
  @IsBoolean()
  isPublic: boolean;
}