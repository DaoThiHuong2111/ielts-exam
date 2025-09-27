'use client'

import { QuizContentWithSelection } from '@/components/quiz'
import QuizFooter from '@/components/quiz/quiz-footer'
import QuizHeader from '@/components/quiz/quiz-header'
import {
  getAllAnsweredQuestions,
  getPartByNumber,
  getQuestionsByPart,
  initializeMultiPartQuizState
} from '@/lib/multi-part-quiz-utils'
import { getQuestionStartingNumber } from '@/lib/question-numbering-utils'
import { MultiPartQuiz, MultiPartQuizState, Question, QuestionOption } from '@/types/multi-part-quiz'
import { use, useEffect, useState, useRef, useCallback } from 'react'
import quizApiService, { QuizSession } from '@/services/quiz-api.service'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface ListeningQuizDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ListeningQuizDetailPage({ params }: ListeningQuizDetailPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()

  // State management
  const [isClient, setIsClient] = useState(false)
  const [quiz, setQuiz] = useState<MultiPartQuiz | null>(null)
  const [quizState, setQuizState] = useState<MultiPartQuizState | null>(null)
  const [session, setSession] = useState<QuizSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
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

  const handleMultiSelectChange = (questionId: string, optionId: string, checked: boolean) => {
    if (!quizState || session?.isCompleted) return

    setQuizState(prev => {
      const currentAnswers = prev!.answers[questionId]?.split(',').filter(Boolean) || []
      let newAnswers: string[]

      if (checked) {
        newAnswers = [...currentAnswers, optionId]
      } else {
        newAnswers = currentAnswers.filter(id => id !== optionId)
      }

      return {
        ...prev!,
        answers: {
          ...prev!.answers,
          [questionId]: newAnswers.join(',')
        }
      }
    })
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

  const handlePlayAudio = () => {
    const audio = document.getElementById(`audio-section-${quizState?.currentPart}`) as HTMLAudioElement
    if (audio) {
      if (isPlaying) {
        audio.pause()
      } else {
        audio.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleSeek = (time: number) => {
    const audio = document.getElementById(`audio-section-${quizState?.currentPart}`) as HTMLAudioElement
    if (audio) {
      audio.currentTime = time
      setCurrentTime(time)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
  const currentPartQuestions = getQuestionsByPart(quiz, quizState.currentPart)

  // Question rendering functions
  const renderTableCompletionQuestion = (question: Question, startingNumber: number = 1) => {
    const tableData = question.tableData
    if (!tableData) return null

    let currentNumber = startingNumber

    return (
      <div className="space-y-4">
        <p className="text-sm text-black font-bold">{question.text}</p>
        <div className="border border-gray-200 rounded overflow-hidden">
          {/* Table Header */}
          <div className="grid bg-blue-500 text-white" style={{gridTemplateColumns: `repeat(${tableData.headers.length}, 1fr)`}}>
            {tableData.headers.map((header: string, index: number) => (
              <div key={index} className="p-3 font-medium border-r border-blue-400 last:border-r-0 text-center">
                {header}
              </div>
            ))}
          </div>
          
          {/* Table Rows */}
          {tableData.rows.map((row: any, rowIndex: number) => (
            <div key={rowIndex} className={`grid ${rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-200 last:border-b-0`} style={{gridTemplateColumns: `repeat(${tableData.headers.length}, 1fr)`}}>
              {row.cells.map((cell: string, cellIndex: number) => {
                // Check if there are answers for this row that should be replaced in this cell
                const answersInCell = Object.entries(row.answers || {}).filter(([questionId, answer]) => {
                  return cell.includes(answer as string)
                })
                
                if (answersInCell.length > 0) {
                  // Process the cell text to replace answers with input placeholders
                  let processedCell = cell
                  
                  answersInCell.forEach(([questionId, answer]) => {
                    const answerStr = answer as string
                    const regex = new RegExp(answerStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
                    processedCell = processedCell.replace(regex, `__INPUT_${currentNumber}__`)
                    currentNumber++
                  })
                  
                  // Split by input placeholders and render
                  const parts = processedCell.split(/(__INPUT_\d+__)/g)
                  
                  return (
                    <div key={cellIndex} className="p-3 border-r border-gray-200 last:border-r-0 text-sm flex flex-wrap items-center gap-1">
                      {parts.map((part: string, partIndex: number) => {
                        const inputMatch = part.match(/__INPUT_(\d+)__/)
                        if (inputMatch) {
                          const displayNumber = inputMatch[1]
                          const questionId = Object.keys(row.answers || {}).find(key =>
                            cell.includes(row.answers[key])
                          ) || displayNumber
                          return (
                            <input
                              key={partIndex}
                              type="text"
                              placeholder={displayNumber}
                              value={quizState.answers[`l1q${questionId}`] || ''}
                              onChange={(e) => handleAnswerChange(`l1q${questionId}`, e.target.value)}
                              disabled={session.isCompleted}
                              className="border border-gray-300 rounded px-2 py-1 w-16 text-center inline-block"
                              suppressHydrationWarning
                            />
                          )
                        }
                        return part && <span key={partIndex}>{part}</span>
                      })}
                    </div>
                  )
                }
                
                return (
                  <div key={cellIndex} className="p-3 border-r border-gray-200 last:border-r-0 text-sm">
                    {cell}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }


  const renderMultipleChoiceQuestion = (question: Question) => {
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
  }

  const renderMultipleSelectQuestion = (question: Question) => {
    const selectedAnswers = quizState.answers[question.id]?.split(',').filter(Boolean) || []

    return (
      <div className="space-y-4">
        <p className="text-sm text-black font-bold">{question.instruction}</p>
        <p className="font-medium">{question.prompt}</p>
        <div className="space-y-2">
          {question.options?.map((option: QuestionOption) => {
            const isSelected = selectedAnswers.includes(option.id)
            const canSelect = isSelected || selectedAnswers.length < (question.maxSelections || question.options?.length || 0)

            return (
              <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={option.id}
                  checked={isSelected}
                  disabled={!canSelect || session.isCompleted}
                  onChange={(e) => handleMultiSelectChange(question.id, option.id, e.target.checked)}
                  className="w-4 h-4"
                  suppressHydrationWarning
                />
                <span className={`text-sm ${!canSelect && !isSelected ? 'text-gray-400' : 'text-gray-900'}`}>
                  {option.text}
                </span>
              </label>
            )
          })}
        </div>
      </div>
    )
  }

  const renderMatchingTableQuestion = (question: Question) => {
    const tableData = question.tableData
    if (!tableData) return null

    return (
      <div className="space-y-4">
        <p className="text-sm text-black font-bold">{question.instruction}</p>
        <p className="font-medium">{question.prompt}</p>
        
        {/* Options explanation */}
        <div className="bg-gray-50 p-4 rounded">
          {Object.entries(tableData.options || {}).map(([key, value]) => (
            <div key={key} className="text-sm mb-1">
              <span className="font-medium">{key}.</span> {value}
            </div>
          ))}
        </div>

        {/* Matching table */}
        <div className="border border-gray-200 rounded overflow-hidden">
          <div className="grid bg-blue-500 text-white" style={{gridTemplateColumns: `repeat(${tableData.headers.length}, 1fr)`}}>
            {tableData.headers.map((header: string, index: number) => (
              <div key={index} className="p-3 font-medium border-r border-blue-400 last:border-r-0 text-center">
                {header}
              </div>
            ))}
          </div>
          
          {tableData.rows.map((row: any, rowIndex: number) => (
            <div key={rowIndex} className={`grid ${rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-200 last:border-b-0`} style={{gridTemplateColumns: `repeat(${tableData.headers.length}, 1fr)`}}>
              <div className="p-3 border-r border-gray-200 text-sm">
                {row.label}
              </div>
              {Object.keys(tableData.options || {}).map((option) => (
                <div key={option} className="p-3 flex items-center justify-center border-r border-gray-200 last:border-r-0">
                  <input
                    type="radio"
                    name={row.questionId}
                    value={option}
                    checked={quizState.answers[row.questionId] === option}
                    onChange={(e) => handleAnswerChange(row.questionId, e.target.value)}
                    disabled={session.isCompleted}
                    className="w-4 h-4"
                    suppressHydrationWarning
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderQuestion = (question: Question, questionNumber: number = 1) => {
    switch (question.type) {
      case 'TABLE_COMPLETION':
        return renderTableCompletionQuestion(question, questionNumber)
      case 'MULTIPLE_CHOICE':
        return renderMultipleChoiceQuestion(question)
      case 'MULTIPLE_SELECT':
        return renderMultipleSelectQuestion(question)
      case 'MATCHING_TABLE':
        return renderMatchingTableQuestion(question)
      case 'SENTENCE_COMPLETION':
        const text = question.text || ''
        let parts: string[]
        
        // Check if text contains placeholder pattern (underscores)
        const placeholderMatch = text.match(/_{3,}/)
        if (placeholderMatch) {
          // Use placeholder-based splitting (more robust)
          parts = text.split(/_{3,}/)
        } else {
          // Fallback to old method for backward compatibility
          const correctAnswer = question.correctAnswer || ''
          parts = text.split(new RegExp(correctAnswer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))
        }
        
        return (
          <div className="space-y-4">
            {question.instruction && <p className="text-sm text-black font-bold">{question.instruction}</p>}
            <div className="flex flex-wrap items-center gap-1 mb-3">
              {parts.map((part: string, index: number) => (
                <span key={index} className="inline-flex items-center">
                  <span>{part}</span>
                  {index < parts.length - 1 && (
                    <input
                      type="text"
                      placeholder={questionNumber.toString()}
                      value={quizState.answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      disabled={session.isCompleted}
                      className="border border-gray-300 rounded px-2 py-1 mx-1 w-40 text-center inline-block"
                      suppressHydrationWarning
                    />
                  )}
                </span>
              ))}
            </div>
          </div>
        )
      default:
        return <div>Unsupported question type: {question.type}</div>
    }
  }

  if (!currentPartData) {
    return <div>Part not found</div>
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

      {/* Main Content - Full screen layout for listening */}
      <main className="flex-1 min-h-0 bg-white">
        <div className="h-full overflow-y-auto p-6 bg-white">
          <QuizContentWithSelection 
            containerId={`listening-quiz-part-${quizState.currentPart}`}
            className="space-y-6"
          >
            {/* Audio Player Section - Left aligned */}
            <div className="flex items-center gap-4 mb-6">
              <button 
                onClick={handlePlayAudio}
                className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="w-48 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm text-gray-600">{formatTime(duration)}</span>
              </div>
              
              <audio
                id={`audio-section-${quizState.currentPart}`}
                src={currentPartData.content.audioUrl}
                onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
                onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
                onEnded={() => setIsPlaying(false)}
              />
            </div>

            {/* Section Title */}
            <h2 className="text-xl font-bold">{currentPartData.content.title}</h2>

            {/* Questions Section */}
            <div className="space-y-6">
              {session.isCompleted && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800 font-medium">
                    Bài thi đã được nộp. Bạn chỉ có thể xem lại câu trả lời.
                  </p>
                </div>
              )}

              {(() => {
                return currentPartQuestions.map((question: Question, questionIndex: number) => {
                  // Calculate continuous question number using centralized utility
                  const currentQuestionNumber = getQuestionStartingNumber(quiz!, quizState.currentPart, question.id)

                  return (
                    <div
                      key={question.id}
                      id={`question-${question.id}`}
                    >
                      {renderQuestion(question, currentQuestionNumber)}
                    </div>
                  )
                })
              })()}
            </div>
          </QuizContentWithSelection>
        </div>
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