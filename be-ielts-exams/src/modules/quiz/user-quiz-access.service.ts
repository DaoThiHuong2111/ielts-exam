import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GrantQuizAccessDto, UpdateQuizAccessDto } from './dto';

@Injectable()
export class UserQuizAccessService {
  constructor(private prisma: PrismaService) {}

  async grantAccess(quizId: string, dto: GrantQuizAccessDto, grantedBy: string) {
    // Check if quiz exists
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
      throw new NotFoundException('Quiz không tồn tại');
    }

    // Check if all users exist
    const users = await this.prisma.user.findMany({
      where: { id: { in: dto.userIds } },
    });

    if (users.length !== dto.userIds.length) {
      throw new BadRequestException('Một hoặc nhiều người dùng không tồn tại');
    }

    // Create access records for each user
    const accessRecords = await Promise.all(
      dto.userIds.map(userId =>
        this.prisma.userQuizAccess.upsert({
          where: {
            userId_quizId: {
              userId,
              quizId,
            },
          },
          update: {
            isActive: true,
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
            grantedBy,
          },
          create: {
            userId,
            quizId,
            grantedBy,
            isActive: true,
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                name: true,
              },
            },
          },
        })
      )
    );

    return {
      message: `Đã cấp quyền truy cập cho ${accessRecords.length} người dùng`,
      data: accessRecords,
    };
  }

  async revokeAccess(quizId: string, userId: string) {
    const access = await this.prisma.userQuizAccess.findUnique({
      where: {
        userId_quizId: {
          userId,
          quizId,
        },
      },
    });

    if (!access) {
      throw new NotFoundException('Không tìm thấy quyền truy cập');
    }

    await this.prisma.userQuizAccess.delete({
      where: {
        id: access.id,
      },
    });

    return {
      message: 'Đã thu hồi quyền truy cập',
    };
  }

  async updateAccess(quizId: string, userId: string, dto: UpdateQuizAccessDto) {
    const access = await this.prisma.userQuizAccess.findUnique({
      where: {
        userId_quizId: {
          userId,
          quizId,
        },
      },
    });

    if (!access) {
      throw new NotFoundException('Không tìm thấy quyền truy cập');
    }

    const updated = await this.prisma.userQuizAccess.update({
      where: { id: access.id },
      data: {
        isActive: dto.isActive,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return updated;
  }

  async getQuizUsers(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
      throw new NotFoundException('Quiz không tồn tại');
    }

    const accessRecords = await this.prisma.userQuizAccess.findMany({
      where: { quizId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            name: true,
            role: true,
          },
        },
        grantedByUser: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        grantedAt: 'desc',
      },
    });

    return accessRecords;
  }

  async getUserQuizzes(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const accessRecords = await this.prisma.userQuizAccess.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
      include: {
        quiz: {
          include: {
            _count: {
              select: {
                parts: true,
              },
            },
          },
        },
      },
      orderBy: {
        grantedAt: 'desc',
      },
    });

    return accessRecords.map(record => ({
      ...record.quiz,
      access: {
        grantedAt: record.grantedAt,
        expiresAt: record.expiresAt,
      },
    }));
  }

  async checkAccess(userId: string, quizId: string): Promise<boolean> {
    // Check if quiz is public
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      select: { isPublic: true },
    });

    if (!quiz) {
      return false;
    }

    if (quiz.isPublic) {
      return true;
    }

    // Check user's role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === 'ADMIN') {
      return true;
    }

    // Check specific access
    const access = await this.prisma.userQuizAccess.findUnique({
      where: {
        userId_quizId: {
          userId,
          quizId,
        },
      },
    });

    if (!access || !access.isActive) {
      return false;
    }

    if (access.expiresAt && access.expiresAt < new Date()) {
      return false;
    }

    return true;
  }
}