'use client'

import { useCallback, useState } from 'react'

interface Question {
  id: string
  questionNumber: number
  type: string
}

interface QuizAnswer {
  questionId: string
  answer: string | string[] | number
  timestamp: number
}

interface UseQuizStateProps {
  questions: Question[]
  onSubmit?: (answers: QuizAnswer[]) => void
}

export function useQuizState({ questions, onSubmit }: UseQuizStateProps) {
  const [answers, setAnswers] = useState<Map<string, QuizAnswer>>(new Map())
  const [currentQuestionId, setCurrentQuestionId] = useState<string>(questions[0]?.id || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get answered questions as Set for easy lookup
  const answeredQuestions = new Set(answers.keys())

  // Answer a question
  const answerQuestion = useCallback((questionId: string, answer: string | string[] | number) => {
    setAnswers(prev => {
      const newAnswers = new Map(prev)
      newAnswers.set(questionId, {
        questionId,
        answer,
        timestamp: Date.now()
      })
      return newAnswers
    })
  }, [])

  // Navigate to specific question
  const goToQuestion = useCallback((questionId: string) => {
    const question = questions.find(q => q.id === questionId)
    if (question) {
      setCurrentQuestionId(questionId)
    }
  }, [questions])

  // Navigate to next question
  const goToNextQuestion = useCallback(() => {
    const currentIndex = questions.findIndex(q => q.id === currentQuestionId)
    if (currentIndex < questions.length - 1) {
      setCurrentQuestionId(questions[currentIndex + 1].id)
    }
  }, [questions, currentQuestionId])

  // Navigate to previous question
  const goToPreviousQuestion = useCallback(() => {
    const currentIndex = questions.findIndex(q => q.id === currentQuestionId)
    if (currentIndex > 0) {
      setCurrentQuestionId(questions[currentIndex - 1].id)
    }
  }, [questions, currentQuestionId])

  // Get current question
  const getCurrentQuestion = useCallback(() => {
    return questions.find(q => q.id === currentQuestionId)
  }, [questions, currentQuestionId])

  // Get answer for specific question
  const getAnswerForQuestion = useCallback((questionId: string) => {
    return answers.get(questionId)
  }, [answers])

  // Submit quiz
  const submitQuiz = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const answersArray = Array.from(answers.values())
      await onSubmit?.(answersArray)
    } catch (error) {
      console.error('Failed to submit quiz:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [answers, onSubmit])

  // Get quiz progress
  const getProgress = useCallback(() => {
    return {
      answered: answers.size,
      total: questions.length,
      percentage: (answers.size / questions.length) * 100
    }
  }, [answers.size, questions.length])

  return {
    // State
    answers,
    currentQuestionId,
    answeredQuestions,
    isSubmitting,
    
    // Actions
    answerQuestion,
    goToQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    submitQuiz,
    
    // Getters
    getCurrentQuestion,
    getAnswerForQuestion,
    getProgress
  }
}