'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'
import { MultiPartQuiz, QuizPart, Question } from '@/types/multi-part-quiz'
import { PartEditor } from './part-editor'
import { QuestionEditor } from './question-editor'

interface QuizPartsManagerProps {
  quiz: MultiPartQuiz
  availableQuestionTypes: Array<{
    value: string
    label: string
    forReading: boolean
    forListening: boolean
  }>
  onUpdatePart: (partIndex: number, updates: Partial<QuizPart>) => void
  onUpdateQuestion: (partIndex: number, questionIndex: number, updates: Partial<Question>) => void
  onAddPart: () => void
  onDeletePart: (partIndex: number) => void
  onAddQuestion: (partIndex: number) => void
  onDeleteQuestion: (partIndex: number, questionIndex: number) => void
  onDuplicateQuestion: (partIndex: number, questionIndex: number) => void
}

export function QuizPartsManager({
  quiz,
  availableQuestionTypes,
  onUpdatePart,
  onUpdateQuestion,
  onAddPart,
  onDeletePart,
  onAddQuestion,
  onDeleteQuestion,
  onDuplicateQuestion
}: QuizPartsManagerProps) {
  const [selectedPartIndex, setSelectedPartIndex] = useState(0)
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0)

  const currentPart = quiz.parts[selectedPartIndex]
  const currentQuestion = currentPart?.questions[selectedQuestionIndex]

  return (
    <div className="space-y-6">
      {/* Parts Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quản lý các phần</CardTitle>
            <Button onClick={onAddPart}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm phần
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={selectedPartIndex.toString()} 
            onValueChange={(value) => setSelectedPartIndex(parseInt(value))}
          >
            <TabsList className="w-full">
              {quiz.parts.map((part, index) => (
                <TabsTrigger key={index} value={index.toString()}>
                  {part.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {quiz.parts.map((part, partIndex) => (
              <TabsContent key={partIndex} value={partIndex.toString()}>
                <PartEditor
                  part={part}
                  partIndex={partIndex}
                  testType={quiz.testType}
                  onUpdatePart={onUpdatePart}
                  onDeletePart={onDeletePart}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Questions Management */}
      {currentPart && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Câu hỏi - {currentPart.title} ({currentPart.questions.length} câu)
              </CardTitle>
              <Button onClick={() => onAddQuestion(selectedPartIndex)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm câu hỏi
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {currentPart.questions.length > 0 ? (
              <Tabs
                value={selectedQuestionIndex.toString()}
                onValueChange={(value) => setSelectedQuestionIndex(parseInt(value))}
              >
                <TabsList className="w-full flex-wrap">
                  {currentPart.questions.map((question, index) => (
                    <TabsTrigger key={index} value={index.toString()}>
                      Q{index + 1}: {question.id}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {currentPart.questions.map((question, questionIndex) => (
                  <TabsContent key={questionIndex} value={questionIndex.toString()}>
                    <QuestionEditor
                      question={question}
                      questionIndex={questionIndex}
                      partIndex={selectedPartIndex}
                      testType={quiz.testType}
                      availableQuestionTypes={availableQuestionTypes}
                      onUpdateQuestion={onUpdateQuestion}
                      onDeleteQuestion={onDeleteQuestion}
                      onDuplicateQuestion={onDuplicateQuestion}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Chưa có câu hỏi nào trong phần này</p>
                <Button 
                  className="mt-4" 
                  variant="outline"
                  onClick={() => onAddQuestion(selectedPartIndex)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm câu hỏi đầu tiên
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}