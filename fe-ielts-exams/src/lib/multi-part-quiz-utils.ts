import {
    MultiPartQuiz,
    MultiPartQuizState,
    PartNavigationItem,
    PartProgress,
    Question,
    QuizPart
} from '@/types/multi-part-quiz'
import {
  getTotalExpandedQuestionCount,
  getPartExpandedQuestionCount,
  getExpandedQuestionCount,
  getPartQuestionRange
} from './question-numbering-utils'

/**
 * Get the current part based on a question ID
 */
export const getCurrentPartByQuestionId = (quiz: MultiPartQuiz, questionId: string): QuizPart | null => {
  for (const part of quiz.parts) {
    if (part.questions.some(q => q.id === questionId)) {
      return part
    }
  }
  return null
}

/**
 * Get part by part number
 */
export const getPartByNumber = (quiz: MultiPartQuiz, partNumber: number): QuizPart | null => {
  return quiz.parts.find(part => part.partNumber === partNumber) || null
}

/**
 * Get all questions for a specific part
 */
export const getQuestionsByPart = (quiz: MultiPartQuiz, partNumber: number): Question[] => {
  const part = getPartByNumber(quiz, partNumber)
  return part ? part.questions : []
}

/**
 * Get total answered questions in a specific part
 */
export const getTotalAnsweredInPart = (
  answers: Record<string, string>, 
  part: QuizPart
): number => {
  return part.questions.filter(question => {
    const answer = answers[question.id]
    return answer && answer.trim() !== ''
  }).length
}

/**
 * Check if a part is completed (all questions answered)
 */
export const isPartCompleted = (
  answers: Record<string, string>, 
  part: QuizPart
): boolean => {
  return getTotalAnsweredInPart(answers, part) === part.questions.length
}

/**
 * Get progress for a specific part
 */
export const getPartProgress = (
  answers: Record<string, string>, 
  part: QuizPart
): PartProgress => {
  const answeredQuestions = new Set(
    part.questions
      .filter(q => answers[q.id] && answers[q.id].trim() !== '')
      .map(q => q.id)
  )

  return {
    answeredQuestions,
    totalQuestions: part.questions.length,
    isCompleted: answeredQuestions.size === part.questions.length,
    timeSpent: 0 // This would be tracked separately
  }
}

/**
 * Get navigation items for all parts
 */
export const getPartNavigationItems = (
  quiz: MultiPartQuiz,
  answers: Record<string, string>,
  currentPart: number
): PartNavigationItem[] => {
  return quiz.parts.map(part => {
    const questionRange = getPartQuestionRange(quiz, part.partNumber)
    const totalExpandedCount = getPartExpandedQuestionCount(part)

    // Count answered expanded questions for this part
    let answeredExpandedCount = 0
    part.questions.forEach(question => {
      const expandedCount = getExpandedQuestionCount(question)
      const answer = answers[question.id]

      if (answer && answer.trim() !== '') {
        // For multi-input questions, count based on actual inputs filled
        if (question.type === 'TABLE_COMPLETION' && question.tableData?.rows) {
          // Count filled table inputs
          let filledInputs = 0
          question.tableData.rows.forEach((row: any) => {
            Object.keys(row.answers || {}).forEach(answerKey => {
              const inputKey = `${question.id}_${answerKey}`
              if (answers[inputKey] && answers[inputKey].trim() !== '') {
                filledInputs++
              }
            })
          })
          answeredExpandedCount += filledInputs
        } else if (question.type === 'MULTIPLE_SELECT') {
          // Count selected options
          const selectedOptions = answer.split(',').filter(opt => opt.trim() !== '')
          answeredExpandedCount += Math.min(selectedOptions.length, expandedCount)
        } else if (question.type === 'PARAGRAPH_MATCHING_TABLE') {
          // Count answered items in paragraph matching table
          let answeredItems = 0
          if (question.items) {
            question.items.forEach((item: any) => {
              const itemKey = `${question.id}_${item.id}`
              if (answers[itemKey] && answers[itemKey].trim() !== '') {
                answeredItems++
              }
            })
          }
          answeredExpandedCount += answeredItems
        } else {
          // Regular questions count as full expanded count if answered
          answeredExpandedCount += expandedCount
        }
      }
    })

    return {
      partNumber: part.partNumber,
      title: part.title,
      questionRange,
      isCompleted: answeredExpandedCount === totalExpandedCount,
      isActive: part.partNumber === currentPart,
      answeredCount: answeredExpandedCount,
      totalCount: totalExpandedCount
    }
  })
}

/**
 * Get all answered questions across all parts
 */
export const getAllAnsweredQuestions = (
  quiz: MultiPartQuiz, 
  answers: Record<string, string>
): Set<string> => {
  const answeredQuestions = new Set<string>()
  
  quiz.parts.forEach(part => {
    part.questions.forEach(question => {
      if (answers[question.id] && answers[question.id].trim() !== '') {
        answeredQuestions.add(question.id)
      }
    })
  })
  
  return answeredQuestions
}

/**
 * Get total progress across all parts using expanded question count
 */
export const getTotalProgress = (
  quiz: MultiPartQuiz,
  answers: Record<string, string>
): { answeredCount: number; totalCount: number; percentage: number } => {
  // Count answered expanded questions
  let answeredCount = 0
  const totalQuestions = getTotalExpandedQuestionCount(quiz)

  quiz.parts.forEach(part => {
    part.questions.forEach(question => {
      const expandedCount = getExpandedQuestionCount(question)
      const answer = answers[question.id]

      if (answer && answer.trim() !== '') {
        // For multi-input questions, count based on actual inputs filled
        if (question.type === 'TABLE_COMPLETION' && question.tableData?.rows) {
          // Count filled table inputs
          let filledInputs = 0
          question.tableData.rows.forEach((row: any) => {
            Object.keys(row.answers || {}).forEach(answerKey => {
              const inputKey = `${question.id}_${answerKey}`
              if (answers[inputKey] && answers[inputKey].trim() !== '') {
                filledInputs++
              }
            })
          })
          answeredCount += filledInputs
        } else if (question.type === 'MULTIPLE_SELECT') {
          // Count selected options
          const selectedOptions = answer.split(',').filter(opt => opt.trim() !== '')
          answeredCount += Math.min(selectedOptions.length, expandedCount)
        } else if (question.type === 'PARAGRAPH_MATCHING_TABLE') {
          // Count answered items in paragraph matching table
          let answeredItems = 0
          if (question.items) {
            question.items.forEach((item: any) => {
              const itemKey = `${question.id}_${item.id}`
              if (answers[itemKey] && answers[itemKey].trim() !== '') {
                answeredItems++
              }
            })
          }
          answeredCount += answeredItems
        } else {
          // Regular questions count as 1 if answered
          answeredCount += expandedCount
        }
      }
    })
  })

  return {
    answeredCount,
    totalCount: totalQuestions,
    percentage: Math.round((answeredCount / totalQuestions) * 100)
  }
}

/**
 * Initialize multi-part quiz state
 */
export const initializeMultiPartQuizState = (quiz: MultiPartQuiz): MultiPartQuizState => {
  const partProgress: Record<number, PartProgress> = {}
  const timeRemaining: Record<number, number> = {}
  
  quiz.parts.forEach(part => {
    partProgress[part.partNumber] = {
      answeredQuestions: new Set(),
      totalQuestions: getPartExpandedQuestionCount(part),
      isCompleted: false,
      timeSpent: 0
    }
    // Since timeLimit is removed, use equal distribution of total time
    const timePerPart = Math.floor(quiz.totalTimeLimit / quiz.parts.length)
    timeRemaining[part.partNumber] = timePerPart * 60 // Convert to seconds
  })
  
  return {
    currentPart: 1,
    answers: {},
    partProgress,
    timeRemaining,
    overallTimeRemaining: quiz.totalTimeLimit * 60, // Convert to seconds
    isSubmitted: false
  }
}

/**
 * Get question number within current part
 */
export const getPartLocalQuestionNumber = (
  quiz: MultiPartQuiz, 
  questionId: string
): number | null => {
  for (const part of quiz.parts) {
    const questionIndex = part.questions.findIndex(q => q.id === questionId)
    if (questionIndex >= 0) {
      return questionIndex + 1
    }
  }
  return null
}

/**
 * Get global question number
 */
export const getGlobalQuestionNumber = (
  quiz: MultiPartQuiz, 
  questionId: string
): number | null => {
  let globalIndex = 1
  for (const part of quiz.parts) {
    const questionIndex = part.questions.findIndex(q => q.id === questionId)
    if (questionIndex >= 0) {
      return globalIndex + questionIndex
    }
    globalIndex += part.questions.length
  }
  return null
}

/**
 * Validate quiz structure
 */
export const validateQuizStructure = (quiz: MultiPartQuiz): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  // Check if parts exist
  if (!quiz.parts || quiz.parts.length === 0) {
    errors.push("Quiz must have at least one part")
  }
  
  // Check question numbering consistency
  let expectedGlobalNumber = 1
  quiz.parts.forEach((part, partIndex) => {
    // Calculate the expected range for this part dynamically
    const calculatedRange = getPartQuestionRange(quiz, part.partNumber)
    
    if (calculatedRange.start !== expectedGlobalNumber) {
      errors.push(`Part ${partIndex + 1} question range start should be ${expectedGlobalNumber}, but calculated as ${calculatedRange.start}`)
    }
    
    part.questions.forEach((question, qIndex) => {
      // Basic validation - just ensure question has required fields
      if (!question.id) {
        errors.push(`Question at part ${part.partNumber}, index ${qIndex} missing id`)
      }
      if (!question.type) {
        errors.push(`Question ${question.id} missing type`)
      }
      expectedGlobalNumber++
    })
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}