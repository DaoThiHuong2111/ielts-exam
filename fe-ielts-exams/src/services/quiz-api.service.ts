import { clientService } from '@/lib/axios';
import { MultiPartQuiz } from '@/types/multi-part-quiz';

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface QuizSession {
  id: string;
  userId: string;
  quizId: string;
  startedAt: string;
  completedAt?: string;
  timeSpent?: number;
  answers: Record<string, any>;
  score?: number;
  isCompleted: boolean;
  quiz?: {
    id: string;
    title: string;
    testType: string;
    totalTimeLimit: number;
    metadata: any;
  };
  remainingTime?: number;
}

export interface QuizAccess {
  id: string;
  userId: string;
  quizId: string;
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
  isActive: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
    name: string;
  };
}

export interface QuizStatistics {
  totalAttempts: number;
  completedAttempts: number;
  completionRate: number;
  averageScore: number;
  averageTimeMinutes: number;
}

// Filter/Query Types
export interface QuizFilter {
  testType?: 'READING' | 'LISTENING';
  isPublished?: boolean;
  isPublic?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SessionFilter {
  quizId?: string;
  isCompleted?: boolean;
}

class QuizApiService {
  private baseUrl = '/api/quiz';
  private sessionUrl = '/api/quiz-sessions';

  // ====== PUBLIC QUIZ OPERATIONS ======

  async getQuizzes(filter?: QuizFilter): Promise<PaginatedResponse<MultiPartQuiz>> {
    const { data } = await clientService.get(this.baseUrl, { params: filter });
    return data;
  }

  async getQuiz(id: string): Promise<MultiPartQuiz> {
    const response = await clientService.get(`${this.baseUrl}/${id}`);
    // Extract data from nested response structure
    const rawQuiz = response?.data?.data || response?.data || response;
    
    // Transform backend data structure to match frontend expectations
    if (rawQuiz && rawQuiz.parts) {
      rawQuiz.parts = rawQuiz.parts.map((part: any) => ({
        ...part,
        questions: part.questions.map((question: any) => {
          const baseQuestion = {
            id: question.id,
            type: question.type,
            partId: question.partId,
            questionIndex: question.questionIndex,
            questionId: question.questionId || question.id,
          };
          
          // Handle different question types with proper data transformation
          if (question.type === 'TRUE_FALSE_NOTGIVEN') {
            return {
              ...baseQuestion,
              text: question.data?.prompt || '',
              instruction: question.data?.instruction || 'Write TRUE if the statement agrees with the information\nFALSE if the statement contradicts the information\nNOT GIVEN if there is no information on this',
              correctAnswer: question.data?.correctAnswer,
            };
          }
          
          if (question.type === 'MULTIPLE_CHOICE') {
            return {
              ...baseQuestion,
              prompt: question.data?.prompt || '',
              options: question.data?.options || [],
              correctAnswer: question.data?.correctAnswer,
            };
          }
          
          if (question.type === 'SENTENCE_COMPLETION') {
            return {
              ...baseQuestion,
              text: question.data?.text || '',
              instruction: question.data?.instruction || '',
              correctAnswer: question.data?.correctAnswer,
            };
          }
          
          if (question.type === 'PARAGRAPH_MATCHING_TABLE') {
            return {
              ...baseQuestion,
              instruction: question.data?.instruction || 'Match the following characteristics with the correct paragraph.',
              items: question.data?.items || [],
              // Create options from available paragraphs (A, B, C, etc.)
              options: part.content?.paragraphs?.map((p: any) => ({
                id: p.label,
                text: p.label
              })) || [],
            };
          }
          
          if (question.type === 'DRAG_AND_DROP') {
            return {
              ...baseQuestion,
              text: question.data?.text || '',
              instruction: question.data?.instruction || '',
              correctAnswer: question.data?.correctAnswer,
            };
          }
          
          // Default: flatten all data properties
          return {
            ...baseQuestion,
            ...(question.data || {}),
          };
        })
      }));
    }
    
    return rawQuiz;
  }

  async getMyQuizzes(): Promise<MultiPartQuiz[]> {
    const { data } = await clientService.get(`${this.baseUrl}/my-quizzes`);
    return data;
  }

  // ====== ADMIN QUIZ OPERATIONS ======

  async createQuiz(quiz: Partial<MultiPartQuiz>): Promise<MultiPartQuiz> {
    const { data } = await clientService.post(this.baseUrl, quiz);
    return data;
  }

  async updateQuiz(id: string, quiz: Partial<MultiPartQuiz>): Promise<MultiPartQuiz> {
    const response = await clientService.patch(`${this.baseUrl}/${id}`, quiz);
    // Extract data from nested response structure
    const updatedQuiz = response?.data?.data || response?.data || response;
    return updatedQuiz;
  }

  async deleteQuiz(id: string): Promise<void> {
    await clientService.delete(`${this.baseUrl}/${id}`);
  }

  async togglePublish(id: string, isPublished: boolean): Promise<MultiPartQuiz> {
    const { data } = await clientService.patch(`${this.baseUrl}/${id}/publish`, { isPublished });
    return data;
  }

  async togglePublic(id: string, isPublic: boolean): Promise<MultiPartQuiz> {
    const { data } = await clientService.patch(`${this.baseUrl}/${id}/public`, { isPublic });
    return data;
  }

  async importQuiz(file: File): Promise<MultiPartQuiz> {
    const formData = new FormData();
    formData.append('file', file);
    
    const { data } = await clientService.post(`${this.baseUrl}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  }

  async exportQuiz(id: string): Promise<Blob> {
    const response = await clientService.get(`${this.baseUrl}/${id}/export`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // ====== USER ACCESS MANAGEMENT ======

  async getQuizUsers(quizId: string): Promise<QuizAccess[]> {
    const { data } = await clientService.get(`${this.baseUrl}/${quizId}/users`);
    return data;
  }

  async grantQuizAccess(
    quizId: string,
    userIds: string[],
    expiresAt?: string
  ): Promise<{ message: string; data: QuizAccess[] }> {
    const { data } = await clientService.post(`${this.baseUrl}/${quizId}/users`, {
      userIds,
      expiresAt,
    });
    return data;
  }

  async updateQuizAccess(
    quizId: string,
    userId: string,
    updates: { isActive?: boolean; expiresAt?: string }
  ): Promise<QuizAccess> {
    const { data } = await clientService.patch(`${this.baseUrl}/${quizId}/users/${userId}`, updates);
    return data;
  }

  async revokeQuizAccess(quizId: string, userId: string): Promise<void> {
    await clientService.delete(`${this.baseUrl}/${quizId}/users/${userId}`);
  }

  // ====== QUIZ SESSIONS ======

  async startQuizSession(quizId: string): Promise<QuizSession> {
    const response = await clientService.post(this.sessionUrl, { quizId });
    return response?.data?.data || response?.data || response;
  }

  async getQuizSession(sessionId: string): Promise<QuizSession> {
    const { data } = await clientService.get(`${this.sessionUrl}/${sessionId}`);
    return data;
  }

  async updateQuizSession(
    sessionId: string,
    answers: Record<string, any>,
    timeSpent?: number
  ): Promise<QuizSession> {
    const { data } = await clientService.put(`${this.sessionUrl}/${sessionId}`, {
      answers,
      timeSpent,
    });
    return data;
  }

  async submitQuizSession(
    sessionId: string,
    answers: Record<string, any>,
    timeSpent: number
  ): Promise<QuizSession & { totalQuestions: number; correctAnswers: number }> {
    const { data } = await clientService.post(`${this.sessionUrl}/${sessionId}/submit`, {
      answers,
      timeSpent,
    });
    return data;
  }

  async getUserSessions(filter?: SessionFilter): Promise<QuizSession[]> {
    const { data } = await clientService.get(`${this.sessionUrl}/my-sessions`, {
      params: filter,
    });
    return data;
  }

async getAvailableQuizzes(): Promise<MultiPartQuiz[]> {
    const { data } = await clientService.get(`${this.baseUrl}/available`);
    return data;
  }

  async getQuizSessions(): Promise<QuizSession[]> {
    const { data } = await clientService.get(`${this.sessionUrl}/my-sessions`);
    return data;
  }

  async getQuizStatistics(quizId: string): Promise<QuizStatistics> {
    const { data } = await clientService.get(`${this.sessionUrl}/quiz/${quizId}/statistics`);
    return data;
  }
}

// Export singleton instance
const quizApiService = new QuizApiService();
export default quizApiService;