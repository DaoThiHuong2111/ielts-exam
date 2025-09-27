import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuizSessionService } from './quiz-session.service';
import { StartQuizSessionDto, UpdateQuizSessionDto, SubmitQuizSessionDto, QuizSessionFilterDto } from './dto/quiz-session.dto';
import { GetCurrentUser } from 'src/decorators';
import { AccessTokenGuard } from 'src/guards';
import RoleGuard from 'src/guards/admin-role.guard';
import { UserRole } from '@prisma/client';

@Controller({
  path: 'quiz-sessions',
  version: '1',
})
export class QuizSessionController {
  constructor(private readonly quizSessionService: QuizSessionService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.CREATED)
  startSession(
    @GetCurrentUser('id') userId: string,
    @Body() dto: StartQuizSessionDto,
  ) {
    return this.quizSessionService.startSession(userId, dto);
  }

  @Get('my-sessions')
  @UseGuards(AccessTokenGuard)
  getUserSessions(
    @GetCurrentUser('id') userId: string,
    @Query() filter: QuizSessionFilterDto,
  ) {
    return this.quizSessionService.getUserSessions(userId, filter);
  }

  @Get(':id')
  @UseGuards(AccessTokenGuard)
  getSession(
    @Param('id') id: string,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.quizSessionService.getSession(id, userId);
  }

  @Put(':id')
  @UseGuards(AccessTokenGuard)
  updateSession(
    @Param('id') id: string,
    @GetCurrentUser('id') userId: string,
    @Body() dto: UpdateQuizSessionDto,
  ) {
    return this.quizSessionService.updateSession(id, userId, dto);
  }

  @Post(':id/submit')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  submitSession(
    @Param('id') id: string,
    @GetCurrentUser('id') userId: string,
    @Body() dto: SubmitQuizSessionDto,
  ) {
    return this.quizSessionService.submitSession(id, userId, dto);
  }

  @Get('quiz/:quizId/statistics')
  @UseGuards(AccessTokenGuard, RoleGuard(UserRole.ADMIN))
  getQuizStatistics(@Param('quizId') quizId: string) {
    return this.quizSessionService.getQuizStatistics(quizId);
  }
}