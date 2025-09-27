'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import quizApiService, { QuizSession } from '@/services/quiz-api.service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Quiz {
  id: string
  title: string
  testType: 'READING' | 'LISTENING'
  metadata: { totalQuestions: number }
  totalTimeLimit: number
  isPublic: boolean
  createdAt: string
}

export default function QuizDashboardPage() {
  const router = useRouter()
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([])
  const [recentSessions, setRecentSessions] = useState<QuizSession[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    completedQuizzes: 0,
    inProgressQuizzes: 0,
    averageScore: 0
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load available quizzes
      const quizzesResponse = await quizApiService.getAvailableQuizzes()
      const quizzesData = quizzesResponse?.data || quizzesResponse || []
      setAvailableQuizzes(quizzesData)

      // Load recent sessions
      const sessionsResponse = await quizApiService.getQuizSessions()
      const sessionsData = sessionsResponse?.data || sessionsResponse || []
      setRecentSessions(sessionsData)

      // Calculate stats
      const completedSessions = sessionsData.filter((s: QuizSession) => s.isCompleted)
      const inProgressSessions = sessionsData.filter((s: QuizSession) => !s.isCompleted)
      const totalScore = completedSessions.reduce((sum: number, s: QuizSession) => sum + (s.score || 0), 0)
      const averageScore = completedSessions.length > 0 ? totalScore / completedSessions.length : 0

      setStats({
        totalQuizzes: quizzesData.length,
        completedQuizzes: completedSessions.length,
        inProgressQuizzes: inProgressSessions.length,
        averageScore: Math.round(averageScore * 100) / 100
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuizClick = (quiz: Quiz) => {
    router.push(`/quiz/${quiz.testType.toLowerCase()}/${quiz.id}`)
  }

  const handleResumeSession = (session: QuizSession) => {
    router.push(`/quiz/${session.quiz?.testType?.toLowerCase() || 'reading'}/${session.quizId}`)
  }

  const getTestTypeLabel = (testType: string) => {
    return testType === 'READING' ? 'Đọc hiểu' : 'Nghe hiểu'
  }

  const getTestTypeColor = (testType: string) => {
    return testType === 'READING' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard IELTS</h1>
            <p className="mt-2 text-gray-600">Quản lý và theo dõi tiến độ luyện thi của bạn</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Quiz Khả Dụng</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đã Hoàn Thành</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedQuizzes}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đang Làm</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgressQuizzes}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Điểm Trung Bình</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Quizzes */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Quiz Khả Dụng</h2>
              <Button
                onClick={() => router.push('/quiz')}
                variant="outline"
                className="text-sm"
              >
                Xem Tất Cả
              </Button>
            </div>

            <div className="space-y-4">
              {availableQuizzes.length === 0 ? (
                <Card className="p-6 text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có quiz nào</h3>
                  <p className="text-gray-600">Bạn chưa được cấp quyền truy cập quiz nào.</p>
                </Card>
              ) : (
                availableQuizzes.slice(0, 5).map((quiz) => (
                  <Card key={quiz.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleQuizClick(quiz)}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTestTypeColor(quiz.testType)}`}>
                            {getTestTypeLabel(quiz.testType)}
                          </span>
                          {quiz.isPublic && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Công khai
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">{quiz.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{quiz.metadata?.totalQuestions || 0} câu</span>
                          <span>{formatTime(quiz.totalTimeLimit * 60)}</span>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Recent Sessions */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Lịch Sử Gần Đây</h2>
              <Button
                onClick={() => router.push('/quiz/sessions')}
                variant="outline"
                className="text-sm"
              >
                Xem Tất Cả
              </Button>
            </div>

            <div className="space-y-4">
              {recentSessions.length === 0 ? (
                <Card className="p-6 text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch sử</h3>
                  <p className="text-gray-600">Bạn chưa làm bài thi nào.</p>
                </Card>
              ) : (
                recentSessions.slice(0, 5).map((session) => (
                  <Card key={session.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${session.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {session.isCompleted ? 'Hoàn thành' : 'Đang làm'}
                          </span>
                          {session.score !== undefined && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {Math.round(session.score)}%
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1 truncate">
                          {session.quiz?.title || 'Quiz không xác định'}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{formatDistanceToNow(new Date(session.startedAt), { addSuffix: true, locale: vi })}</span>
                          {session.timeSpent && (
                            <span>{formatTime(session.timeSpent)}</span>
                          )}
                        </div>
                      </div>
                      {!session.isCompleted && (
                        <Button
                          onClick={() => handleResumeSession(session)}
                          size="sm"
                          className="ml-4"
                        >
                          Tiếp Tục
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}