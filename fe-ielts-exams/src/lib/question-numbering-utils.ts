/**
 * Centralized utility functions for question numbering in multi-part quizzes
 * Handles continuous numbering across all parts based on JSON structure
 */

import { MultiPartQuiz, Question, QuizPart } from '@/types/multi-part-quiz'

/**
 * Calculate the number of "expanded" questions for a single question
 * Some question types count as multiple questions (e.g., table completion, multiple select)
 */
export function getExpandedQuestionCount(question: Question): number {
  switch (question.type) {
    case 'TABLE_COMPLETION':
      if (question.tableData?.rows) {
        let count = 0
        question.tableData.rows.forEach((row: any) => {
          count += Object.keys(row.answers || {}).length
        })
        return count
      }
      return 1

    case 'MATCHING_TABLE':
      if (question.tableData?.rows) {
        return question.tableData.rows.length
      }
      return 1

    case 'MULTIPLE_SELECT':
      // For MULTIPLE_SELECT, count should be based on maxSelections, not total options
      return question.maxSelections || 1

    case 'PARAGRAPH_MATCHING_TABLE':
      // Count the number of items in the matching table
      return question.items?.length || 1

    default:
      return 1
  }
}

/**
 * Calculate the total number of expanded questions for a part
 */
export function getPartExpandedQuestionCount(part: QuizPart): number {
  return part.questions.reduce((total, question) => {
    return total + getExpandedQuestionCount(question)
  }, 0)
}

/**
 * Calculate the total number of expanded questions for the entire quiz
 */
export function getTotalExpandedQuestionCount(quiz: MultiPartQuiz): number {
  return quiz.parts.reduce((total, part) => {
    return total + getPartExpandedQuestionCount(part)
  }, 0)
}

/**
 * Get the starting question number for a specific part
 */
export function getPartStartingQuestionNumber(quiz: MultiPartQuiz, targetPartNumber: number): number {
  let questionNumber = 1
  
  for (const part of quiz.parts) {
    if (part.partNumber === targetPartNumber) {
      break
    }
    questionNumber += getPartExpandedQuestionCount(part)
  }
  
  return questionNumber
}

/**
 * Get the question range (start and end) for a specific part
 */
export function getPartQuestionRange(quiz: MultiPartQuiz, partNumber: number): { start: number; end: number } {
  const startNumber = getPartStartingQuestionNumber(quiz, partNumber)
  const part = quiz.parts.find(p => p.partNumber === partNumber)
  
  if (!part) {
    return { start: startNumber, end: startNumber }
  }
  
  const partCount = getPartExpandedQuestionCount(part)
  return {
    start: startNumber,
    end: startNumber + partCount - 1
  }
}

/**
 * Get the starting question number for a specific question within a part
 */
export function getQuestionStartingNumber(quiz: MultiPartQuiz, partNumber: number, questionId: string): number {
  const partStartNumber = getPartStartingQuestionNumber(quiz, partNumber)
  const part = quiz.parts.find(p => p.partNumber === partNumber)
  
  if (!part) {
    return partStartNumber
  }
  
  let questionNumber = partStartNumber
  
  for (const question of part.questions) {
    if (question.id === questionId) {
      break
    }
    questionNumber += getExpandedQuestionCount(question)
  }
  
  return questionNumber
}

/**
 * Get all question numbers for a specific question (useful for multi-input questions)
 */
export function getQuestionNumbers(quiz: MultiPartQuiz, partNumber: number, questionId: string): number[] {
  const startNumber = getQuestionStartingNumber(quiz, partNumber, questionId)
  const part = quiz.parts.find(p => p.partNumber === partNumber)
  const question = part?.questions.find(q => q.id === questionId)
  
  if (!question) {
    return [startNumber]
  }
  
  const count = getExpandedQuestionCount(question)
  return Array.from({ length: count }, (_, i) => startNumber + i)
}

/**
 * Generate question input keys for table-based questions
 * Format: {questionId}_{rowIndex}_{answerKey} or {questionId}_{answerKey}
 */
export function generateTableInputKeys(questionId: string, tableData: any): string[] {
  const keys: string[] = []
  
  if (tableData?.rows) {
    tableData.rows.forEach((row: any, rowIndex: number) => {
      if (row.answers) {
        Object.keys(row.answers).forEach(answerKey => {
          keys.push(`${questionId}_${rowIndex}_${answerKey}`)
        })
      }
    })
  }
  
  return keys
}
