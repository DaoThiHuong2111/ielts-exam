import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { QuizService } from './quiz.service';
import { UserQuizAccessService } from './user-quiz-access.service';
import { CreateQuizDto, UpdateQuizDto, QuizFilterDto, GrantQuizAccessDto, UpdateQuizAccessDto, ToggleQuizPublishDto, ToggleQuizPublicDto } from './dto';
import { GetCurrentUser } from 'src/decorators';
import { AccessTokenGuard } from 'src/guards';
import RoleGuard from 'src/guards/admin-role.guard';
import { QuizAccessGuard } from './guards/quiz-access.guard';
import { User, UserRole } from '@prisma/client';

@Controller({
  path: 'quizzes',
  version: '1',
})
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly userQuizAccessService: UserQuizAccessService,
  ) {}

  // ====== ADMIN ENDPOINTS ======

  @Post()
  @UseGuards(AccessTokenGuard, RoleGuard(UserRole.ADMIN))
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createQuizDto: CreateQuizDto,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.quizService.create(createQuizDto, userId);
  }

  @Post('import')
  @UseGuards(AccessTokenGuard, RoleGuard(UserRole.ADMIN))
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async importQuiz(
    @UploadedFile() file: Express.Multer.File,
    @GetCurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    const data = JSON.parse(file.buffer.toString());
    return this.quizService.importQuiz(data, userId);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard, RoleGuard(UserRole.ADMIN))
  update(
    @Param('id') id: string,
    @Body() updateQuizDto: UpdateQuizDto,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.quizService.update(id, updateQuizDto, userId);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard, RoleGuard(UserRole.ADMIN))
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.quizService.remove(id);
  }

  @Patch(':id/publish')
  @UseGuards(AccessTokenGuard, RoleGuard(UserRole.ADMIN))
  togglePublish(
    @Param('id') id: string,
    @Body() dto: ToggleQuizPublishDto,
  ) {
    return this.quizService.togglePublish(id, dto.isPublished);
  }

  @Patch(':id/public')
  @UseGuards(AccessTokenGuard, RoleGuard(UserRole.ADMIN))
  togglePublic(
    @Param('id') id: string,
    @Body() dto: ToggleQuizPublicDto,
  ) {
    return this.quizService.togglePublic(id, dto.isPublic);
  }

  // ====== USER ACCESS MANAGEMENT (ADMIN) ======

  @Get(':id/users')
  @UseGuards(AccessTokenGuard, RoleGuard(UserRole.ADMIN))
  getQuizUsers(@Param('id') id: string) {
    return this.userQuizAccessService.getQuizUsers(id);
  }

  @Post(':id/users')
  @UseGuards(AccessTokenGuard, RoleGuard(UserRole.ADMIN))
  @HttpCode(HttpStatus.CREATED)
  grantAccess(
    @Param('id') id: string,
    @Body() dto: GrantQuizAccessDto,
    @GetCurrentUser('id') grantedBy: string,
  ) {
    return this.userQuizAccessService.grantAccess(id, dto, grantedBy);
  }

  @Patch(':id/users/:userId')
  @UseGuards(AccessTokenGuard, RoleGuard(UserRole.ADMIN))
  updateAccess(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateQuizAccessDto,
  ) {
    return this.userQuizAccessService.updateAccess(id, userId, dto);
  }

  @Delete(':id/users/:userId')
  @UseGuards(AccessTokenGuard, RoleGuard(UserRole.ADMIN))
  @HttpCode(HttpStatus.OK)
  revokeAccess(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.userQuizAccessService.revokeAccess(id, userId);
  }

  // ====== PUBLIC/USER ENDPOINTS ======

  @Get()
  @UseGuards(AccessTokenGuard)
  findAll(
    @Query() filter: QuizFilterDto,
    @GetCurrentUser() user: User,
  ) {
    return this.quizService.findAll(filter, user);
  }

  @Get('my-quizzes')
  @UseGuards(AccessTokenGuard)
  getMyQuizzes(@GetCurrentUser('id') userId: string) {
    return this.userQuizAccessService.getUserQuizzes(userId);
  }

@Get('available')
  @UseGuards(AccessTokenGuard)
  getAvailableQuizzes(@GetCurrentUser('id') userId: string) {
    return this.userQuizAccessService.getUserQuizzes(userId);
  }

  @Get(':id')
  @UseGuards(AccessTokenGuard, QuizAccessGuard)
  findOne(
    @Param('id') id: string,
    @GetCurrentUser() user: User,
  ) {
    return this.quizService.findOne(id, user);
  }

  @Get(':id/export')
  @UseGuards(AccessTokenGuard, RoleGuard(UserRole.ADMIN))
  async exportQuiz(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const quiz = await this.quizService.findOne(id);
    
    // Remove IDs and metadata for clean export
    const exportData = {
      title: quiz.title,
      totalTimeLimit: quiz.totalTimeLimit,
      testType: quiz.testType,
      metadata: quiz.metadata,
      parts: quiz.parts.map(part => ({
        partNumber: part.partNumber,
        title: part.title,
        content: part.content,
        dragOptionsGroups: part.dragOptionsGroups,
        questions: part.questions.map(q => ({
          id: q.questionId,
          type: q.type,
          ...(typeof q.data === 'object' ? q.data : {}),
        })),
      })),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${quiz.title.replace(/[^a-z0-9]/gi, '_')}.json"`);
    res.send(JSON.stringify(exportData, null, 2));
  }
}