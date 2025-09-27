import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserQuizAccessService } from './user-quiz-access.service';
import { StartQuizSessionDto, UpdateQuizSessionDto, SubmitQuizSessionDto, QuizSessionFilterDto } from './dto/quiz-session.dto';

@Injectable()
export class QuizSessionService {
  constructor(
    private prisma: PrismaService,
    private userQuizAccessService: UserQuizAccessService,
  ) {}

  async startSession(userId: string, dto: StartQuizSessionDto) {
    // Check if user has access to the quiz
    const hasAccess = await this.userQuizAccessService.checkAccess(userId, dto.quizId);
    if (!hasAccess) {
      throw new ForbiddenException('Bạn không có quyền truy cập quiz này');
    }

    // Check if quiz exists
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: dto.quizId },
      select: { 
        id: true, 
        title: true, 
        isPublished: true,
        totalTimeLimit: true,
        metadata: true,
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz không tồn tại');
    }

    // Check if user is admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Only check isPublished for non-admin users
    if (user?.role !== 'ADMIN' && !quiz.isPublished) {
      throw new BadRequestException('Quiz chưa được xuất bản');
    }

    // Check for existing incomplete session
    const existingSession = await this.prisma.quizSession.findFirst({
      where: {
        userId,
        quizId: dto.quizId,
        isCompleted: false,
      },
    });

    if (existingSession) {
      // Return existing session if it's still valid (within time limit)
      const elapsedTime = Math.floor((Date.now() - existingSession.startedAt.getTime()) / 1000);
      if (elapsedTime < quiz.totalTimeLimit * 60) {
        return {
          ...existingSession,
          remainingTime: quiz.totalTimeLimit * 60 - elapsedTime,
          quiz: {
            title: quiz.title,
            totalTimeLimit: quiz.totalTimeLimit,
            metadata: quiz.metadata,
          },
        };
      }

      // Mark expired session as completed
      await this.prisma.quizSession.update({
        where: { id: existingSession.id },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          timeSpent: quiz.totalTimeLimit * 60,
        },
      });
    }

    // Create new session
    const session = await this.prisma.quizSession.create({
      data: {
        userId,
        quizId: dto.quizId,
        startedAt: new Date(),
        answers: {},
        isCompleted: false,
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            totalTimeLimit: true,
            testType: true,
            metadata: true,
          },
        },
      },
    });

    return {
      ...session,
      remainingTime: quiz.totalTimeLimit * 60,
    };
  }

  async updateSession(sessionId: string, userId: string, dto: UpdateQuizSessionDto) {
    const session = await this.prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          select: {
            totalTimeLimit: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session không tồn tại');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật session này');
    }

    if (session.isCompleted) {
      throw new BadRequestException('Session đã hoàn thành, không thể cập nhật');
    }

    // Check if session has expired
    const elapsedTime = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
    if (elapsedTime > session.quiz.totalTimeLimit * 60) {
      // Mark as completed if time is up
      return this.prisma.quizSession.update({
        where: { id: sessionId },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          timeSpent: session.quiz.totalTimeLimit * 60,
          answers: dto.answers,
        },
      });
    }

    // Update answers and time spent
    return this.prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        answers: dto.answers,
        timeSpent: dto.timeSpent || elapsedTime,
      },
    });
  }

  async submitSession(sessionId: string, userId: string, dto: SubmitQuizSessionDto) {
    const session = await this.prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          include: {
            parts: {
              include: {
                questions: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session không tồn tại');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền nộp session này');
    }

    if (session.isCompleted) {
      throw new BadRequestException('Session đã được nộp trước đó');
    }

    // Calculate score (basic implementation - can be enhanced)
    const score = this.calculateScore(session.quiz, dto.answers);

    // Update session as completed
    const updatedSession = await this.prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        answers: dto.answers,
        timeSpent: dto.timeSpent,
        score,
        isCompleted: true,
        completedAt: new Date(),
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            testType: true,
            metadata: true,
          },
        },
      },
    });

    return {
      ...updatedSession,
      totalQuestions: session.quiz.metadata?.['totalQuestions'] || 0,
      correctAnswers: Math.round((score / 100) * (session.quiz.metadata?.['totalQuestions'] || 0)),
    };
  }

  async getSession(sessionId: string, userId: string) {
    const session = await this.prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            testType: true,
            totalTimeLimit: true,
            metadata: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session không tồn tại');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem session này');
    }

    // Calculate remaining time if session is not completed
    let remainingTime = 0;
    if (!session.isCompleted) {
      const elapsedTime = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
      remainingTime = Math.max(0, session.quiz.totalTimeLimit * 60 - elapsedTime);
    }

    return {
      ...session,
      remainingTime,
    };
  }

  async getUserSessions(userId: string, filter?: QuizSessionFilterDto) {
    const where: any = { userId };

    if (filter?.quizId) {
      where.quizId = filter.quizId;
    }

    if (filter?.isCompleted !== undefined) {
      where.isCompleted = filter.isCompleted;
    }

    const sessions = await this.prisma.quizSession.findMany({
      where,
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            testType: true,
            metadata: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return sessions;
  }

  async getQuizStatistics(quizId: string) {
    const [totalAttempts, completedAttempts, averageScore, averageTime] = await Promise.all([
      this.prisma.quizSession.count({
        where: { quizId },
      }),
      this.prisma.quizSession.count({
        where: { quizId, isCompleted: true },
      }),
      this.prisma.quizSession.aggregate({
        where: { quizId, isCompleted: true, score: { not: null } },
        _avg: { score: true },
      }),
      this.prisma.quizSession.aggregate({
        where: { quizId, isCompleted: true, timeSpent: { not: null } },
        _avg: { timeSpent: true },
      }),
    ]);

    return {
      totalAttempts,
      completedAttempts,
      completionRate: totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0,
      averageScore: averageScore._avg.score || 0,
      averageTimeMinutes: averageTime._avg.timeSpent ? Math.round(averageTime._avg.timeSpent / 60) : 0,
    };
  }

  private calculateScore(quiz: any, answers: Record<string, any>): number {
    let correctAnswers = 0;
    let totalQuestions = 0;

    // Iterate through all parts and questions
    for (const part of quiz.parts) {
      for (const question of part.questions) {
        totalQuestions++;
        const userAnswer = answers[question.questionId];
        const correctAnswer = question.data?.correctAnswer || question.data?.correctAnswers;

        if (!userAnswer) continue;

        // Check answer based on question type
        switch (question.type) {
          case 'MULTIPLE_CHOICE':
          case 'TRUE_FALSE_NOTGIVEN':
          case 'SENTENCE_COMPLETION':
            if (userAnswer === correctAnswer) {
              correctAnswers++;
            }
            break;

          case 'MULTIPLE_SELECT':
            if (Array.isArray(correctAnswer)) {
              const userAnswerArray = userAnswer.split(',').sort();
              const correctAnswerArray = correctAnswer.sort();
              if (JSON.stringify(userAnswerArray) === JSON.stringify(correctAnswerArray)) {
                correctAnswers++;
              }
            }
            break;

          case 'PARAGRAPH_MATCHING_TABLE':
          case 'MATCHING_TABLE':
            // Complex matching logic - simplified for now
            if (JSON.stringify(userAnswer) === JSON.stringify(correctAnswer)) {
              correctAnswers++;
            }
            break;

          default:
            // For other types, do simple comparison
            if (userAnswer === correctAnswer) {
              correctAnswers++;
            }
        }
      }
    }

    // Calculate percentage score
    return totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  }
}