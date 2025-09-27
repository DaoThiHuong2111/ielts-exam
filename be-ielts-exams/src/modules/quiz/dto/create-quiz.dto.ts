import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, ValidateNested, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { TestType, QuestionType } from '@prisma/client';

export class CreateQuestionDto {
  @IsNumber()
  questionIndex: number;

  @IsString()
  questionId: string;

  @IsEnum(QuestionType)
  type: QuestionType;

  @IsOptional()
  data?: any; // JSON data for question-specific fields
}

export class CreateQuizPartDto {
  @IsNumber()
  partNumber: number;

  @IsString()
  title: string;

  @IsOptional()
  content?: any; // JSON content

  @IsOptional()
  dragOptionsGroups?: any; // JSON for drag options

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}

export class CreateQuizDto {
  @IsString()
  title: string;

  @IsNumber()
  @Min(1)
  @Max(180)
  totalTimeLimit: number;

  @IsEnum(TestType)
  testType: TestType;

  @IsOptional()
  metadata?: any;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizPartDto)
  parts: CreateQuizPartDto[];
}