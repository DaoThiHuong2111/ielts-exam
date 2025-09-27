'use client'

import { useEffect, useState } from 'react'
import { QuizCard } from '@/components/quiz'
import { MultiPartQuiz } from '@/types/multi-part-quiz'
import { cn, typography } from '@/lib/design-tokens'
import { useAuth } from '@/contexts/auth-context'

export default function QuizPage() {
  const [quizzes, setQuizzes] = useState<MultiPartQuiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    fetchQuizzes()
  }, [user, isAuthenticated])

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!isAuthenticated) {
        // For non-authenticated users, only show public+published quizzes
        const response = await fetch('/api/quiz?isPublished=true&isPublic=true&limit=20')
        const data = await response.json()
        const quizzesData = data?.data || data || []
        setQuizzes(Array.isArray(quizzesData) ? quizzesData : [])
        return
      }

      // For authenticated users, let backend handle security
      // Backend will return appropriate quizzes based on user role
      const response = await fetch('/api/quiz?limit=20')
      const data = await response.json()

      // Handle nested response structure: {status, data: {data: [...]}}
      const quizzesData = data?.data?.data || data?.data || data || []
      setQuizzes(Array.isArray(quizzesData) ? quizzesData : [])
    } catch (err) {
      console.error('Failed to fetch quizzes:', err)
      setError('Không thể tải danh sách quiz. Vui lòng thử lại sau.')
      setQuizzes([])
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getDifficulty = (quiz: MultiPartQuiz) => {
    // Determine difficulty based on quiz metadata or other criteria
    if (quiz.metadata?.difficulty) {
      return quiz.metadata.difficulty
    }
    // Default difficulty based on total time
    const totalTime = quiz.parts?.reduce((sum, part) => sum + (part.timeLimit || 0), 0) || 0
    if (totalTime < 600) return 'Dễ'
    if (totalTime < 1800) return 'Trung bình'
    return 'Khó'
  }

  const getTestType = (quiz: MultiPartQuiz) => {
    return quiz.testType === 'READING' ? 'reading' : 'listening'
  }

  const getThirdStat = (quiz: MultiPartQuiz) => {
    const totalParts = quiz.parts?.length || 0
    const totalQuestions = quiz.parts?.reduce((sum, part) => sum + (part.questions?.length || 0), 0) || 0

    return {
      value: totalParts,
      label: 'Phần',
      icon: (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải quiz...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className={cn(typography.heading3, "text-gray-900 mb-2")}>Lỗi</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchQuizzes}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={cn(typography.heading2, "text-gray-900 mb-4")}>
            IELTS Practice Tests
          </h1>
          <p className={cn(typography.bodyLarge, "text-gray-600 max-w-2xl mx-auto")}>
            Luyện tập với các bài kiểm tra IELTS chất lượng cao, được thiết kế theo format đề thi thật.
          </p>
        </div>

        {/* Quiz Filters - Only show if we have quiz data */}
        {quizzes.length > 0 && (
          <div className="mb-8">
            <div className="text-center text-gray-500 text-sm">
              Lọc theo loại bài thi
            </div>
          </div>
        )}

        {/* Quiz Grid */}
        {quizzes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className={cn(typography.heading4, "text-gray-900 mb-2")}>
              Chưa có quiz nào
            </h3>
            <p className="text-gray-600">
              Hiện tại chưa có quiz nào available. Vui lòng quay lại sau.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => {
              const totalTime = quiz.parts?.reduce((sum, part) => sum + (part.timeLimit || 0), 0) || 0
              const totalQuestions = quiz.parts?.reduce((sum, part) => sum + (part.questions?.length || 0), 0) || 0

              return (
                <QuizCard
                  key={quiz.id}
                  id={quiz.id}
                  title={quiz.title || `IELTS ${quiz.testType === 'READING' ? 'Reading' : 'Listening'} Test`}
                  description={quiz.description || `Luyện tập ${quiz.testType === 'READING' ? 'Đọc hiểu' : 'Nghe hiểu'} IELTS`}
                  duration={formatDuration(totalTime)}
                  difficulty={getDifficulty(quiz)}
                  questions={totalQuestions}
                  type={getTestType(quiz)}
                  thirdStat={getThirdStat(quiz)}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}