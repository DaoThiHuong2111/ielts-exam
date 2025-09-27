'use client'

import { getPartNavigationItems } from '@/lib/multi-part-quiz-utils'
import { MultiPartQuiz, type PartNavigationItem } from '@/types/multi-part-quiz'

interface PartNavigationProps {
  quiz: MultiPartQuiz
  answers: Record<string, string>
  currentPart: number
  onPartChange: (partNumber: number) => void
  className?: string
}

export default function PartNavigation({
  quiz,
  answers,
  currentPart,
  onPartChange,
  className = ''
}: PartNavigationProps) {
  const navigationItems = getPartNavigationItems(quiz, answers, currentPart)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {navigationItems.map((item) => (
        <button
          key={item.partNumber}
          onClick={() => onPartChange(item.partNumber)}
          className={`
            relative px-4 py-2 rounded-lg text-sm font-medium border transition-colors
            ${item.isActive 
              ? 'bg-blue-500 text-white border-blue-500' 
              : item.isCompleted
                ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
            }
          `}
          title={`${item.title} (${item.answeredCount}/${item.totalCount} answered)`}
        >
          <div className="flex flex-col items-center">
            <span>Part {item.partNumber}</span>
            <span className="text-xs opacity-75">
              {item.answeredCount}/{item.totalCount}
            </span>
          </div>
          
          {/* Completion indicator */}
          {item.isCompleted && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>
      ))}
      
      {/* Overall progress indicator */}
      <div className="ml-4 text-sm text-gray-500">
        <span className="font-medium">
          {navigationItems.reduce((acc, item) => acc + item.answeredCount, 0)}/
          {navigationItems.reduce((acc, item) => acc + item.totalCount, 0)} 
        </span>
        <span className="ml-1">answered</span>
      </div>
    </div>
  )
}

// Part Navigation Item component (for use in QuizFooter)
interface PartNavigationItemProps {
  item: PartNavigationItem
  onPartChange: (partNumber: number) => void
}

export function PartNavigationItem({ item, onPartChange }: PartNavigationItemProps) {
  return (
    <button
      onClick={() => onPartChange(item.partNumber)}
      className={`
        px-3 py-1 rounded text-xs font-medium border transition-colors
        ${item.isActive 
          ? 'bg-blue-500 text-white border-blue-500' 
          : item.isCompleted
            ? 'bg-green-100 text-green-700 border-green-300'
            : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
        }
      `}
    >
      Part {item.partNumber}
    </button>
  )
}

// Compact Part Selector (for mobile/small screens)
interface CompactPartSelectorProps {
  quiz: MultiPartQuiz
  answers: Record<string, string>
  currentPart: number
  onPartChange: (partNumber: number) => void
}

export function CompactPartSelector({
  quiz,
  answers,
  currentPart,
  onPartChange
}: CompactPartSelectorProps) {
  const navigationItems = getPartNavigationItems(quiz, answers, currentPart)

  return (
    <div className="relative">
      <select
        value={currentPart}
        onChange={(e) => onPartChange(parseInt(e.target.value))}
        className="appearance-none bg-white border border-gray-300 rounded px-4 py-2 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {navigationItems.map((item) => (
          <option key={item.partNumber} value={item.partNumber}>
            Part {item.partNumber} ({item.answeredCount}/{item.totalCount})
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}