import { Question } from '@/types/multi-part-quiz'

/**
 * Validate if user's answer is correct for a given question
 * @param question - The question object with correct answer(s)
 * @param userAnswer - User's answer (string or comma-separated string for multiple select)
 * @returns boolean indicating if the answer is correct
 */
export const validateQuestionAnswer = (question: Question, userAnswer: string): boolean => {
  if (!userAnswer || !question.correctAnswer) return false

  switch (question.type) {
    case 'MULTIPLE_SELECT':
      // For MULTIPLE_SELECT, correctAnswer is an array and userAnswer is comma-separated string
      if (Array.isArray(question.correctAnswer)) {
        const userAnswers = userAnswer.split(',').filter(Boolean).sort()
        const correctAnswers = question.correctAnswer.sort()
        
        // Check if arrays are equal (same length and all elements match)
        return userAnswers.length === correctAnswers.length && 
               userAnswers.every((answer, index) => answer === correctAnswers[index])
      }
      return false
    
    case 'MULTIPLE_CHOICE':
    case 'TRUE_FALSE_NOTGIVEN':
      // For single-choice questions, correctAnswer is a string
      if (typeof question.correctAnswer === 'string') {
        return userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
      }
      return false
    
    case 'SENTENCE_COMPLETION':
    case 'PARAGRAPH_MATCHING_TABLE':
      // For text-based answers, case-insensitive comparison
      if (typeof question.correctAnswer === 'string') {
        return userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
      }
      return false
    
    case 'TABLE_COMPLETION':
      // TABLE_COMPLETION uses answers object in tableData, handled separately
      return false
    
    case 'MATCHING_TABLE':
      // MATCHING_TABLE uses correctAnswer from tableData rows, handled separately
      return false
    
    case 'DRAG_AND_DROP':
      // For drag and drop, correctAnswer is typically an option ID
      if (typeof question.correctAnswer === 'string') {
        return userAnswer === question.correctAnswer
      }
      return false
    
    default:
      console.warn(`Validation not implemented for question type: ${question.type}`)
      return false
  }
}

/**
 * Calculate score for a quiz part
 * @param questions - Array of questions in the part
 * @param userAnswers - Object with questionId as key and answer as value
 * @returns object with correct count, total count, and percentage
 */
export const calculatePartScore = (
  questions: Question[], 
  userAnswers: Record<string, string>
): { correct: number; total: number; percentage: number } => {
  let correct = 0
  const total = questions.length
  
  questions.forEach(question => {
    const userAnswer = userAnswers[question.id]
    if (userAnswer && validateQuestionAnswer(question, userAnswer)) {
      correct++
    }
  })
  
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0
  
  return { correct, total, percentage }
}

/**
 * Calculate overall quiz score
 * @param parts - Array of quiz parts with questions
 * @param userAnswers - Object with questionId as key and answer as value
 * @returns object with overall score details
 */
export const calculateOverallScore = (
  parts: { questions: Question[] }[],
  userAnswers: Record<string, string>
): {
  correct: number
  total: number
  percentage: number
  partScores: Array<{ correct: number; total: number; percentage: number }>
} => {
  const partScores = parts.map(part => calculatePartScore(part.questions, userAnswers))
  
  const correct = partScores.reduce((sum, score) => sum + score.correct, 0)
  const total = partScores.reduce((sum, score) => sum + score.total, 0)
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0
  
  return { correct, total, percentage, partScores }
}