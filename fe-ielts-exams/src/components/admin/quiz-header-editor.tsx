'use client'

import React, { useState, memo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Save, Eye, ArrowLeft, FileText, Headphones } from 'lucide-react'
import { MultiPartQuiz } from '@/types/multi-part-quiz'
import Link from 'next/link'

interface QuizHeaderEditorProps {
  quiz: MultiPartQuiz
  onSave: () => void
  onUpdate: (updates: Partial<MultiPartQuiz>) => void
}

const QuizHeaderEditor = memo(function QuizHeaderEditor({ quiz, onSave, onUpdate }: QuizHeaderEditorProps) {
  const [previewKey, setPreviewKey] = useState(0)

  const openPreview = useCallback(() => {
    setPreviewKey(prev => prev + 1)
    window.open(`/quiz/${quiz.testType}/${quiz.id}?preview=${previewKey}`, '_blank')
  }, [quiz.testType, quiz.id, previewKey])

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ title: e.target.value })
  }, [onUpdate])

  const handleTimeLimitChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ totalTimeLimit: parseInt(e.target.value) || 60 })
  }, [onUpdate])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin/quiz">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Quay lại
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              {quiz.testType === 'reading' ? (
                <FileText className="h-5 w-5" />
              ) : (
                <Headphones className="h-5 w-5" />
              )}
              <CardTitle className="text-2xl">
                Chỉnh sửa Quiz {quiz.testType === 'reading' ? 'Reading' : 'Listening'}
              </CardTitle>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={quiz.testType === 'reading' ? 'default' : 'secondary'}>
              {quiz.testType === 'reading' ? 'Reading' : 'Listening'}
            </Badge>
            <Button variant="outline" onClick={openPreview}>
              <Eye className="h-4 w-4 mr-2" />
              Xem trước
            </Button>
            <Button onClick={onSave}>
              <Save className="h-4 w-4 mr-2" />
              Lưu Quiz
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Tiêu đề Quiz</Label>
            <Input
              id="title"
              value={quiz.title}
              onChange={handleTitleChange}
              placeholder="Nhập tiêu đề quiz"
            />
          </div>
          
          <div>
            <Label htmlFor="timeLimit">Thời gian (phút)</Label>
            <Input
              id="timeLimit"
              type="number"
              min="1"
              max="180"
              value={quiz.totalTimeLimit}
              onChange={handleTimeLimitChange}
            />
          </div>
        </div>

        {/* Quiz Statistics */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{quiz.parts.length}</div>
            <div className="text-sm text-gray-600">Số phần</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {quiz.metadata.totalQuestions}
            </div>
            <div className="text-sm text-gray-600">Tổng câu hỏi</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{quiz.totalTimeLimit}</div>
            <div className="text-sm text-gray-600">Phút</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

export { QuizHeaderEditor }