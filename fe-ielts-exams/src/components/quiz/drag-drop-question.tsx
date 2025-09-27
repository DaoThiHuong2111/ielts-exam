'use client'

import { DragOption, Question, QuizPart } from '@/types/multi-part-quiz'
import { getGroupForQuestion, getGroupSharedOptions } from '@/utils/drag-drop-groups'
import React, { useCallback, useState, useMemo } from 'react'

interface DragDropQuestionProps {
  questions: Question[]
  answers: Record<string, string>
  onAnswerChange: (questionId: string, value: string) => void
  isClient: boolean
  currentPartData: QuizPart // The part data containing dragOptionsGroups
  allPartQuestions?: Question[] // All questions in the part for grouping logic
  startingQuestionNumber?: number // Starting question number for continuous numbering
}

interface DragState {
  draggedOption: DragOption | null
  draggedFromQuestion: string | null
}

export function DragDropQuestion({
  questions,
  answers,
  onAnswerChange,
  isClient,
  currentPartData,
  allPartQuestions,
  startingQuestionNumber = 1
}: DragDropQuestionProps) {
  const [dragState, setDragState] = useState<DragState>({
    draggedOption: null,
    draggedFromQuestion: null
  })

  // Get shared drag options from group level (new architecture)
  const dragOptions = useMemo(() => {
    if (!questions.length || !allPartQuestions?.length || !currentPartData?.dragOptionsGroups) {
      return []
    }

    // Find the first question's index in the part
    const firstQuestionId = questions[0].id
    const firstQuestionIndex = allPartQuestions.findIndex(q => q.id === firstQuestionId)
    
    if (firstQuestionIndex === -1) {
      return []
    }

    // Get the group for this question
    const group = getGroupForQuestion(allPartQuestions, firstQuestionIndex)
    if (!group) {
      return []
    }

    // Get the shared options for this group
    // Fix: currentPartData.dragOptionsGroups is an array, not an object
    // Find the group by ID and get its options
    const dragGroup = currentPartData.dragOptionsGroups.find(dg => dg.id === 'group1')
    const sharedOptions = dragGroup?.options || []
    
    return sharedOptions
  }, [questions, allPartQuestions, currentPartData?.dragOptionsGroups])
  
  // Get instruction from the first question
  const instruction = questions[0]?.instruction

  // Get available options (not yet placed in any question)
  const getAvailableOptions = useCallback(() => {
    const placedOptionIds = questions
      .map(q => answers[q.id])
      .filter(answer => answer && answer.trim() !== '')
    
    return dragOptions.filter((option: DragOption) => !placedOptionIds.includes(option.id))
  }, [dragOptions, answers, questions])

  const availableOptions = getAvailableOptions()

  const handleDragStart = (e: React.DragEvent, option: DragOption, fromQuestion?: string) => {
    setDragState({
      draggedOption: option,
      draggedFromQuestion: fromQuestion || null
    })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetQuestionId: string) => {
    e.preventDefault()
    
    if (!dragState.draggedOption) return

    const { draggedOption, draggedFromQuestion } = dragState

    // If dropping into the same question, do nothing
    if (draggedFromQuestion === targetQuestionId) {
      setDragState({ draggedOption: null, draggedFromQuestion: null })
      return
    }

    // If there's already an option in the target question, swap them
    const currentOptionInTarget = answers[targetQuestionId]
    if (currentOptionInTarget && draggedFromQuestion) {
      // Swap the options
      onAnswerChange(targetQuestionId, draggedOption.id)
      onAnswerChange(draggedFromQuestion, currentOptionInTarget)
    } else if (currentOptionInTarget) {
      // Move current option back to available and place new one
      onAnswerChange(targetQuestionId, draggedOption.id)
      // Find which question had the current option and clear it
      questions.forEach(q => {
        if (answers[q.id] === currentOptionInTarget) {
          onAnswerChange(q.id, '')
        }
      })
    } else {
      // Simple placement
      onAnswerChange(targetQuestionId, draggedOption.id)
      
      // If dragged from another question, clear that question
      if (draggedFromQuestion) {
        onAnswerChange(draggedFromQuestion, '')
      }
    }

    setDragState({ draggedOption: null, draggedFromQuestion: null })
  }

  const handleReturnToBank = (e: React.DragEvent) => {
    e.preventDefault()
    
    if (!dragState.draggedOption || !dragState.draggedFromQuestion) return

    // Remove from question
    onAnswerChange(dragState.draggedFromQuestion, '')
    setDragState({ draggedOption: null, draggedFromQuestion: null })
  }

  // Function to render question text with drop zone at correct position
  const renderQuestionWithDropZone = (question: Question, questionNumber: number) => {
    const placedOptionId = answers[question.id]
    const placedOption = placedOptionId 
      ? dragOptions.find((opt: DragOption) => opt.id === placedOptionId)
      : null

    // Find the correct answer text to determine drop zone position
    const correctAnswer = question.correctAnswer
    const correctOption = correctAnswer 
      ? dragOptions.find((opt: DragOption) => opt.id === correctAnswer)
      : null

    if (!correctOption) {
      // Fallback to old behavior if no correct answer found
      return (
        <div className="flex items-center text-sm space-x-1">
          <span className="flex-shrink-0">
            <span className="font-medium">{questionNumber}.</span> {question.text}
          </span>
          
          <div
            className={`
              min-w-[200px] max-w-[420px] min-h-[32px] border-2 border-dashed border-gray-400 rounded
              flex items-center justify-center px-2 py-1
              ${placedOption ? 'border-solid border-blue-500 bg-blue-50' : 'bg-gray-50'}
            `}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, question.id)}
          >
            {placedOption ? (
              <div
                draggable={isClient}
                onDragStart={(e) => handleDragStart(e, placedOption, question.id)}
                className="px-2 py-1 bg-white border border-gray-300 rounded cursor-move text-sm text-center min-w-[180px] max-w-[400px] break-words"
              >
                <span className="font-bold">{placedOption.label}.</span> {placedOption.text}
              </div>
            ) : (
              <span className="text-gray-400 text-xs font-bold">{questionNumber}</span>
            )}
          </div>
        </div>
      )
    }

    // Find where to place the drop zone by looking for the correct answer text
    const fullText = question.text || ''
    const answerText = correctOption.text
    
    // Try to find the answer text within the question text
    const answerIndex = fullText.toLowerCase().indexOf(answerText.toLowerCase())
    
    if (answerIndex === -1) {
      // If can't find exact match, fallback to old behavior
      return (
        <div className="flex items-center text-sm space-x-1">
          <span className="flex-shrink-0">
            <span className="font-medium">{questionNumber}.</span> {question.text}
          </span>
          
          <div
            className={`
              min-w-[200px] max-w-[420px] min-h-[32px] border-2 border-dashed border-gray-400 rounded
              flex items-center justify-center px-2 py-1
              ${placedOption ? 'border-solid border-blue-500 bg-blue-50' : 'bg-gray-50'}
            `}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, question.id)}
          >
            {placedOption ? (
              <div
                draggable={isClient}
                onDragStart={(e) => handleDragStart(e, placedOption, question.id)}
                className="px-2 py-1 bg-white border border-gray-300 rounded cursor-move text-sm text-center min-w-[180px] max-w-[400px] break-words"
              >
                <span className="font-bold">{placedOption.label}.</span> {placedOption.text}
              </div>
            ) : (
              <span className="text-gray-400 text-xs font-bold">{questionNumber}</span>
            )}
          </div>
        </div>
      )
    }

    // Split the text into parts: before, answer (to replace with drop zone), after
    const beforeText = fullText.substring(0, answerIndex)
    const afterText = fullText.substring(answerIndex + answerText.length)

    return (
      <div className="flex items-center text-sm space-x-1 flex-wrap">
        <span className="flex-shrink-0">
          <span className="font-medium">{questionNumber}.</span> {beforeText}
        </span>
        
        <div
          className={`
            min-w-[200px] max-w-[420px] min-h-[32px] border-2 border-dashed border-gray-400 rounded
            flex items-center justify-center px-2 py-1
            ${placedOption ? 'border-solid border-blue-500 bg-blue-50' : 'bg-gray-50'}
          `}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, question.id)}
        >
          {placedOption ? (
            <div
              draggable={isClient}
              onDragStart={(e) => handleDragStart(e, placedOption, question.id)}
              className="px-2 py-1 bg-white border border-gray-300 rounded cursor-move text-sm text-center min-w-[180px] max-w-[400px] break-words"
            >
              <span className="font-bold">{placedOption.label}.</span> {placedOption.text}
            </div>
          ) : (
            <span className="text-gray-400 text-xs font-bold">{questionNumber}</span>
          )}
        </div>

        {afterText && <span>{afterText}</span>}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {instruction && (
        <p className="text-sm text-gray-600 mb-4 whitespace-pre-line">{instruction}</p>
      )}

      {/* Drag Options Bank */}
      <div className="space-y-3">
        <div 
          className="min-h-[120px] border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50"
          onDragOver={handleDragOver}
          onDrop={handleReturnToBank}
        >
          <div className="flex flex-wrap gap-2">
            {availableOptions.map((option: DragOption) => (
              <div
                key={option.id}
                draggable={isClient}
                onDragStart={(e) => handleDragStart(e, option)}
                className={`
                  border border-gray-400 rounded px-2 py-1 bg-white cursor-move text-sm
                  hover:shadow-md transition-shadow min-w-[180px] max-w-[400px] break-words
                  ${!isClient ? 'cursor-not-allowed opacity-50' : ''}
                `}
              >
                <span className="font-bold">{option.label}.</span> {option.text}
              </div>
            ))}
          </div>
          {availableOptions.length === 0 && (
            <p className="text-gray-400 text-center">All options have been placed</p>
          )}
        </div>
      </div>

      {/* Questions with Drop Zones */}
      <div className="space-y-4">
        <div className="space-y-3">
          {questions.map((question, questionIndex) => {
            // Calculate question number using continuous numbering
            const questionNumber = startingQuestionNumber + questionIndex

            return (
              <div key={question.id}>
                {renderQuestionWithDropZone(question, questionNumber)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}