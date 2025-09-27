'use client'

import { useState, useEffect, use, useCallback, useRef } from 'react'
import { DragDropQuestion, QuizContentWithSelection } from '@/components/quiz'
import QuizFooter from '@/components/quiz/quiz-footer'
import QuizHeader from '@/components/quiz/quiz-header'
import ResizablePanel from '@/components/ui/resizable-panel'
import {
  getAllAnsweredQuestions,
  getPartByNumber,
  getQuestionsByPart,
  initializeMultiPartQuizState
} from '@/lib/multi-part-quiz-utils'
import { getQuestionStartingNumber } from '@/lib/question-numbering-utils'
import { MultiPartQuiz, MultiPartQuizState, Paragraph, Question, QuestionOption } from '@/types/multi-part-quiz'
import toast from 'react-hot-toast'
import quizApiService, { QuizSession } from '@/services/quiz-api.service'
import { useRouter } from 'next/navigation'

interface ReadingQuizDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ReadingQuizDetailPage({ params }: ReadingQuizDetailPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  
  // State management
  const [isClient, setIsClient] = useState(false)
  const [quiz, setQuiz] = useState<MultiPartQuiz | null>(null)
  const [quizState, setQuizState] = useState<MultiPartQuizState | null>(null)
  const [session, setSession] = useState<QuizSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const initializeQuizSession = useCallback(async () => {
    try {
      setLoading(true)

      // Load quiz data
      const response = await quizApiService.getQuiz(resolvedParams.id)
      console.log('Quiz API response:', response)

      // Extract quiz data from API response
      const quizData = response?.data || response
      console.log('Extracted quiz data:', quizData)

      if (!quizData) {
        toast.error('Quiz không tồn tại')
        router.push('/quiz')
        return
      }

      // Check if quiz has required structure
      if (!quizData.parts || !Array.isArray(quizData.parts)) {
        console.error('Quiz missing parts array:', quizData)
        toast.error('Quiz data không hợp lệ - missing parts')
        return
      }

      setQuiz(quizData)

      // Start or resume session
      console.log('Starting quiz session for quiz ID:', resolvedParams.id)
      const sessionResponse = await quizApiService.startQuizSession(resolvedParams.id)
      console.log('Session creation response:', sessionResponse)

      // Extract session data from API response
      const sessionData = sessionResponse?.data || sessionResponse
      console.log('Extracted session data:', sessionData)
      setSession(sessionData)

      // Initialize quiz state with existing answers
      const state = initializeMultiPartQuizState(quizData)
      if (sessionData.answers) {
        state.answers = sessionData.answers
      }
      if (sessionData.remainingTime) {
        state.overallTimeRemaining = sessionData.remainingTime
      }
      setQuizState(state)

      if (!sessionData.isCompleted) {
        toast.success('Phiên làm bài đã được khởi tạo')
      }
    } catch (error: any) {
      console.error('Failed to initialize quiz session:', error)
      if (error.response?.status === 403) {
        toast.error('Bạn không có quyền truy cập quiz này')
        router.push('/quiz')
      } else {
        toast.error('Không thể khởi tạo phiên làm bài')
      }
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.id, router])

  // Initialize quiz data and create session
  useEffect(() => {
    setIsClient(true)
    initializeQuizSession()
  }, [initializeQuizSession])

  // Timer effect to update remaining time
  useEffect(() => {
    if (!quizState || !session || session.isCompleted) return

    const timer = setInterval(() => {
      setQuizState(prev => {
        if (!prev || prev.overallTimeRemaining <= 0) {
          // Auto-submit when time's up
          if (prev?.overallTimeRemaining === 1) {
            handleSubmit()
          }
          return prev
        }
        
        return {
          ...prev,
          overallTimeRemaining: Math.max(0, prev.overallTimeRemaining - 1)
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [quizState !== null, session])

  // Auto-save answers every 30 seconds
  const autoSaveAnswers = useCallback(async () => {
    if (!session || !quizState || session.isCompleted) return

    try {
      const timeSpent = quiz ? (quiz.totalTimeLimit * 60) - quizState.overallTimeRemaining : 0
      await quizApiService.updateQuizSession(
        session.id,
        quizState.answers,
        timeSpent
      )
      console.log('Auto-saved answers')
    } catch (error) {
      console.error('Failed to auto-save:', error)
    }
  }, [session, quizState, quiz])

  // Debounced auto-save
  useEffect(() => {
    if (!quizState || !session || session.isCompleted) return

    // Clear previous timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveAnswers()
    }, 30000) // 30 seconds

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [quizState?.answers, autoSaveAnswers])

  // Event handlers
  const handleAnswerChange = (questionId: string, value: string) => {
    if (!quizState || session?.isCompleted) return
    
    setQuizState(prev => ({
      ...prev!,
      answers: {
        ...prev!.answers,
        [questionId]: value
      }
    }))
  }

  const handlePartChange = (partNumber: number) => {
    if (!quizState) return
    
    setQuizState(prev => ({
      ...prev!,
      currentPart: partNumber
    }))
  }

  const handleQuestionClick = (questionId: string) => {
    if (!quiz) return
    
    for (const part of quiz.parts) {
      if (part.questions.some(q => q.id === questionId)) {
        if (quizState?.currentPart !== part.partNumber) {
          handlePartChange(part.partNumber)
        }
        
        setTimeout(() => {
          const element = document.getElementById(`question-${questionId}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
        break
      }
    }
  }

  const handleSubmit = async () => {
    if (!quizState || !quiz || !session || session.isCompleted) return
    
    const confirmSubmit = window.confirm(
      `Bạn có chắc chắn muốn nộp bài không?\n\nĐã trả lời: ${
        Object.keys(quizState.answers).length
      }/${quiz.metadata.totalQuestions} câu`
    )
    
    if (!confirmSubmit) return

    try {
      setSubmitting(true)
      const timeSpent = (quiz.totalTimeLimit * 60) - quizState.overallTimeRemaining
      
      const result = await quizApiService.submitQuizSession(
        session.id,
        quizState.answers,
        timeSpent
      )
      
      toast.success(`Bài thi đã được nộp thành công!`)
      
      // Show score if available
      if (result.score !== undefined) {
        alert(
          `Kết quả:\n\n` +
          `Điểm: ${result.score}%\n` +
          `Số câu đúng: ${result.correctAnswers}/${result.totalQuestions}\n` +
          `Thời gian: ${Math.floor(timeSpent / 60)} phút ${timeSpent % 60} giây`
        )
      }
      
      // Redirect to quiz list or results page
      router.push('/quiz')
    } catch (error) {
      console.error('Failed to submit quiz:', error)
      toast.error('Không thể nộp bài. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (!isClient || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Đang tải quiz...</div>
      </div>
    )
  }

  if (!quiz || !quizState || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Không thể tải quiz</div>
      </div>
    )
  }

  const currentPartData = getPartByNumber(quiz, quizState.currentPart)
  
  if (!currentPartData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Không tìm thấy dữ liệu phần thi</div>
      </div>
    )
  }
  
  const currentPartQuestions = getQuestionsByPart(quiz, quizState.currentPart)

  // Question group rendering logic (similar to original)
  interface QuestionGroup {
    type: string
    questions: Question[]
    startIndex: number
    instruction?: string
  }

  const groupConsecutiveQuestions = (questions: Question[]): QuestionGroup[] => {
    if (!questions || questions.length === 0) {
      return []
    }
    
    const groups: QuestionGroup[] = []
    let currentGroup: QuestionGroup | null = null
    
    questions.forEach((question, index) => {
      const shouldGroupWithPrevious = currentGroup && 
        currentGroup.type === question.type &&
        ((question.type === 'SENTENCE_COMPLETION' &&
          currentGroup.questions.length > 0 &&
          currentGroup.questions[currentGroup.questions.length - 1].text === question.text) ||
         question.type === 'PARAGRAPH_MATCHING_TABLE')
      
      if (!currentGroup || (currentGroup.type !== question.type && !shouldGroupWithPrevious)) {
        currentGroup = {
          type: question.type,
          questions: [question],
          startIndex: index,
          instruction: question.instruction
        }
        groups.push(currentGroup)
      } else {
        currentGroup.questions.push(question)
      }
    })
    
    return groups
  }

  const questionGroups = groupConsecutiveQuestions(currentPartQuestions)

  // Render functions for different question types
  const renderQuestionGroup = (group: QuestionGroup) => {
    
    switch (group.type) {
      case 'MULTIPLE_CHOICE':
        const question = group.questions[0]
        return (
          <div className="space-y-3">
            <p className="font-medium">{question.prompt}</p>
            <div className="space-y-2">
              {question.options?.map((option: QuestionOption) => (
                <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name={question.id}
                    value={option.id}
                    checked={quizState.answers[question.id] === option.id}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    disabled={session.isCompleted}
                    className="w-4 h-4"
                    suppressHydrationWarning
                  />
                  <span className="text-sm">{option.text}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 'TRUE_FALSE_NOTGIVEN':
        return (
          <div className="space-y-4">
            {group.instruction && <p className="text-sm text-black font-bold">{group.instruction}</p>}
            {group.questions.map((question: Question, index: number) => {
              const questionNumber = getQuestionStartingNumber(quiz!, quizState.currentPart, question.id)
              return (
              <div key={question.id} className="border-l-2 border-gray-200 pl-4">
                <p className="mb-2">
                  <span className="font-medium">{questionNumber}.</span> {question.text}
                </p>
                <div className="flex flex-col space-y-2">
                  {['TRUE', 'FALSE', 'NOT GIVEN'].map((option) => (
                    <label key={option} className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={quizState.answers[question.id] === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        disabled={session.isCompleted}
                        className="w-4 h-4"
                        suppressHydrationWarning
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              )
            })}
          </div>
        )

      case 'SENTENCE_COMPLETION':
        // Check if all questions in group have the same text (grouped questions)
        const firstQuestionText = group.questions[0]?.text || ''
        const hasIdenticalText = group.questions.length > 1 && 
          group.questions.every(q => q.text === firstQuestionText)
        
        if (hasIdenticalText) {
          // Handle grouped questions with identical text
          const allCorrectAnswers = group.questions
            .map(q => {
              if (Array.isArray(q.correctAnswer)) {
                return q.correctAnswer[0] || ''
              }
              return String(q.correctAnswer || '')
            })
            .filter(Boolean)
          
          const baseQuestionNumber = getQuestionStartingNumber(quiz!, quizState.currentPart, group.questions[0].id)
          
          // Split text by all possible answers to find blanks
          let parts = [firstQuestionText]
          let textboxCounter = 0
          
          allCorrectAnswers.forEach((answer: string) => {
            if (answer && typeof answer === 'string' && answer.trim()) {
              const newParts: string[] = []
              parts.forEach(part => {
                if (typeof part === 'string') {
                  const splitParts = part.split(new RegExp(answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'))
                  newParts.push(...splitParts)
                } else {
                  newParts.push(part)
                }
              })
              parts = newParts
            }
          })
          
          return (
            <div className="space-y-4">
              {group.instruction && <p className="text-sm text-black font-bold">{group.instruction}</p>}
              <div className="flex flex-wrap items-center gap-1 mb-3">
                {parts.map((part: string, index: number) => (
                  <span key={index} className="inline-flex items-center">
                    <span>{part}</span>
                    {index < parts.length - 1 && (() => {
                      const questionIndex = textboxCounter
                      textboxCounter++
                      const currentQuestion = group.questions[questionIndex] || group.questions[0]
                      const questionNumber = baseQuestionNumber + questionIndex
                      
                      return (
                        <input
                          type="text"
                          placeholder={questionNumber.toString()}
                          value={quizState.answers[currentQuestion.id] || ''}
                          onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                          disabled={session.isCompleted}
                          className="border border-gray-300 rounded px-2 py-1 mx-1 w-40 text-center inline-block"
                          suppressHydrationWarning
                        />
                      )
                    })()}
                  </span>
                ))}
              </div>
            </div>
          )
        } else {
          // Handle individual questions
          return (
            <div className="space-y-4">
              {group.instruction && <p className="text-sm text-black font-bold">{group.instruction}</p>}
              {group.questions.map((question: Question) => {
                const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer || '']
                const text = question.text || ''
                
                const baseQuestionNumber = getQuestionStartingNumber(quiz!, quizState.currentPart, question.id)
                
                // Split text by all possible answers to find blanks
                let parts = [text]
                let blankCounter = 0
                
                correctAnswers.forEach((answer: string) => {
                  if (answer.trim()) {
                    const newParts: string[] = []
                    parts.forEach(part => {
                      if (typeof part === 'string') {
                        const splitParts = part.split(new RegExp(answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'))
                        newParts.push(...splitParts)
                      } else {
                        newParts.push(part)
                      }
                    })
                    parts = newParts
                  }
                })
                
                const numberOfBlanks = Math.max(1, correctAnswers.length)
                
                return (
                  <div key={question.id} className="flex flex-wrap items-center gap-1 mb-3">
                    {text.includes('_') ? (
                      // Handle underscore-style blanks
                      text.split(/(_+)/).map((part: string, index: number) => {
                        if (part.match(/^_+$/)) {
                          blankCounter++
                          const questionNumber = numberOfBlanks > 1 ? 
                            `${baseQuestionNumber + blankCounter - 1}` : 
                            baseQuestionNumber.toString()
                          
                          return (
                            <input
                              key={index}
                              type="text"
                              placeholder={questionNumber}
                              value={quizState.answers[`${question.id}_${blankCounter}`] || quizState.answers[question.id] || ''}
                              onChange={(e) => {
                                const answerKey = numberOfBlanks > 1 ? `${question.id}_${blankCounter}` : question.id
                                handleAnswerChange(answerKey, e.target.value)
                              }}
                              disabled={session.isCompleted}
                              className="border border-gray-300 rounded px-2 py-1 mx-1 w-40 text-center inline-block"
                              suppressHydrationWarning
                            />
                          )
                        }
                        return <span key={index}>{part}</span>
                      })
                    ) : (
                      // Handle word replacement style
                      parts.map((part: string, index: number) => (
                        <span key={index} className="inline-flex items-center">
                          <span>{part}</span>
                          {index < parts.length - 1 && (
                            <input
                              type="text"
                              placeholder={baseQuestionNumber.toString()}
                              value={quizState.answers[question.id] || ''}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                              disabled={session.isCompleted}
                              className="border border-gray-300 rounded px-2 py-1 mx-1 w-40 text-center inline-block"
                              suppressHydrationWarning
                            />
                          )}
                        </span>
                      ))
                    )}
                  </div>
                )
              })}
            </div>
          )
        }

      case 'PARAGRAPH_MATCHING_TABLE':
        // All paragraph matching questions in one table
        const firstQuestion = group.questions[0]
        const availableOptions = firstQuestion.options || []
        const optionCount = availableOptions.length || 0
        const gridTemplate = optionCount > 0 ? `2fr ${Array(optionCount).fill('1fr').join(' ')}` : '1fr'
        
        return (
          <div className="space-y-4">
            {group.instruction && <p className="text-sm text-gray-600 mb-4">{group.instruction}</p>}
            <div className="border border-gray-200 rounded overflow-hidden">
              {/* Table Header */}
              <div className="grid bg-blue-500 text-white" style={{gridTemplateColumns: gridTemplate}}>
                <div className="p-3 font-medium border-r border-blue-400">Questions</div>
                {availableOptions.map((option: any) => (
                  <div key={option.id} className="p-1 flex items-center justify-center font-medium text-xs border-r border-blue-400 last:border-r-0">
                    {option.text || option.id}
                  </div>
                ))}
              </div>
              
              {/* Table Rows */}
              {firstQuestion.items?.map((item: any, index: number) => {
                const questionNumber = getQuestionStartingNumber(quiz!, quizState.currentPart, firstQuestion.id) + index
                const itemId = `${firstQuestion.id}_${item.id}`
                
                return (
                <div key={item.id} id={`question-${itemId}`} className={`grid ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-200 last:border-b-0`} style={{gridTemplateColumns: gridTemplate}}>
                  <div className="p-3 border-r border-gray-200 text-sm">
                    <span className="font-medium">{questionNumber}.</span> {item.text}
                  </div>
                  {availableOptions.map((option: any) => (
                    <div key={option.id} className="p-1 flex items-center justify-center border-r border-gray-200 last:border-r-0">
                      <input
                        type="radio"
                        name={itemId}
                        value={option.id}
                        checked={quizState.answers[itemId] === option.id}
                        onChange={(e) => handleAnswerChange(itemId, e.target.value)}
                        disabled={session.isCompleted}
                        className="w-4 h-4"
                        suppressHydrationWarning
                      />
                    </div>
                  ))}
                </div>
                )
              })}
            </div>
          </div>
        )

      case 'TABLE_COMPLETION':
        const tableQuestion = group.questions[0]
        const tableData = tableQuestion.tableData
        if (!tableData) return null
        
        return (
          <div className="space-y-4">
            {tableQuestion.instruction && (
              <p className="text-sm text-gray-600 mb-4">{tableQuestion.instruction}</p>
            )}
            <div className="border border-gray-200 rounded overflow-hidden">
              {/* Table Headers */}
              <div className="grid bg-blue-500 text-white" style={{gridTemplateColumns: `repeat(${tableData.headers.length}, 1fr)`}}>
                {tableData.headers.map((header: string, index: number) => (
                  <div key={index} className="p-3 font-medium border-r border-blue-400 last:border-r-0">
                    {header}
                  </div>
                ))}
              </div>
              
              {/* Table Rows */}
              {tableData.rows?.map((row: any, rowIndex: number) => {
                return (
                  <div key={rowIndex} className={`grid ${rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-200 last:border-b-0`} style={{gridTemplateColumns: `repeat(${tableData.headers.length}, 1fr)`}}>
                    {row.cells.map((cell: string, cellIndex: number) => {
                      const questionNumber = getQuestionStartingNumber(quiz!, quizState.currentPart, tableQuestion.id) + rowIndex
                      
                      // Check if this cell is an input field
                      if (cell === '_____' || cell.includes('_____')) {
                        // Create unique answer key for this cell
                        const answerKey = `${tableQuestion.id}_${rowIndex}_${cellIndex}`
                        
                        return (
                          <div key={cellIndex} className="p-3 border-r border-gray-200 last:border-r-0">
                            <input
                              type="text"
                              placeholder={`${questionNumber}`}
                              value={quizState.answers[answerKey] || ''}
                              onChange={(e) => handleAnswerChange(answerKey, e.target.value)}
                              disabled={session.isCompleted}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-center"
                              suppressHydrationWarning
                            />
                          </div>
                        )
                      }
                      
                      // Regular cell
                      return (
                        <div key={cellIndex} className="p-3 border-r border-gray-200 last:border-r-0 text-sm">
                          {cell}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 'MULTIPLE_SELECT':
        return (
          <div className="space-y-4">
            {group.questions.map((question) => {
              const questionNumber = getQuestionStartingNumber(quiz!, quizState.currentPart, question.id)
              const currentAnswers = quizState.answers[question.id]?.split(',').filter(Boolean) || []
              const maxSelections = question.maxSelections || question.options?.length || 0
              
              return (
                <div key={question.id} id={`question-${question.id}`} className="space-y-3">
                  <div className="font-medium">
                    Question {questionNumber}: {question.prompt}
                  </div>
                  
                  {question.instruction && (
                    <p className="text-sm text-gray-600">{question.instruction}</p>
                  )}
                  
                  <div className="space-y-2">
                    {question.options?.map((option: QuestionOption) => {
                      const isSelected = currentAnswers.includes(option.id)
                      const canSelect = isSelected || currentAnswers.length < maxSelections
                      
                      return (
                        <div key={option.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`${question.id}-${option.id}`}
                            checked={isSelected}
                            disabled={!canSelect || session.isCompleted}
                            onChange={(e) => {
                              const newAnswers = e.target.checked 
                                ? [...currentAnswers, option.id]
                                : currentAnswers.filter(id => id !== option.id)
                              handleAnswerChange(question.id, newAnswers.join(','))
                            }}
                            className="w-4 h-4"
                          />
                          <label 
                            htmlFor={`${question.id}-${option.id}`}
                            className={`text-sm cursor-pointer ${
                              !canSelect && !isSelected ? 'text-gray-400' : 'text-gray-900'
                            }`}
                          >
                            {option.text}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                  
                  {maxSelections > 0 && (
                    <p className="text-xs text-gray-500">
                      Selected: {currentAnswers.length}/{maxSelections}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )

      case 'DRAG_AND_DROP':
        return (
          <DragDropQuestion
            questions={group.questions}
            answers={quizState.answers}
            onAnswerChange={handleAnswerChange}
            isClient={isClient}
            currentPartData={currentPartData!}
            allPartQuestions={currentPartData!.questions}
            startingQuestionNumber={getQuestionStartingNumber(quiz!, quizState.currentPart, group.questions[0].id)}
          />
        )
        
      default:
        return (
          <div className="space-y-4">
            {group.questions.map((q) => {
              const questionNumber = getQuestionStartingNumber(quiz!, quizState.currentPart, q.id)
              return (
                <div key={q.id} id={`question-${q.id}`}>
                  <div className="font-medium mb-2">
                    Question {questionNumber}: {q.prompt || q.text}
                  </div>
                  <input
                    type="text"
                    value={quizState.answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    disabled={session.isCompleted}
                    className="border rounded px-3 py-2 w-full"
                    placeholder="Your answer..."
                  />
                </div>
              )
            })}
          </div>
        )
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <QuizHeader
        quiz={quiz}
        currentPart={quizState.currentPart}
        answers={quizState.answers}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
        overallTimeLeft={quizState.overallTimeRemaining}
      />

      {/* Main Content - 2 column layout with resizable panels */}
      <main className="flex-1 min-h-0">
        <ResizablePanel>
          {/* Left Side - Reading Passage for Current Part */}
          <div className="h-full overflow-y-auto p-6">
            <QuizContentWithSelection 
              containerId={`reading-passage-part-${quizState.currentPart}`}
              className="prose prose-sm max-w-none"
            >
              <div className="space-y-6">
                {currentPartData.content && (
                  <>
                    <div className="text-center">
                      <h2 className="text-xl font-bold mb-2">{currentPartData.content.title || 'Reading Passage'}</h2>
                      {currentPartData.content.subtitle && (
                        <p className="text-gray-600 italic">{currentPartData.content.subtitle}</p>
                      )}
                    </div>
                    
                    {currentPartData.content.paragraphs?.map((paragraph: Paragraph) => (
                      <div key={paragraph.label} className="mb-4">
                        <p className="text-black leading-relaxed">
                          {/* Only show label if there are multiple paragraphs */}
                          {currentPartData.content.paragraphs && currentPartData.content.paragraphs.length > 1 && (
                            <span className="font-bold text-xl text-black bg-white mr-1">{paragraph.label}</span>
                          )}
                          {paragraph.text}
                        </p>
                      </div>
                    ))}
                  </>
                )}
                {!currentPartData.content && (
                  <div className="text-center text-gray-500">
                    <p>No content available for this part</p>
                  </div>
                )}
              </div>
            </QuizContentWithSelection>
          </div>

          {/* Right Side - Questions for Current Part */}
          <div className="h-full overflow-y-auto p-6">
            <QuizContentWithSelection 
              containerId={`quiz-questions-part-${quizState.currentPart}`}
              className="space-y-8"
            >
              {session.isCompleted && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800 font-medium">
                    Bài thi đã được nộp. Bạn chỉ có thể xem lại câu trả lời.
                  </p>
                </div>
              )}
              
              {questionGroups
                .filter(group => group.questions && group.questions.length > 0)
                .map((group) => {
                // Create a group ID for scrolling (use the first question's ID)
                const groupId = group.questions[0].id
                
                // Calculate continuous question numbers for this group using centralized utility
                const startNumber = getQuestionStartingNumber(quiz!, quizState.currentPart, group.questions[0].id)
                
                // For paragraph matching table, calculate based on expanded questions
                let endNumber: number
                let actualQuestionCount: number
                
                if (group.type === 'PARAGRAPH_MATCHING_TABLE') {
                  const firstQuestion = group.questions[0]
                  actualQuestionCount = firstQuestion.items?.length || 1
                  endNumber = startNumber + actualQuestionCount - 1
                } else {
                  actualQuestionCount = group.questions.length
                  endNumber = startNumber + actualQuestionCount - 1
                }
                
                const groupTitle = actualQuestionCount > 1 
                  ? `Questions ${startNumber}-${endNumber} (${group.type.replace(/_/g, ' ')})`
                  : `Question ${startNumber} (${group.type.replace(/_/g, ' ')})`
                
                return (
                  <div 
                    key={groupId} 
                    id={`question-${groupId}`}
                    className="border-b border-gray-100 pb-6 last:border-b-0"
                  >
                    <div className="mb-4">
                      <span className="text-sm font-bold text-600 bg-gray-100 px-2 py-1 rounded">
                        {groupTitle}
                      </span>
                    </div>
                    {renderQuestionGroup(group)}
                  </div>
                )
              })}
            </QuizContentWithSelection>
          </div>
        </ResizablePanel>
      </main>

      {/* Footer */}
      <QuizFooter
        quiz={quiz}
        answers={quizState.answers}
        currentPart={quizState.currentPart}
        onPartChange={handlePartChange}
        onQuestionClick={handleQuestionClick}
      />
    </div>
  )
}