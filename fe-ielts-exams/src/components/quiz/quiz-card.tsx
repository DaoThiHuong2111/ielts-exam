'use client'

import { cn, typography } from '@/lib/design-tokens'
import Link from 'next/link'

interface QuizCardProps {
  id: string
  title: string
  description: string
  duration: string
  difficulty: 'Dễ' | 'Trung bình' | 'Khó'
  questions: number
  isCompleted?: boolean
  
  // Customizable props
  type: 'listening' | 'reading'
  thirdStat: {
    value: number
    label: string
    icon: React.ReactNode
  }
}

export default function QuizCard({
  id,
  title,
  description,
  duration,
  difficulty,
  questions,
  isCompleted = false,
  type,
  thirdStat
}: QuizCardProps) {
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'Dễ':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'Trung bình':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'Khó':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getIcon = () => {
    if (type === 'listening') {
      return (
        <svg 
          className="w-6 h-6 text-blue-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 9a3 3 0 000 6h6a3 3 0 000-6H9z" 
          />
        </svg>
      )
    } else {
      return (
        <svg 
          className="w-6 h-6 text-blue-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
          />
        </svg>
      )
    }
  }

  const getHref = () => `/quiz/${type}/${id}`

  return (
    <Link href={getHref()}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors">
                {getIcon()}
              </div>
              <div>
                <h3 className={cn(typography.heading4, "text-gray-800 group-hover:text-blue-600 transition-colors")}>
                  {title}
                </h3>
                <span className={cn(
                  "inline-block px-2 py-1 rounded-full text-xs font-medium border",
                  getDifficultyColor(difficulty)
                )}>
                  {difficulty}
                </span>
              </div>
            </div>
            
            {isCompleted && (
              <div className="flex items-center gap-1 text-green-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-medium">Hoàn thành</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className={cn(typography.bodySmall, "text-gray-500 font-medium")}>
                  {duration}
                </span>
              </div>
              <span className="text-xs text-gray-400">Thời gian</span>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className={cn(typography.bodySmall, "text-gray-500 font-medium")}>
                  {questions}
                </span>
              </div>
              <span className="text-xs text-gray-400">Câu hỏi</span>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                {thirdStat.icon}
                <span className={cn(typography.bodySmall, "text-gray-500 font-medium")}>
                  {thirdStat.value}
                </span>
              </div>
              <span className="text-xs text-gray-400">{thirdStat.label}</span>
            </div>
          </div>

          {/* Action */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <span className={cn(typography.bodySmall, "text-blue-600 font-medium group-hover:text-blue-700")}>
              {isCompleted ? 'Làm lại' : 'Bắt đầu'}
            </span>
            <svg 
              className="w-4 h-4 text-blue-600 group-hover:text-blue-700 group-hover:translate-x-1 transition-all" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}
