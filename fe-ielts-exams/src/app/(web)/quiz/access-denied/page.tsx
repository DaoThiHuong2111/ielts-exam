'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import quizApiService from '@/services/quiz-api.service'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function AccessDeniedPage() {
  const router = useRouter()
  const [availableQuizzes, setAvailableQuizzes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAvailableQuizzes()
  }, [])

  const loadAvailableQuizzes = async () => {
    try {
      const response = await quizApiService.getAvailableQuizzes()
      setAvailableQuizzes(response?.data || response || [])
    } catch (error) {
      console.error('Failed to load available quizzes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleContactAdmin = () => {
    // In a real app, this could open a contact form or email client
    alert('Vui lòng liên hệ quản trị viên để được cấp quyền truy cập quiz.')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Access Denied Card */}
        <Card className="p-6 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Truy Cập Bị Từ Chối
            </h1>
            <p className="text-gray-600 mb-6">
              Bạn không có quyền truy cập quiz này. Vui lòng liên hệ quản trị viên để được cấp quyền.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleContactAdmin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Liên Hệ Quản Trị Viên
            </Button>
            <Button
              onClick={() => router.push('/quiz')}
              variant="outline"
              className="w-full"
            >
              Quay Lại Danh Sách Quiz
            </Button>
          </div>
        </Card>

        {/* Available Quizzes Section */}
        {availableQuizzes.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Quiz Bạn Có Thể Truy Cập</h2>
            <div className="space-y-3">
              {availableQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => router.push(`/quiz/${quiz.testType.toLowerCase()}/${quiz.id}`)}
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{quiz.title}</h3>
                    <p className="text-sm text-gray-600">
                      {quiz.testType === 'READING' ? 'Đọc hiểu' : 'Nghe hiểu'} • {quiz.metadata?.totalQuestions || 0} câu
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải quiz khả dụng...</p>
          </Card>
        )}

        {/* No Available Quizzes */}
        {!loading && availableQuizzes.length === 0 && (
          <Card className="p-6 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chưa Có Quiz Khả Dụng
            </h3>
            <p className="text-gray-600 mb-4">
              Bạn chưa được cấp quyền truy cập bất kỳ quiz nào.
            </p>
            <Button
              onClick={handleContactAdmin}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Yêu Cầu Quyền Truy Cập
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}