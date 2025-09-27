import { IsString, IsOptional, IsBoolean, IsNumber, IsObject } from 'class-validator';

export class StartQuizSessionDto {
  @IsString()
  quizId: string;
}

export class UpdateQuizSessionDto {
  @IsObject()
  answers: Record<string, any>;

  @IsOptional()
  @IsNumber()
  timeSpent?: number;
}

export class SubmitQuizSessionDto {
  @IsObject()
  answers: Record<string, any>;

  @IsNumber()
  timeSpent: number;
}

export class QuizSessionFilterDto {
  @IsOptional()
  @IsString()
  quizId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}