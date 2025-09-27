'use client'

import { cn, typography } from '@/lib/design-tokens'
import QuizCard from '../quiz/quiz-card'
import { useEffect, useState } from 'react'
import axios from 'axios'

interface Quiz {
  id: string
  title: string
  totalTimeLimit: number
  testType: string
  metadata: {
    totalQuestions: number
  }
  isPublished: boolean
  isPublic: boolean
  createdAt: string
}

export default function ReadingGrid() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReadingQuizzes = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/quiz')
        if (response.data.success) {
          // Filter only READING quizzes
          const readingQuizzes = response.data.data.filter((quiz: Quiz) => quiz.testType === 'READING')
          setQuizzes(readingQuizzes)
        } else {
          setError('Failed to load quizzes')
        }
      } catch (err) {
        console.error('Error fetching quizzes:', err)
        setError('Error loading quizzes')
      } finally {
        setLoading(false)
      }
    }

    fetchReadingQuizzes()
  }, [])

  const getDifficulty = (title: string) => {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes('easy') || lowerTitle.includes('dễ')) return 'Dễ' as const
    if (lowerTitle.includes('hard') || lowerTitle.includes('khó')) return 'Khó' as const
    return 'Trung bình' as const
  }

  const getPassageCount = (metadata: any) => {
    // Try to get passage count from metadata, default to 3 for IELTS Reading
    return metadata?.passages || 3
  }

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className={cn(typography.heading2, "text-gray-800 mb-6")}>
          Danh sách bài thi
        </h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải danh sách bài thi...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-8">
        <h2 className={cn(typography.heading2, "text-gray-800 mb-6")}>
          Danh sách bài thi
        </h2>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (quizzes.length === 0) {
    return (
      <div className="mb-8">
        <h2 className={cn(typography.heading2, "text-gray-800 mb-6")}>
          Danh sách bài thi
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-600">Không có bài thi Reading nào.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <h2 className={cn(typography.heading2, "text-gray-800 mb-6")}>
        Danh sách bài thi
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <QuizCard
            key={quiz.id}
            id={quiz.id}
            title={quiz.title}
            description={`Bài thi Reading với ${quiz.metadata.totalQuestions} câu hỏi. ${quiz.isPublic ? 'Công khai' : 'Riêng tư'}.`}
            duration={`${quiz.totalTimeLimit} phút`}
            difficulty={getDifficulty(quiz.title)}
            questions={quiz.metadata.totalQuestions}
            isCompleted={false} // TODO: Check if user has completed this quiz
            type="reading"
            thirdStat={{
              value: getPassageCount(quiz.metadata),
              label: 'Passages',
              icon: (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              )
            }}
          />
        ))}
      </div>
    </div>
  )
}
