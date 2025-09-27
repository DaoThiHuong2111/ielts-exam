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

export default function ListeningGrid() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchListeningQuizzes = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/quiz')
        if (response.data.success) {
          // Filter only LISTENING quizzes
          const listeningQuizzes = response.data.data.filter((quiz: Quiz) => quiz.testType === 'LISTENING')
          setQuizzes(listeningQuizzes)
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

    fetchListeningQuizzes()
  }, [])

  const getDifficulty = (title: string) => {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes('easy') || lowerTitle.includes('dễ')) return 'Dễ' as const
    if (lowerTitle.includes('hard') || lowerTitle.includes('khó')) return 'Khó' as const
    return 'Trung bình' as const
  }

  const getSectionCount = (metadata: any) => {
    // Try to get section count from metadata, default to 4 for IELTS Listening
    return metadata?.sections || 4
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
          <p className="text-gray-600">Không có bài thi Listening nào.</p>
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
            description={`Bài thi Listening với ${quiz.metadata.totalQuestions} câu hỏi. ${quiz.isPublic ? 'Công khai' : 'Riêng tư'}.`}
            duration={`${quiz.totalTimeLimit} phút`}
            difficulty={getDifficulty(quiz.title)}
            questions={quiz.metadata.totalQuestions}
            isCompleted={false} // TODO: Check if user has completed this quiz
            type="listening"
            thirdStat={{
              value: getSectionCount(quiz.metadata),
              label: 'Sections',
              icon: (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              )
            }}
          />
        ))}
      </div>
    </div>
  )
}
