'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Copy } from 'lucide-react'
import { Question, QuestionOption } from '@/types/multi-part-quiz'

interface QuestionEditorProps {
  question: Question
  questionIndex: number
  partIndex: number
  testType: string
  availableQuestionTypes: Array<{
    value: string
    label: string
    forReading: boolean
    forListening: boolean
  }>
  onUpdateQuestion: (partIndex: number, questionIndex: number, updates: Partial<Question>) => void
  onDeleteQuestion: (partIndex: number, questionIndex: number) => void
  onDuplicateQuestion: (partIndex: number, questionIndex: number) => void
}

export function QuestionEditor({
  question,
  questionIndex,
  partIndex,
  testType,
  availableQuestionTypes,
  onUpdateQuestion,
  onDeleteQuestion,
  onDuplicateQuestion
}: QuestionEditorProps) {

  const updateOption = (optionIndex: number, updates: Partial<QuestionOption>) => {
    if (!question.options) return
    
    const updatedOptions = [...question.options]
    updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], ...updates }
    onUpdateQuestion(partIndex, questionIndex, { options: updatedOptions })
  }

  const addOption = () => {
    const currentOptions = question.options || []
    const optionIds = ['a', 'b', 'c', 'd', 'e', 'f']
    const newOptionId = optionIds[currentOptions.length] || `option_${currentOptions.length + 1}`
    
    const newOption: QuestionOption = {
      id: newOptionId,
      text: `Lựa chọn ${newOptionId.toUpperCase()}`
    }
    
    onUpdateQuestion(partIndex, questionIndex, {
      options: [...currentOptions, newOption]
    })
  }

  const deleteOption = (optionIndex: number) => {
    if (!question.options || question.options.length <= 2) return
    
    const updatedOptions = question.options.filter((_, index) => index !== optionIndex)
    onUpdateQuestion(partIndex, questionIndex, { options: updatedOptions })
  }

  const renderQuestionTypeSpecificFields = () => {
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Lựa chọn</Label>
              <Button variant="outline" size="sm" onClick={addOption}>
                <Plus className="h-4 w-4 mr-1" />
                Thêm lựa chọn
              </Button>
            </div>
            
            {question.options?.map((option, optionIndex) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Input
                  value={option.id}
                  onChange={(e) => updateOption(optionIndex, { id: e.target.value })}
                  className="w-16"
                  placeholder="ID"
                />
                <Input
                  value={option.text}
                  onChange={(e) => updateOption(optionIndex, { text: e.target.value })}
                  placeholder="Nội dung lựa chọn"
                  className="flex-1"
                />
                {(question.options?.length || 0) > 2 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteOption(optionIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <div>
              <Label htmlFor={`correct-answer-${partIndex}-${questionIndex}`}>Đáp án đúng</Label>
              <Select
                value={question.correctAnswer || ''}
                onValueChange={(value) => onUpdateQuestion(partIndex, questionIndex, { correctAnswer: value })}
              >
                <SelectTrigger id={`correct-answer-${partIndex}-${questionIndex}`}>
                  <SelectValue placeholder="Chọn đáp án đúng" />
                </SelectTrigger>
                <SelectContent>
                  {question.options?.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.id.toUpperCase()}: {option.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 'TRUE_FALSE_NOTGIVEN':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`question-text-${partIndex}-${questionIndex}`}>Phát biểu</Label>
              <Textarea
                id={`question-text-${partIndex}-${questionIndex}`}
                value={question.text || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { text: e.target.value })}
                placeholder="Nhập phát biểu cần đánh giá..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor={`correct-answer-${partIndex}-${questionIndex}`}>Đáp án đúng</Label>
              <Select 
                value={question.correctAnswer || ''}
                onValueChange={(value) => onUpdateQuestion(partIndex, questionIndex, { correctAnswer: value })}
              >
                <SelectTrigger id={`correct-answer-${partIndex}-${questionIndex}`}>
                  <SelectValue placeholder="Chọn đáp án đúng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRUE">TRUE</SelectItem>
                  <SelectItem value="FALSE">FALSE</SelectItem>
                  <SelectItem value="NOT GIVEN">NOT GIVEN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor={`instruction-${partIndex}-${questionIndex}`}>Hướng dẫn</Label>
              <Textarea
                id={`instruction-${partIndex}-${questionIndex}`}
                value={question.instruction || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { instruction: e.target.value })}
                placeholder="Write TRUE if the statement agrees with the information..."
                rows={2}
              />
            </div>
          </div>
        )

      case 'SENTENCE_COMPLETION':
        return (
          <div>
            <Label htmlFor={`correct-answer-${partIndex}-${questionIndex}`}>Đáp án đúng</Label>
            <Input
              id={`correct-answer-${partIndex}-${questionIndex}`}
              value={question.correctAnswer || ''}
              onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { correctAnswer: e.target.value })}
              placeholder="Nhập đáp án đúng"
            />
          </div>
        )

      case 'PARAGRAPH_MATCHING_TABLE':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`question-text-${partIndex}-${questionIndex}`}>Mô tả cần khớp</Label>
              <Textarea
                id={`question-text-${partIndex}-${questionIndex}`}
                value={question.text || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { text: e.target.value })}
                placeholder="Nhập mô tả cần khớp với paragraph..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor={`correct-answer-${partIndex}-${questionIndex}`}>Đáp án đúng (A, B, C, etc.)</Label>
              <Input
                id={`correct-answer-${partIndex}-${questionIndex}`}
                value={question.correctAnswer || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { correctAnswer: e.target.value })}
                placeholder="A"
              />
            </div>
            <div>
              <Label htmlFor={`instruction-${partIndex}-${questionIndex}`}>Hướng dẫn</Label>
              <Input
                id={`instruction-${partIndex}-${questionIndex}`}
                value={question.instruction || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { instruction: e.target.value })}
                placeholder="Choose the correct letter A-C for each answer."
              />
            </div>
            <div>
              <Label htmlFor={`paragraph-labels-${partIndex}-${questionIndex}`}>Nhãn Paragraphs</Label>
              <Input
                id={`paragraph-labels-${partIndex}-${questionIndex}`}
                value={question.paragraphLabels?.join(', ') || ''}
                onChange={(e) => {
                  const labels = e.target.value.split(',').map(l => l.trim()).filter(l => l)
                  onUpdateQuestion(partIndex, questionIndex, { paragraphLabels: labels })
                }}
                placeholder="A, B, C, D"
              />
            </div>
          </div>
        )

      case 'DRAG_AND_DROP':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`question-text-${partIndex}-${questionIndex}`}>Câu cần hoàn thành</Label>
              <Textarea
                id={`question-text-${partIndex}-${questionIndex}`}
                value={question.text || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { text: e.target.value })}
                placeholder="Nhập câu cần hoàn thành... (vd: The usual business environment _____)"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor={`instruction-${partIndex}-${questionIndex}`}>Hướng dẫn</Label>
              <Textarea
                id={`instruction-${partIndex}-${questionIndex}`}
                value={question.instruction || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { instruction: e.target.value })}
                placeholder="Complete each sentence with the correct ending, A-H, below."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor={`correct-answer-${partIndex}-${questionIndex}`}>Đáp án đúng (ID option)</Label>
              <Input
                id={`correct-answer-${partIndex}-${questionIndex}`}
                value={question.correctAnswer || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { correctAnswer: e.target.value })}
                placeholder="opt_a"
              />
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-sm text-amber-800 mb-1 font-medium">
                💡 Lưu ý:
              </div>
              <div className="text-sm text-amber-700">
                Các Shared Drag Options (A, B, C, D...) được quản lý ở cấp Part, không phải từng câu hỏi riêng lẻ. 
                Hãy cuộn lên trên để thiết lập Shared Drag Options cho Part này.
              </div>
            </div>
          </div>
        )

      case 'TABLE_COMPLETION':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`question-text-${partIndex}-${questionIndex}`}>Hướng dẫn hoàn thành bảng</Label>
              <Textarea
                id={`question-text-${partIndex}-${questionIndex}`}
                value={question.text || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { text: e.target.value })}
                placeholder="Complete the table below. Write ONE WORD AND/OR A NUMBER for each answer."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor={`instruction-${partIndex}-${questionIndex}`}>Tiêu đề bảng</Label>
              <Input
                id={`instruction-${partIndex}-${questionIndex}`}
                value={question.instruction || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { instruction: e.target.value })}
                placeholder="BEECHEN FESTIVAL"
              />
            </div>
            <div>
              <Label>Dữ liệu bảng (JSON format)</Label>
              <Textarea
                value={JSON.stringify(question.tableData || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const tableData = JSON.parse(e.target.value)
                    onUpdateQuestion(partIndex, questionIndex, { tableData })
                  } catch (error) {
                    // Invalid JSON, ignore but don't reset the textarea
                  }
                }}
                placeholder='{"headers": ["Date", "Time", "Activity"], "rows": [...]}'
                rows={6}
              />
            </div>
          </div>
        )

      case 'MULTIPLE_SELECT':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`question-prompt-${partIndex}-${questionIndex}`}>Câu hỏi</Label>
              <Textarea
                id={`question-prompt-${partIndex}-${questionIndex}`}
                value={question.prompt || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { prompt: e.target.value })}
                placeholder="Which THREE of the following features..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor={`instruction-${partIndex}-${questionIndex}`}>Hướng dẫn</Label>
              <Input
                id={`instruction-${partIndex}-${questionIndex}`}
                value={question.instruction || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { instruction: e.target.value })}
                placeholder="Choose THREE correct answers."
              />
            </div>
            <div>
              <Label htmlFor={`max-selections-${partIndex}-${questionIndex}`}>Số lượng tối đa có thể chọn</Label>
              <Input
                id={`max-selections-${partIndex}-${questionIndex}`}
                type="number"
                value={question.maxSelections || 1}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { maxSelections: parseInt(e.target.value) || 1 })}
                placeholder="3"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Lựa chọn</Label>
                <Button variant="outline" size="sm" onClick={addOption}>
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm lựa chọn
                </Button>
              </div>
              
              {question.options?.map((option, optionIndex) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={Array.isArray(question.correctAnswer) && question.correctAnswer.includes(option.id)}
                    onChange={(e) => {
                      const currentCorrect = Array.isArray(question.correctAnswer) ? question.correctAnswer : []
                      let newCorrectAnswers
                      if (e.target.checked) {
                        newCorrectAnswers = [...currentCorrect, option.id]
                      } else {
                        newCorrectAnswers = currentCorrect.filter(id => id !== option.id)
                      }
                      onUpdateQuestion(partIndex, questionIndex, { correctAnswer: newCorrectAnswers })
                    }}
                    className="w-4 h-4"
                    title="Chọn làm đáp án đúng"
                  />
                  <Input
                    value={option.id}
                    onChange={(e) => updateOption(optionIndex, { id: e.target.value })}
                    className="w-16"
                    placeholder="ID"
                  />
                  <Input
                    value={option.text}
                    onChange={(e) => updateOption(optionIndex, { text: e.target.value })}
                    placeholder="Nội dung lựa chọn"
                    className="flex-1"
                  />
                  {(question.options?.length || 0) > 2 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteOption(optionIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div>
              <Label>Đáp án đúng hiện tại</Label>
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {Array.isArray(question.correctAnswer) && question.correctAnswer.length > 0 
                  ? question.correctAnswer.map(id => id.toUpperCase()).join(', ')
                  : 'Chưa chọn đáp án đúng'}
              </div>
            </div>
          </div>
        )

      case 'MATCHING_TABLE':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`question-prompt-${partIndex}-${questionIndex}`}>Câu hỏi</Label>
              <Textarea
                id={`question-prompt-${partIndex}-${questionIndex}`}
                value={question.prompt || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { prompt: e.target.value })}
                placeholder="How did the following categories compare..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor={`instruction-${partIndex}-${questionIndex}`}>Hướng dẫn</Label>
              <Textarea
                id={`instruction-${partIndex}-${questionIndex}`}
                value={question.instruction || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { instruction: e.target.value })}
                placeholder="Choose the correct letter, A, B or C..."
                rows={2}
              />
            </div>
            <div>
              <Label>Dữ liệu bảng khớp (JSON format)</Label>
              <Textarea
                value={JSON.stringify(question.tableData || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const tableData = JSON.parse(e.target.value)
                    onUpdateQuestion(partIndex, questionIndex, { tableData })
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder='{"headers": [...], "options": {"A": "...", "B": "..."}, "rows": [...]}'
                rows={8}
              />
            </div>
          </div>
        )

      default:
        return (
          <div>
            <Label htmlFor={`correct-answer-${partIndex}-${questionIndex}`}>Đáp án đúng</Label>
            <Input
              id={`correct-answer-${partIndex}-${questionIndex}`}
              value={question.correctAnswer || ''}
              onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { correctAnswer: e.target.value })}
              placeholder="Nhập đáp án đúng"
            />
          </div>
        )
    }
  } => updateOption(optionIndex, { id: e.target.value })}
                  className="w-16"
                  placeholder="ID"
                />
                <Input
                  value={option.text}
                  onChange={(e) => updateOption(optionIndex, { text: e.target.value })}
                  placeholder="Nội dung lựa chọn"
                  className="flex-1"
                />
                {(question.options?.length || 0) > 2 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteOption(optionIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <div>
              <Label htmlFor={`correct-answer-${partIndex}-${questionIndex}`}>Đáp án đúng</Label>
              <Select
                value={question.correctAnswer || ''}
                onValueChange={(value) => onUpdateQuestion(partIndex, questionIndex, { correctAnswer: value })}
              >
                <SelectTrigger id={`correct-answer-${partIndex}-${questionIndex}`}>
                  <SelectValue placeholder="Chọn đáp án đúng" />
                </SelectTrigger>
                <SelectContent>
                  {question.options?.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.id.toUpperCase()}: {option.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 'TRUE_FALSE_NOTGIVEN':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`question-text-${partIndex}-${questionIndex}`}>Phát biểu</Label>
              <Textarea
                id={`question-text-${partIndex}-${questionIndex}`}
                value={question.text || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { text: e.target.value })}
                placeholder="Nhập phát biểu cần đánh giá..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor={`correct-answer-${partIndex}-${questionIndex}`}>Đáp án đúng</Label>
              <Select 
                value={question.correctAnswer || ''}
                onValueChange={(value) => onUpdateQuestion(partIndex, questionIndex, { correctAnswer: value })}
              >
                <SelectTrigger id={`correct-answer-${partIndex}-${questionIndex}`}>
                  <SelectValue placeholder="Chọn đáp án đúng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRUE">TRUE</SelectItem>
                  <SelectItem value="FALSE">FALSE</SelectItem>
                  <SelectItem value="NOT GIVEN">NOT GIVEN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor={`instruction-${partIndex}-${questionIndex}`}>Hướng dẫn</Label>
              <Textarea
                id={`instruction-${partIndex}-${questionIndex}`}
                value={question.instruction || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { instruction: e.target.value })}
                placeholder="Write TRUE if the statement agrees with the information..."
                rows={2}
              />
            </div>
          </div>
        )

      case 'SENTENCE_COMPLETION':
        return (
          <div>
            <Label htmlFor={`correct-answer-${partIndex}-${questionIndex}`}>Đáp án đúng</Label>
            <Input
              id={`correct-answer-${partIndex}-${questionIndex}`}
              value={question.correctAnswer || ''}
              onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { correctAnswer: e.target.value })}
              placeholder="Nhập đáp án đúng"
            />
          </div>
        )

      case 'PARAGRAPH_MATCHING_TABLE':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`question-text-${partIndex}-${questionIndex}`}>Mô tả cần khớp</Label>
              <Textarea
                id={`question-text-${partIndex}-${questionIndex}`}
                value={question.text || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { text: e.target.value })}
                placeholder="Nhập mô tả cần khớp với paragraph..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor={`correct-answer-${partIndex}-${questionIndex}`}>Đáp án đúng (A, B, C, etc.)</Label>
              <Input
                id={`correct-answer-${partIndex}-${questionIndex}`}
                value={question.correctAnswer || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { correctAnswer: e.target.value })}
                placeholder="A"
              />
            </div>
            <div>
              <Label htmlFor={`instruction-${partIndex}-${questionIndex}`}>Hướng dẫn</Label>
              <Input
                id={`instruction-${partIndex}-${questionIndex}`}
                value={question.instruction || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { instruction: e.target.value })}
                placeholder="Choose the correct letter A-C for each answer."
              />
            </div>
            <div>
              <Label htmlFor={`paragraph-labels-${partIndex}-${questionIndex}`}>Nhãn Paragraphs</Label>
              <Input
                id={`paragraph-labels-${partIndex}-${questionIndex}`}
                value={question.paragraphLabels?.join(', ') || ''}
                onChange={(e) => {
                  const labels = e.target.value.split(',').map(l => l.trim()).filter(l => l)
                  onUpdateQuestion(partIndex, questionIndex, { paragraphLabels: labels })
                }}
                placeholder="A, B, C, D"
              />
            </div>
          </div>
        )

      case 'DRAG_AND_DROP':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`question-text-${partIndex}-${questionIndex}`}>Câu cần hoàn thành</Label>
              <Textarea
                id={`question-text-${partIndex}-${questionIndex}`}
                value={question.text || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { text: e.target.value })}
                placeholder="Nhập câu cần hoàn thành..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor={`correct-answer-${partIndex}-${questionIndex}`}>ID đáp án đúng</Label>
              <Input
                id={`correct-answer-${partIndex}-${questionIndex}`}
                value={question.correctAnswer || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { correctAnswer: e.target.value })}
                placeholder="opt_a"
              />
            </div>
            <div>
              <Label htmlFor={`instruction-${partIndex}-${questionIndex}`}>Hướng dẫn</Label>
              <Textarea
                id={`instruction-${partIndex}-${questionIndex}`}
                value={question.instruction || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { instruction: e.target.value })}
                placeholder="Complete each sentence with the correct ending, A-H, below."
                rows={2}
              />
            </div>
          </div>
        )

      case 'TABLE_COMPLETION':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`question-text-${partIndex}-${questionIndex}`}>Hướng dẫn hoàn thành bảng</Label>
              <Textarea
                id={`question-text-${partIndex}-${questionIndex}`}
                value={question.text || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { text: e.target.value })}
                placeholder="Complete the table below. Write ONE WORD AND/OR A NUMBER for each answer."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor={`instruction-${partIndex}-${questionIndex}`}>Tiêu đề bảng</Label>
              <Input
                id={`instruction-${partIndex}-${questionIndex}`}
                value={question.instruction || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { instruction: e.target.value })}
                placeholder="BEECHEN FESTIVAL"
              />
            </div>
            <div>
              <Label>Dữ liệu bảng (JSON format)</Label>
              <Textarea
                value={JSON.stringify(question.tableData || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const tableData = JSON.parse(e.target.value)
                    onUpdateQuestion(partIndex, questionIndex, { tableData })
                  } catch (error) {
                    // Invalid JSON, ignore but don't reset the textarea
                  }
                }}
                placeholder='{"headers": ["Date", "Time", "Activity"], "rows": [...]}'
                rows={6}
              />
            </div>
          </div>
        )

      case 'MULTIPLE_SELECT':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`question-prompt-${partIndex}-${questionIndex}`}>Câu hỏi</Label>
              <Textarea
                id={`question-prompt-${partIndex}-${questionIndex}`}
                value={question.prompt || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { prompt: e.target.value })}
                placeholder="Which THREE of the following features..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor={`instruction-${partIndex}-${questionIndex}`}>Hướng dẫn</Label>
              <Input
                id={`instruction-${partIndex}-${questionIndex}`}
                value={question.instruction || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { instruction: e.target.value })}
                placeholder="Choose THREE correct answers."
              />
            </div>
            <div>
              <Label htmlFor={`max-selections-${partIndex}-${questionIndex}`}>Số lượng tối đa có thể chọn</Label>
              <Input
                id={`max-selections-${partIndex}-${questionIndex}`}
                type="number"
                value={question.maxSelections || 1}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { maxSelections: parseInt(e.target.value) || 1 })}
                placeholder="3"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Lựa chọn</Label>
                <Button variant="outline" size="sm" onClick={addOption}>
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm lựa chọn
                </Button>
              </div>
              
              {question.options?.map((option, optionIndex) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={Array.isArray(question.correctAnswer) && question.correctAnswer.includes(option.id)}
                    onChange={(e) => {
                      const currentCorrect = Array.isArray(question.correctAnswer) ? question.correctAnswer : []
                      let newCorrectAnswers
                      if (e.target.checked) {
                        newCorrectAnswers = [...currentCorrect, option.id]
                      } else {
                        newCorrectAnswers = currentCorrect.filter(id => id !== option.id)
                      }
                      onUpdateQuestion(partIndex, questionIndex, { correctAnswer: newCorrectAnswers })
                    }}
                    className="w-4 h-4"
                    title="Chọn làm đáp án đúng"
                  />
                  <Input
                    value={option.id}
                    onChange={(e) => updateOption(optionIndex, { id: e.target.value })}
                    className="w-16"
                    placeholder="ID"
                  />
                  <Input
                    value={option.text}
                    onChange={(e) => updateOption(optionIndex, { text: e.target.value })}
                    placeholder="Nội dung lựa chọn"
                    className="flex-1"
                  />
                  {(question.options?.length || 0) > 2 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteOption(optionIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div>
              <Label>Đáp án đúng hiện tại</Label>
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {Array.isArray(question.correctAnswer) && question.correctAnswer.length > 0 
                  ? question.correctAnswer.map(id => id.toUpperCase()).join(', ')
                  : 'Chưa chọn đáp án đúng'}
              </div>
            </div>
          </div>
        )

      case 'MATCHING_TABLE':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`question-prompt-${partIndex}-${questionIndex}`}>Câu hỏi</Label>
              <Textarea
                id={`question-prompt-${partIndex}-${questionIndex}`}
                value={question.prompt || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { prompt: e.target.value })}
                placeholder="How did the following categories compare..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor={`instruction-${partIndex}-${questionIndex}`}>Hướng dẫn</Label>
              <Textarea
                id={`instruction-${partIndex}-${questionIndex}`}
                value={question.instruction || ''}
                onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { instruction: e.target.value })}
                placeholder="Choose the correct letter, A, B or C..."
                rows={2}
              />
            </div>
            <div>
              <Label>Dữ liệu bảng khớp (JSON format)</Label>
              <Textarea
                value={JSON.stringify(question.tableData || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const tableData = JSON.parse(e.target.value)
                    onUpdateQuestion(partIndex, questionIndex, { tableData })
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder='{"headers": [...], "options": {"A": "...", "B": "..."}, "rows": [...]}'
                rows={8}
              />
            </div>
          </div>
        )

      default:
        return (
          <div>
            <Label htmlFor={`correct-answer-${partIndex}-${questionIndex}`}>Đáp án đúng</Label>
            <Input
              id={`correct-answer-${partIndex}-${questionIndex}`}
              value={question.correctAnswer || ''}
              onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { correctAnswer: e.target.value })}
              placeholder="Nhập đáp án đúng"
            />
          </div>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Câu hỏi {questionIndex + 1}: {question.id}
          </CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onDuplicateQuestion(partIndex, questionIndex)}
            >
              <Copy className="h-4 w-4 mr-1" />
              Sao chép
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => onDeleteQuestion(partIndex, questionIndex)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Xóa
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Question Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`question-id-${partIndex}-${questionIndex}`}>ID câu hỏi</Label>
            <Input
              id={`question-id-${partIndex}-${questionIndex}`}
              value={question.id}
              onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { id: e.target.value })}
              placeholder="p1q1"
            />
          </div>
          <div>
            <Label htmlFor={`question-type-${partIndex}-${questionIndex}`}>Loại câu hỏi</Label>
            <Select
              value={question.type}
              onValueChange={(value) => onUpdateQuestion(partIndex, questionIndex, { type: value })}
            >
              <SelectTrigger id={`question-type-${partIndex}-${questionIndex}`}>
                <SelectValue placeholder="Chọn loại câu hỏi" />
              </SelectTrigger>
              <SelectContent>
                {availableQuestionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Question Prompt */}
        <div>
          <Label htmlFor={`question-prompt-${partIndex}-${questionIndex}`}>Câu hỏi</Label>
          <Textarea
            id={`question-prompt-${partIndex}-${questionIndex}`}
            value={question.prompt}
            onChange={(e) => onUpdateQuestion(partIndex, questionIndex, { prompt: e.target.value })}
            placeholder="Nhập nội dung câu hỏi..."
            rows={3}
          />
        </div>

        {/* Type-specific fields */}
        {renderQuestionTypeSpecificFields()}
      </CardContent>
    </Card>
  )
}