'use client'

import { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { DragOptionsManager } from '@/components/admin/drag-options-manager'
import { ParagraphMatchingEditor } from '@/components/admin/paragraph-matching-editor'
import { MatchingTableEditor } from '@/components/admin/matching-table-editor'
import { TableCompletionEditor } from '@/components/admin/table-completion-editor'
import { ResizableCardLayout } from '@/components/ui/resizable-card-layout'
import { 
  analyzeDragDropGroups, 
  getGroupForQuestion, 
  getGroupSharedOptions, 
  updateGroupSharedOptions 
} from '@/utils/drag-drop-groups'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Save, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  FileText, 
  Headphones,
  Copy,
  Eye
} from 'lucide-react'
import { MultiPartQuiz, QuizPart, Question, QuestionOption } from '@/types/multi-part-quiz'
import Link from 'next/link'
import quizApiService from '@/services/quiz-api.service'

interface QuizEditPageProps {
  params: Promise<{
    id: string
  }>
}

const ALL_QUESTION_TYPES = [
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice', forReading: true, forListening: true },
  { value: 'TRUE_FALSE_NOTGIVEN', label: 'True/False/Not Given', forReading: true, forListening: false },
  { value: 'SENTENCE_COMPLETION', label: 'Sentence Completion', forReading: true, forListening: true },
  { value: 'PARAGRAPH_MATCHING_TABLE', label: 'Paragraph Matching', forReading: true, forListening: false },
  { value: 'DRAG_AND_DROP', label: 'Drag and Drop', forReading: true, forListening: false },
  { value: 'TABLE_COMPLETION', label: 'Table Completion', forReading: false, forListening: true },
  { value: 'MULTIPLE_SELECT', label: 'Multiple Select', forReading: false, forListening: true },
  { value: 'MATCHING_TABLE', label: 'Matching Table', forReading: false, forListening: true }
]

const getAvailableQuestionTypes = (testType: string) => {
  return ALL_QUESTION_TYPES.filter(type => 
    testType === 'reading' ? type.forReading : type.forListening
  )
}

export default function QuizEditPage({ params }: QuizEditPageProps) {
  const resolvedParams = use(params)
  const [quiz, setQuiz] = useState<MultiPartQuiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPartIndex, setSelectedPartIndex] = useState(0)
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0)

  useEffect(() => {
    // Load quiz data from API by ID
    const loadQuiz = async () => {
      try {
        const quizData = await quizApiService.getQuiz(resolvedParams.id)
        setQuiz(quizData)
      } catch (error) {
        console.error('Failed to load quiz:', error)
        // If quiz not found, show error or redirect
        alert('Quiz không tồn tại hoặc bạn không có quyền truy cập!')
      } finally {
        setLoading(false)
      }
    }

    loadQuiz()
  }, [resolvedParams.id])

  const updateQuiz = (updates: Partial<MultiPartQuiz>) => {
    if (!quiz) return
    setQuiz({ ...quiz, ...updates })
  }

  const updatePart = (partIndex: number, updates: Partial<QuizPart>) => {
    if (!quiz) return
    const updatedParts = [...quiz.parts]
    updatedParts[partIndex] = { ...updatedParts[partIndex], ...updates }
    setQuiz({ ...quiz, parts: updatedParts })
  }

  const updateQuestion = (partIndex: number, questionIndex: number, updates: Partial<Question>) => {
    if (!quiz) return
    const updatedParts = [...quiz.parts]
    const updatedQuestions = [...updatedParts[partIndex].questions]
    updatedQuestions[questionIndex] = { ...updatedQuestions[questionIndex], ...updates }
    updatedParts[partIndex] = { ...updatedParts[partIndex], questions: updatedQuestions }
    setQuiz({ ...quiz, parts: updatedParts })
  }

  const addQuestion = (partIndex: number) => {
    if (!quiz) return
    const newQuestion: Question = {
      id: `p${partIndex + 1}q${quiz.parts[partIndex].questions.length + 1}`,
      type: 'MULTIPLE_CHOICE',
      prompt: '',
      options: [
        { id: 'a', text: '' },
        { id: 'b', text: '' },
        { id: 'c', text: '' },
        { id: 'd', text: '' }
      ],
    }
    
    const updatedParts = [...quiz.parts]
    updatedParts[partIndex].questions.push(newQuestion)
    setQuiz({ ...quiz, parts: updatedParts })
  }

  const deleteQuestion = (partIndex: number, questionIndex: number) => {
    if (!quiz) return
    const updatedParts = [...quiz.parts]
    updatedParts[partIndex].questions.splice(questionIndex, 1)
    setQuiz({ ...quiz, parts: updatedParts })
    if (selectedQuestionIndex >= updatedParts[partIndex].questions.length) {
      setSelectedQuestionIndex(Math.max(0, updatedParts[partIndex].questions.length - 1))
    }
  }

  const addPart = () => {
    if (!quiz) return
    const newPartNumber = quiz.parts.length + 1
    const newPart: QuizPart = {
      partNumber: newPartNumber,
      title: `Part ${newPartNumber}`,
      content: {
        title: `${quiz.testType === 'reading' ? 'Reading Passage' : 'Listening Section'} ${newPartNumber}`,
        subtitle: 'Add your content here...',
        ...(quiz.testType === 'reading' 
          ? {
              paragraphs: [
                {
                  label: 'A',
                  text: 'Your passage text goes here...'
                }
              ]
            }
          : {
              audioUrl: `/audio/${quiz.testType}-section-${newPartNumber}.mp3`
            })
      },
      questions: []
    }

    const updatedParts = [...quiz.parts, newPart]
    setQuiz({ ...quiz, parts: updatedParts })
    
    // Switch to new part
    setSelectedPartIndex(newPartNumber - 1)
    setSelectedQuestionIndex(0)
  }

  const deletePart = (partIndex: number) => {
    if (!quiz || quiz.parts.length <= 1) {
      alert('Quiz phải có ít nhất 1 part!')
      return
    }
    
    const updatedParts = [...quiz.parts]
    updatedParts.splice(partIndex, 1)
    
    // Renumber parts
    updatedParts.forEach((part, index) => {
      part.partNumber = index + 1
    })
    
    setQuiz({ ...quiz, parts: updatedParts })
    
    // Adjust selected part if needed
    if (selectedPartIndex >= updatedParts.length) {
      setSelectedPartIndex(Math.max(0, updatedParts.length - 1))
    }
    setSelectedQuestionIndex(0)
  }

  const renderQuestionEditor = (question: Question, partIndex: number, questionIndex: number) => {
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="prompt">Câu hỏi</Label>
              <Textarea
                id="prompt"
                value={question.prompt || ''}
                onChange={(e) => updateQuestion(partIndex, questionIndex, { prompt: e.target.value })}
                placeholder="Nhập câu hỏi..."
              />
            </div>
            <div>
              <Label>Các lựa chọn (chỉ đọc từ JSON)</Label>
              {question.options?.map((option, optionIndex) => (
                <div key={option.id} className="flex items-center gap-3 mt-3">
                  <input
                    type="radio"
                    name={`correct-answer-${question.id}`}
                    value={option.id}
                    checked={question.correctAnswer === option.id}
                    onChange={(e) => updateQuestion(partIndex, questionIndex, { correctAnswer: e.target.value })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                    title="Chọn làm đáp án đúng"
                  />
                  <Input
                    value={option.text}
                    onChange={(e) => {
                      const updatedOptions = [...(question.options || [])]
                      updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], text: e.target.value }
                      updateQuestion(partIndex, questionIndex, { options: updatedOptions })
                    }}
                    placeholder={`Lựa chọn ${option.id.toUpperCase()}`}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
            <div>
              <Label htmlFor="correctAnswer">Đáp án đúng</Label>
              <Select 
                value={question.correctAnswer || ''}
                onValueChange={(value) => updateQuestion(partIndex, questionIndex, { correctAnswer: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn đáp án đúng" />
                </SelectTrigger>
                <SelectContent>
                  {question.options?.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.id.toUpperCase()}: {option.text || 'Chưa có nội dung'}
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
              <Label htmlFor="text">Phát biểu</Label>
              <Textarea
                id="text"
                value={question.text || ''}
                onChange={(e) => updateQuestion(partIndex, questionIndex, { text: e.target.value })}
                placeholder="Nhập phát biểu cần đánh giá..."
              />
            </div>
            <div>
              <Label htmlFor="correctAnswer">Đáp án đúng</Label>
              <Select 
                value={question.correctAnswer || ''}
                onValueChange={(value) => updateQuestion(partIndex, questionIndex, { correctAnswer: value })}
              >
                <SelectTrigger>
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
              <Label htmlFor="instruction">Hướng dẫn</Label>
              <Textarea
                id="instruction"
                value={question.instruction || ''}
                onChange={(e) => updateQuestion(partIndex, questionIndex, { instruction: e.target.value })}
                placeholder="Write TRUE if the statement agrees with the information..."
              />
            </div>
          </div>
        )

      case 'SENTENCE_COMPLETION':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text">Câu có chỗ trống</Label>
              <Textarea
                id="text"
                value={question.text || ''}
                onChange={(e) => updateQuestion(partIndex, questionIndex, { text: e.target.value })}
                placeholder="Nhập câu có chỗ trống hoặc từ cần thay thế..."
              />
            </div>
            <div>
              <Label htmlFor="correctAnswer">Đáp án đúng</Label>
              <Input
                id="correctAnswer"
                value={question.correctAnswer || ''}
                onChange={(e) => updateQuestion(partIndex, questionIndex, { correctAnswer: e.target.value })}
                placeholder="Đáp án đúng"
              />
            </div>
            <div>
              <Label htmlFor="instruction">Hướng dẫn</Label>
              <Input
                id="instruction"
                value={question.instruction || ''}
                onChange={(e) => updateQuestion(partIndex, questionIndex, { instruction: e.target.value })}
                placeholder="Choose NO MORE THAN TWO WORDS from the passage for each answer."
              />
            </div>
          </div>
        )

      case 'PARAGRAPH_MATCHING_TABLE':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text">Mô tả cần khớp</Label>
              <Textarea
                id="text"
                value={question.text || ''}
                onChange={(e) => updateQuestion(partIndex, questionIndex, { text: e.target.value })}
                placeholder="Nhập mô tả cần khớp với paragraph..."
              />
            </div>
            <div>
              <Label htmlFor="instruction">Hướng dẫn</Label>
              <Input
                id="instruction"
                value={question.instruction || ''}
                onChange={(e) => updateQuestion(partIndex, questionIndex, { instruction: e.target.value })}
                placeholder="Choose the correct letter A-C for each answer."
              />
            </div>
            <ParagraphMatchingEditor
              correctAnswer={question.correctAnswer || ''}
              paragraphLabels={question.paragraphLabels || []}
              onUpdate={(data) => {
                updateQuestion(partIndex, questionIndex, {
                  correctAnswer: data.correctAnswer,
                  paragraphLabels: data.paragraphLabels
                })
              }}
            />
          </div>
        )

      case 'DRAG_AND_DROP':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text">Câu cần hoàn thành</Label>
              <Textarea
                id="text"
                value={question.text || ''}
                onChange={(e) => updateQuestion(partIndex, questionIndex, { text: e.target.value })}
                placeholder="Nhập câu cần hoàn thành... (vd: The usual business environment _____)"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="instruction">Hướng dẫn</Label>
              <Textarea
                id="instruction"
                value={question.instruction || ''}
                onChange={(e) => updateQuestion(partIndex, questionIndex, { instruction: e.target.value })}
                placeholder="Complete each sentence with the correct ending, A-H, below."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="correctAnswer">Đáp án đúng (ID option)</Label>
              <Input
                id="correctAnswer"
                value={question.correctAnswer || ''}
                onChange={(e) => updateQuestion(partIndex, questionIndex, { correctAnswer: e.target.value })}
                placeholder="opt_a"
              />
            </div>
            {(() => {
              // Lấy thông tin nhóm cho câu hỏi hiện tại
              const currentPart = quiz?.parts[selectedPartIndex]
              if (!currentPart) return null
              
              const currentGroup = getGroupForQuestion(currentPart.questions, questionIndex)
              if (!currentGroup) {
                return (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm text-yellow-800 mb-1 font-medium">
                      ℹ️ Shared Options không khả dụng
                    </div>
                    <div className="text-sm text-yellow-700">
                      Câu hỏi này không thuộc nhóm DRAG_AND_DROP liền kề nào. 
                      Shared options chỉ hoạt động khi có nhiều câu DRAG_AND_DROP liên tiếp.
                    </div>
                  </div>
                )
              }
              
              const currentOptions = getGroupSharedOptions(
                currentPart.dragOptionsGroups || {},
                currentGroup.groupId
              )
              
              return (
                <DragOptionsManager
                  options={currentOptions}
                  groupId={currentGroup.groupId}
                  groupInfo={{
                    startIndex: currentGroup.startIndex,
                    endIndex: currentGroup.endIndex,
                    questionIds: currentGroup.questionIds
                  }}
                  onUpdateOptions={(newOptions) => {
                    const updatedGroups = updateGroupSharedOptions(
                      currentPart.dragOptionsGroups || {},
                      currentGroup.groupId,
                      newOptions
                    )
                    updatePart(selectedPartIndex, { dragOptionsGroups: updatedGroups })
                  }}
                />
              )
            })()}
          </div>
        )

      case 'TABLE_COMPLETION':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text">Hướng dẫn hoàn thành bảng</Label>
              <Textarea
                id="text"
                value={question.text || ''}
                onChange={(e) => updateQuestion(partIndex, questionIndex, { text: e.target.value })}
                placeholder="Complete the table below. Write ONE WORD AND/OR A NUMBER for each answer."
              />
            </div>
            <div>
              <Label htmlFor="instruction">Tiêu đề bảng</Label>
              <Input
                id="instruction"
                value={question.instruction || ''}
                onChange={(e) => updateQuestion(partIndex, questionIndex, { instruction: e.target.value })}
                placeholder="BEECHEN FESTIVAL"
              />
            </div>
            <TableCompletionEditor
              tableData={question.tableData || { headers: [], rows: [] }}
              onUpdate={(tableData) => {
                updateQuestion(partIndex, questionIndex, { tableData })
              }}
            />
          </div>
        )

      case 'MULTIPLE_SELECT':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="prompt">Câu hỏi</Label>
              <Textarea
                id="prompt"
                value={question.prompt || ''}
                onChange={(e) => updateQuestion(partIndex, questionIndex, { prompt: e.target.value })}
                placeholder="Which THREE of the following features..."
              />
            </div>
            <div>
              <Label htmlFor="instruction">Hướng dẫn</Label>
              <Input
                id="instruction"
                value={question.instruction || ''}
                onChange={(e) => updateQuestion(partIndex, questionIndex, { instruction: e.target.value })}
                placeholder="Choose THREE correct answers."
              />
            </div>
            <div>
              <Label htmlFor="maxSelections">Số lượng tối đa có thể chọn</Label>
              <Input
                id="maxSelections"
                type="number"
                value={question.maxSelections || 1}
                onChange={(e) => updateQuestion(partIndex, questionIndex, { maxSelections: parseInt(e.target.value) || 1 })}
                placeholder="3"
              />
            </div>
            <div>
              <Label>Các lựa chọn và đáp án đúng</Label>
              {question.options?.map((option, optionIndex) => (
                <div key={option.id} className="flex items-center space-x-2 mt-2">
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
                      updateQuestion(partIndex, questionIndex, { correctAnswer: newCorrectAnswers })
                    }}
                    className="w-4 h-4"
                    title="Chọn làm đáp án đúng"
                  />
                  <Label className="w-8">{option.id.toUpperCase()}:</Label>
                  <Input
                    value={option.text}
                    onChange={(e) => {
                      const updatedOptions = [...(question.options || [])]
                      updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], text: e.target.value }
                      updateQuestion(partIndex, questionIndex, { options: updatedOptions })
                    }}
                    placeholder={`Lựa chọn ${option.id.toUpperCase()}`}
                    className="flex-1"
                  />
                </div>
              )) || (
                <div className="text-gray-500 italic">
                  Chưa có lựa chọn. Thêm bằng cách nhấn nút "Thêm" phía trên.
                </div>
              )}
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
              <Label htmlFor="prompt">Câu hỏi</Label>
              <Textarea
                id="prompt"
                value={question.prompt || ''}
                onChange={(e) => updateQuestion(partIndex, questionIndex, { prompt: e.target.value })}
                placeholder="How did the following categories compare..."
              />
            </div>
            <div>
              <Label htmlFor="instruction">Hướng dẫn</Label>
              <Textarea
                id="instruction"
                value={question.instruction || ''}
                onChange={(e) => updateQuestion(partIndex, questionIndex, { instruction: e.target.value })}
                placeholder="Choose the correct letter, A, B or C..."
              />
            </div>
            <MatchingTableEditor
              tableData={question.tableData || { headers: [], options: {}, rows: [] }}
              onUpdate={(tableData) => {
                updateQuestion(partIndex, questionIndex, { tableData })
              }}
            />
          </div>
        )

      default:
        return (
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-gray-600">
              Trình chỉnh sửa cho loại câu hỏi <strong>{question.type}</strong> chưa được hỗ trợ.
            </p>
          </div>
        )
    }
  }

  const saveQuiz = async () => {
    if (!quiz) {
      alert('Không thể lưu quiz: Dữ liệu quiz chưa được tải!')
      return
    }

    try {
      // Calculate total questions
      const totalQuestions = quiz.parts.reduce((total, part) => total + part.questions.length, 0)
      const updatedQuiz = { ...quiz, metadata: { ...quiz.metadata, totalQuestions } }

      // Remove fields that backend doesn't allow in update
      const {
        id,
        createdAt,
        updatedAt,
        createdById,
        createdBy,
        userQuizAccess,
        isPublished,
        isPublic,
        ...quizDataToUpdate
      } = updatedQuiz

      // Backend expects lowercase testType
      const dataToSend = {
        ...quizDataToUpdate,
        testType: quizDataToUpdate.testType.toLowerCase()
      }

      // Save using API service
      const savedQuiz = await quizApiService.updateQuiz(quiz.id!, dataToSend)

      // Update local state with saved data
      setQuiz(savedQuiz)

      console.log('Quiz saved:', savedQuiz)
      alert('Quiz đã được lưu thành công!\n\n' +
            `Tiêu đề: ${savedQuiz.title}\n` +
            `Loại: ${savedQuiz.testType}\n` +
            `Số phần: ${savedQuiz.parts.length}\n` +
            `Tổng câu hỏi: ${totalQuestions}\n` +
            `Thời gian: ${savedQuiz.totalTimeLimit} phút`)

      // Redirect to quiz management page after successful save
      window.location.href = '/admin/quiz'
    } catch (error) {
      console.error('Failed to save quiz:', error)
      alert('Có lỗi xảy ra khi lưu quiz!')
    }
  }

  if (loading || !quiz) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Đang tải dữ liệu quiz...</div>
      </div>
    )
  }

  const currentPart = quiz.parts[selectedPartIndex]
  const currentQuestion = currentPart?.questions[selectedQuestionIndex]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/admin/quiz">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            {quiz.testType === 'reading' ? <FileText className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
            <h1 className="text-3xl font-bold">{quiz.title}</h1>
            <Badge variant={quiz.testType === 'reading' ? 'default' : 'secondary'}>
              {quiz.testType === 'reading' ? 'Reading' : 'Listening'}
            </Badge>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              // Open preview in new tab - will load current saved data from API
              window.open(`/quiz/${quiz.testType}/${quiz.id}?preview=true`, '_blank')
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            Xem trước
          </Button>
          <Button onClick={saveQuiz}>
            <Save className="h-4 w-4 mr-2" />
            Lưu Quiz
          </Button>
        </div>
      </div>

      {/* Quiz Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="title">Tiêu đề</Label>
            <Input
              id="title"
              value={quiz.title}
              onChange={(e) => updateQuiz({ title: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="timeLimit">Thời gian (phút)</Label>
            <Input
              id="timeLimit"
              type="number"
              value={quiz.totalTimeLimit}
              onChange={(e) => updateQuiz({ totalTimeLimit: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label htmlFor="testType">Loại test</Label>
            <Select 
              value={quiz.testType}
              onValueChange={(value: 'reading' | 'listening') => updateQuiz({ testType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reading">Reading</SelectItem>
                <SelectItem value="listening">Listening</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Part Content Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Nội dung Part {currentPart?.partNumber}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="partTitle">Tiêu đề Part</Label>
            <Input
              id="partTitle"
              value={currentPart?.title || ''}
              onChange={(e) => updatePart(selectedPartIndex, { title: e.target.value })}
              placeholder="Nhập tiêu đề part..."
            />
          </div>
          <div>
            <Label htmlFor="contentTitle">Tiêu đề nội dung</Label>
            <Input
              id="contentTitle"
              value={currentPart?.content.title || ''}
              onChange={(e) => updatePart(selectedPartIndex, { 
                content: { ...currentPart!.content, title: e.target.value }
              })}
              placeholder="Nhập tiêu đề nội dung..."
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="contentSubtitle">Phụ đề</Label>
            <Input
              id="contentSubtitle"
              value={currentPart?.content.subtitle || ''}
              onChange={(e) => updatePart(selectedPartIndex, { 
                content: { ...currentPart!.content, subtitle: e.target.value }
              })}
              placeholder="Nhập phụ đề..."
            />
          </div>
          
          {/* Paragraphs editor for reading quizzes */}
          {quiz.testType === 'reading' && (
            <div className="md:col-span-2">
              <Label>Paragraphs</Label>
              <div className="space-y-4 mt-2">
                {(currentPart?.content.paragraphs || []).map((paragraph, paragraphIndex) => (
                  <div key={paragraphIndex} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`paragraph-label-${paragraphIndex}`}>Label:</Label>
                        <Input
                          id={`paragraph-label-${paragraphIndex}`}
                          value={paragraph.label || ''}
                          onChange={(e) => {
                            const updatedParagraphs = [...(currentPart!.content.paragraphs || [])]
                            updatedParagraphs[paragraphIndex] = { 
                              ...updatedParagraphs[paragraphIndex], 
                              label: e.target.value 
                            }
                            updatePart(selectedPartIndex, { 
                              content: { ...currentPart!.content, paragraphs: updatedParagraphs }
                            })
                          }}
                          placeholder="A, B, C..."
                          className="w-20"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          const updatedParagraphs = currentPart!.content.paragraphs?.filter((_, i) => i !== paragraphIndex) || []
                          updatePart(selectedPartIndex, { 
                            content: { ...currentPart!.content, paragraphs: updatedParagraphs }
                          })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={paragraph.text || ''}
                      onChange={(e) => {
                        const updatedParagraphs = [...(currentPart!.content.paragraphs || [])]
                        updatedParagraphs[paragraphIndex] = { 
                          ...updatedParagraphs[paragraphIndex], 
                          text: e.target.value 
                        }
                        updatePart(selectedPartIndex, { 
                          content: { ...currentPart!.content, paragraphs: updatedParagraphs }
                        })
                      }}
                      placeholder="Nhập nội dung paragraph..."
                      rows={4}
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    const updatedParagraphs = [
                      ...(currentPart!.content.paragraphs || []),
                      { label: String.fromCharCode(65 + (currentPart!.content.paragraphs?.length || 0)), text: '' }
                    ]
                    updatePart(selectedPartIndex, { 
                      content: { ...currentPart!.content, paragraphs: updatedParagraphs }
                    })
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm Paragraph
                </Button>
              </div>
            </div>
          )}

          {quiz.testType === 'listening' && (
            <div className="md:col-span-2">
              <Label htmlFor="audioUrl">Audio URL</Label>
              <Input
                id="audioUrl"
                value={currentPart?.content.audioUrl || ''}
                onChange={(e) => updatePart(selectedPartIndex, { 
                  content: { ...currentPart!.content, audioUrl: e.target.value }
                })}
                placeholder="/audio/listening-section-1.mp3"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parts and Questions Management */}
      <ResizableCardLayout 
        className="min-h-[600px]"
        defaultWidths={[20, 20, 60]}
      >
        {/* Parts List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Các phần ({quiz.parts.length})</CardTitle>
              <Button 
                size="sm"
                onClick={addPart}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quiz.parts.map((part, index) => (
                <div key={part.partNumber} className="flex items-center space-x-2">
                  <Button
                    variant={index === selectedPartIndex ? "default" : "outline"}
                    className="flex-1 justify-start"
                    onClick={() => {
                      setSelectedPartIndex(index)
                      setSelectedQuestionIndex(0)
                    }}
                  >
                    {part.title}
                    <Badge variant="secondary" className="ml-auto">
                      {part.questions.length}
                    </Badge>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deletePart(index)}
                    disabled={quiz.parts.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Câu hỏi Part {currentPart?.partNumber} ({currentPart?.questions.length || 0})
              </CardTitle>
              <Button 
                size="sm"
                onClick={() => addQuestion(selectedPartIndex)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {currentPart?.questions.map((question, index) => (
                <div
                  key={question.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    index === selectedQuestionIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  }`}
                  onClick={() => setSelectedQuestionIndex(index)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {question.id}
                      </div>
                      <div className="text-sm opacity-75">
                        {question.type.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteQuestion(selectedPartIndex, index)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Question Editor */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Chỉnh sửa: {currentQuestion?.id}
              </CardTitle>
              <Select
                value={currentQuestion?.type}
                onValueChange={(value) => updateQuestion(selectedPartIndex, selectedQuestionIndex, { type: value as any })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableQuestionTypes(quiz.testType).map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {currentQuestion ? (
              renderQuestionEditor(currentQuestion, selectedPartIndex, selectedQuestionIndex)
            ) : (
              <div className="text-center text-gray-500 py-8">
                Chọn một câu hỏi để chỉnh sửa
              </div>
            )}
          </CardContent>
        </Card>
      </ResizableCardLayout>
    </div>
  )
}