import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto, UpdateQuizDto, QuizFilterDto } from './dto';
import { User } from '@prisma/client';
import { USER_ROLES, QUIZ_FILTERS, QUIZ_STATUS } from '../../constants';

@Injectable()
export class QuizService {
  constructor(private prisma: PrismaService) {}

  async create(createQuizDto: CreateQuizDto, userId: string) {
    const { parts, ...quizData } = createQuizDto;

    // Calculate total questions
    const totalQuestions = parts.reduce(
      (total, part) => total + part.questions.length,
      0
    );

    return this.prisma.quiz.create({
      data: {
        ...quizData,
        metadata: {
          ...quizData.metadata,
          totalQuestions,
        },
        createdById: userId,
        parts: {
          create: parts.map(part => ({
            partNumber: part.partNumber,
            title: part.title,
            content: part.content || {},
            dragOptionsGroups: part.dragOptionsGroups,
            questions: {
              create: part.questions.map(q => ({
                questionIndex: q.questionIndex,
                questionId: q.questionId,
                type: q.type,
                data: q.data || {},
              })),
            },
          })),
        },
      },
      include: {
        parts: {
          include: {
            questions: true,
          },
          orderBy: {
            partNumber: 'asc',
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(filter: QuizFilterDto, user?: User) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      testType,
      isPublished,
      isPublic,
    } = filter;

    const skip = (page - 1) * limit;
    const where: any = {};

    // Apply basic filters (search, testType) for all users
    if (search) {
      where.title = { contains: search };
    }
    if (testType) {
      where.testType = testType;
    }

    // Apply security-based filtering based on user role
    if (user && user.role === 'ADMIN') {
      // Admin can see all quizzes, ignore isPublished/isPublic filters from frontend
      // Admin can still use search and testType filters for convenience
      console.log('Admin accessing all quizzes');
    } else if (user) {
      // Regular users can only see:
      // 1. Public AND published quizzes
      // 2. Quizzes they have been granted access to
      console.log('Regular user accessing quizzes, applying security filters');

      // Override frontend filters - only show public+published or granted access
      where.OR = [
        {
          isPublic: true,
          isPublished: true,
        },
        {
          userQuizAccess: {
            some: {
              userId: user.id,
              isActive: true,
              OR: [
                { expiresAt: null },
                { expiresAt: { gte: new Date() } },
              ],
            },
          },
        },
      ];
    } else {
      // Non-authenticated users can only see public AND published quizzes
      console.log('Anonymous user accessing quizzes, showing only public+published');
      where.isPublic = true;
      where.isPublished = true;
    }

    const [quizzes, total] = await Promise.all([
      this.prisma.quiz.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          _count: {
            select: {
              parts: true,
              quizSessions: true,
              userQuizAccess: true,
            },
          },
        },
      }),
      this.prisma.quiz.count({ where }),
    ]);

    return {
      data: quizzes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user?: User) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        parts: {
          include: {
            questions: {
              orderBy: {
                questionIndex: 'asc',
              },
            },
          },
          orderBy: {
            partNumber: 'asc',
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        userQuizAccess: user ? {
          where: {
            userId: user.id,
          },
        } : false,
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz không tồn tại');
    }

    // Check access permissions
    if (user && user.role !== 'ADMIN') {
      const hasAccess = quiz.isPublic || 
        (quiz.userQuizAccess && quiz.userQuizAccess.length > 0 &&
         quiz.userQuizAccess[0].isActive &&
         (!quiz.userQuizAccess[0].expiresAt || quiz.userQuizAccess[0].expiresAt > new Date()));

      if (!hasAccess) {
        throw new ForbiddenException('Bạn không có quyền truy cập quiz này');
      }
    }

    return quiz;
  }

  async update(id: string, updateQuizDto: UpdateQuizDto, userId: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });

    if (!quiz) {
      throw new NotFoundException('Quiz không tồn tại');
    }

    const { parts, ...quizData } = updateQuizDto;

    // If parts are being updated, handle the nested updates
    if (parts) {
      // Delete existing parts and questions
      await this.prisma.question.deleteMany({
        where: {
          part: {
            quizId: id,
          },
        },
      });
      await this.prisma.quizPart.deleteMany({
        where: { quizId: id },
      });

      // Calculate total questions
      const totalQuestions = parts.reduce(
        (total, part) => total + part.questions.length,
        0
      );

      // Create new parts and questions
      return this.prisma.quiz.update({
        where: { id },
        data: {
          ...quizData,
          metadata: {
            ...quizData.metadata,
            totalQuestions,
          },
          parts: {
            create: parts.map(part => ({
              partNumber: part.partNumber,
              title: part.title,
              content: part.content || {},
              dragOptionsGroups: part.dragOptionsGroups,
              questions: {
                create: part.questions.map(q => ({
                  questionIndex: q.questionIndex,
                  questionId: q.questionId,
                  type: q.type,
                  data: q.data || {},
                })),
              },
            })),
          },
        },
        include: {
          parts: {
            include: {
              questions: true,
            },
            orderBy: {
              partNumber: 'asc',
            },
          },
        },
      });
    }

    // Update without parts
    return this.prisma.quiz.update({
      where: { id },
      data: quizData,
      include: {
        parts: {
          include: {
            questions: true,
          },
          orderBy: {
            partNumber: 'asc',
          },
        },
      },
    });
  }

  async remove(id: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });

    if (!quiz) {
      throw new NotFoundException('Quiz không tồn tại');
    }

    // Cascade delete will handle parts, questions, sessions, and access records
    await this.prisma.quiz.delete({ where: { id } });

    return { message: 'Quiz đã được xóa thành công' };
  }

  async togglePublish(id: string, isPublished: boolean) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });

    if (!quiz) {
      throw new NotFoundException('Quiz không tồn tại');
    }

    return this.prisma.quiz.update({
      where: { id },
      data: { isPublished },
    });
  }

  async togglePublic(id: string, isPublic: boolean) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });

    if (!quiz) {
      throw new NotFoundException('Quiz không tồn tại');
    }

    return this.prisma.quiz.update({
      where: { id },
      data: { isPublic },
    });
  }

  // Import quiz from JSON
  async importQuiz(data: any, userId: string) {
    try {
      const createDto = this.validateImportData(data);
      return this.create(createDto, userId);
    } catch (error) {
      throw new BadRequestException(`Import failed: ${error.message}`);
    }
  }

  private validateImportData(data: any): CreateQuizDto {
    // Basic validation for imported data
    if (!data.title || !data.testType || !data.parts) {
      throw new Error('Missing required fields');
    }

    if (!Array.isArray(data.parts) || data.parts.length === 0) {
      throw new Error('Quiz must have at least one part');
    }

    // Transform to match DTO structure
    return {
      title: data.title,
      totalTimeLimit: data.totalTimeLimit || 60,
      testType: data.testType,
      metadata: data.metadata || {},
      isPublished: false, // Default to unpublished for imports
      isPublic: false,
      parts: data.parts.map((part: any) => ({
        partNumber: part.partNumber,
        title: part.title,
        content: part.content || {},
        dragOptionsGroups: part.dragOptionsGroups,
        questions: (part.questions || []).map((q: any, index: number) => ({
          questionIndex: index,
          questionId: q.id || `q${index + 1}`,
          type: q.type,
          data: {
            prompt: q.prompt,
            text: q.text,
            instruction: q.instruction,
            options: q.options,
            correctAnswer: q.correctAnswer,
            correctAnswers: q.correctAnswers,
            paragraphLabels: q.paragraphLabels,
            tableData: q.tableData,
            answers: q.answers,
            maxSelections: q.maxSelections,
          },
        })),
      })),
    };
  }
}