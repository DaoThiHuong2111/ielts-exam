import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { UserQuizAccessService } from './user-quiz-access.service';
import { QuizSessionService } from './quiz-session.service';
import { QuizController } from './quiz.controller';
import { QuizSessionController } from './quiz-session.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { QuizAccessGuard } from './guards/quiz-access.guard';

@Module({
  imports: [PrismaModule],
  controllers: [QuizController, QuizSessionController],
  providers: [QuizService, UserQuizAccessService, QuizSessionService, QuizAccessGuard],
  exports: [QuizService, UserQuizAccessService, QuizSessionService],
})
export class QuizModule {}
