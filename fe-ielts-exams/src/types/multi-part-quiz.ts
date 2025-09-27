// Multi-Part Quiz Type Definitions for IELTS System
// Based on IELTS Reading and Listening test structure

export interface QuizPart {
  partNumber: number
  title: string
  content: {
    title: string
    subtitle?: string
    paragraphs?: Paragraph[]
    // For listening parts
    audioUrl?: string
  }
  questions: Question[]
  // Shared drag options for groups of consecutive DRAG_AND_DROP questions
  dragOptionsGroups?: Record<string, DragOption[]>
}

export interface Paragraph {
  label: string // A, B, C, D, E, F
  text: string
}

export interface Question {
  id: string
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE_NOTGIVEN' | 'SENTENCE_COMPLETION' | 'PARAGRAPH_MATCHING_TABLE' | 'DRAG_AND_DROP' | 'TABLE_COMPLETION' | 'MULTIPLE_SELECT' | 'MATCHING_TABLE'
  prompt?: string
  text?: string
  instruction?: string
  // Question type specific properties
  options?: QuestionOption[]
  correctAnswer?: string | string[]
  paragraphLabels?: string[]

  // Listening specific properties
  tableData?: {
    headers: string[]
    rows: any[]
    options?: Record<string, string>
  }
  answers?: Record<string, string>
  maxSelections?: number
  correctAnswers?: string[]
}

export interface QuestionOption {
  id: string
  text: string
}

export interface DragOption {
  id: string
  label: string // A, B, C, D, etc.
  text: string
  isCorrect?: boolean
}

export interface MultiPartQuiz {
  id?: string // Optional ID for the quiz
  title: string
  totalTimeLimit: number // Total time for entire test (e.g., 60 minutes for Reading)
  testType: 'reading' | 'listening'
  parts: QuizPart[]
  metadata: {
    totalQuestions: number // Calculated based on expanded question count
  }
}

// State management interfaces
export interface PartProgress {
  answeredQuestions: Set<string>
  totalQuestions: number
  isCompleted: boolean
  timeSpent: number // in seconds
}

export interface MultiPartQuizState {
  currentPart: number
  answers: Record<string, string> // questionId -> answer
  partProgress: Record<number, PartProgress> // partNumber -> progress
  timeRemaining: Record<number, number> // partNumber -> seconds remaining
  overallTimeRemaining: number // seconds remaining for entire test
  isSubmitted: boolean
}

// Navigation and UI interfaces
export interface PartNavigationItem {
  partNumber: number
  title: string
  questionRange: { start: number; end: number } // Now calculated dynamically
  isCompleted: boolean
  isActive: boolean
  answeredCount: number
  totalCount: number
}