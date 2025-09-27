import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserQuizAccessService } from '../user-quiz-access.service';

@Injectable()
export class QuizAccessGuard implements CanActivate {
  constructor(private userQuizAccessService: UserQuizAccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const quizId = request.params.id || request.params.quizId;

    if (!user) {
      throw new ForbiddenException('Vui lòng đăng nhập để truy cập');
    }

    if (!quizId) {
      return true; // No quiz ID to check, allow through
    }

    const hasAccess = await this.userQuizAccessService.checkAccess(user.id, quizId);

    if (!hasAccess) {
      throw new ForbiddenException('Bạn không có quyền truy cập quiz này');
    }

    return true;
  }
}