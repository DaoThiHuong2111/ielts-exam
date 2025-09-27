'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Eye, FileText, Headphones, Upload, Download } from 'lucide-react'
import { MultiPartQuiz } from '@/types/multi-part-quiz'
import Link from 'next/link'
import quizApiService from '@/services/quiz-api.service'
import { useAdminRouteProtection } from '@/hooks/useRouteProtection'

export default function QuizManagementPage() {
  const { isChecking, isAdmin } = useAdminRouteProtection()
  const [quizzes, setQuizzes] = useState<MultiPartQuiz[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)

  // All hooks must be called before any conditional returns
  useEffect(() => {
    // Only load quizzes if user is admin and not checking
    if (!isChecking && isAdmin) {
      loadQuizzes()
    }
  }, [isChecking, isAdmin])

  // Show loading while checking admin access
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // If not admin, return null (will be handled by useAdminRouteProtection)
  if (!isChecking && !isAdmin) {
    return null;
  }

  const loadQuizzes = async () => {
    try {
      const response = await quizApiService.getQuizzes()
      // Handle nested response structure: {status, data: {data: [...]}}
      const quizzesData = response?.data?.data || response?.data || response || []
      setQuizzes(Array.isArray(quizzesData) ? quizzesData : [])
    } catch (error) {
      console.error('Failed to load quizzes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getQuizTypeIcon = (testType: string) => {
    return testType === 'READING' ? <FileText className="h-4 w-4" /> : <Headphones className="h-4 w-4" />
  }

  const getQuizTypeBadge = (testType: string) => {
    return (
      <Badge variant={testType === 'READING' ? 'default' : 'secondary'}>
        {testType === 'READING' ? 'Reading' : 'Listening'}
      </Badge>
    )
  }

  const handleExportQuiz = async (quiz: MultiPartQuiz) => {
    try {
      const blob = await quizApiService.exportQuiz(quiz.id)

      // Create download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${quiz.testType.toLowerCase()}-quiz-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export quiz.')
    }
  }

  const handleExportAll = async () => {
    try {
      const response = await quizApiService.getQuizzes()
      const allQuizzes = response?.data || response || []

      // Export without IDs for clean JSON
      const exportData = allQuizzes.map(({ id, ...quiz }) => quiz)
      const jsonString = JSON.stringify(exportData, null, 2)

      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `all-quizzes-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export quizzes.')
    }
  }

  const handleDeleteQuiz = async (quiz: MultiPartQuiz) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa quiz "${quiz.title}"?`)) {
      try {
        await quizApiService.deleteQuiz(quiz.id)

        // Refresh quiz list
        await loadQuizzes()
        alert('Quiz đã được xóa thành công!')
      } catch (error) {
        console.error('Delete error:', error)
        alert('Failed to delete quiz.')
      }
    }
  }

  const handleImportQuiz = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const importedQuiz = await quizApiService.importQuiz(file)

      // Refresh quiz list
      await loadQuizzes()
      alert('Quiz imported successfully!')
      event.target.value = '' // Reset input
    } catch (error) {
      console.error('Import error:', error)
      alert('Failed to import quiz. Please check your file format.')
    } finally {
      setImporting(false)
    }
  }

  const handleCreateNewQuiz = async () => {
    // Ask user to choose quiz type
    const quizType = prompt("Chọn loại quiz:\n1. Reading\n2. Listening\n\nNhập 1 hoặc 2:", "1")
    const testType = quizType === "2" ? "listening" : "reading"

    try {
      // Create minimal quiz structure
      const newQuiz = {
        title: `New ${testType} Quiz`,
        testType,
        totalTimeLimit: 60,
        metadata: { totalQuestions: 0 },
        parts: [],
        isPublished: false,
        isPublic: false
      }

      const createdQuiz = await quizApiService.createQuiz(newQuiz)

      // Redirect to edit page
      window.location.href = `/admin/quiz/${createdQuiz.id}/edit`
    } catch (error) {
      console.error('Create error:', error)
      alert('Failed to create quiz.')
    }
  }

  const handleTogglePublish = async (quiz: MultiPartQuiz) => {
    try {
      await quizApiService.togglePublish(quiz.id, !quiz.isPublished)
      await loadQuizzes()
    } catch (error) {
      console.error('Toggle publish error:', error)
      alert('Failed to update quiz status.')
    }
  }

  const handleTogglePublic = async (quiz: MultiPartQuiz) => {
    try {
      await quizApiService.togglePublic(quiz.id, !quiz.isPublic)
      await loadQuizzes()
    } catch (error) {
      console.error('Toggle public error:', error)
      alert('Failed to update quiz visibility.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Đang tải dữ liệu quiz...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quiz Management</h1>
          <p className="text-gray-600 mt-2">Manage and organize your IELTS quizzes</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".json"
            onChange={handleImportQuiz}
            className="hidden"
            id="import-quiz"
            disabled={importing}
          />
          <Button
            onClick={() => document.getElementById('import-quiz')?.click()}
            disabled={importing}
            variant="outline"
          >
            <Upload className="h-4 w-4 mr-2" />
            {importing ? 'Importing...' : 'Import Quiz'}
          </Button>
          <Button onClick={handleExportAll} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
          <Button onClick={handleCreateNewQuiz}>
            <Plus className="h-4 w-4 mr-2" />
            Create Quiz
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {quizzes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No quizzes found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first quiz</p>
              <Button onClick={handleCreateNewQuiz}>
                <Plus className="h-4 w-4 mr-2" />
                Create Quiz
              </Button>
            </CardContent>
          </Card>
        ) : (
          quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getQuizTypeIcon(quiz.testType)}
                      <CardTitle className="text-xl">{quiz.title}</CardTitle>
                      {getQuizTypeBadge(quiz.testType)}
                      <Badge variant={quiz.isPublished ? "default" : "secondary"}>
                        {quiz.isPublished ? "Published" : "Draft"}
                      </Badge>
                      <Badge variant={quiz.isPublic ? "default" : "outline"}>
                        {quiz.isPublic ? "Public" : "Private"}
                      </Badge>
                    </div>
                    <CardDescription>
                      {quiz.metadata?.totalQuestions || 0} questions • {quiz.totalTimeLimit} minutes
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePublish(quiz)}
                    >
                      {quiz.isPublished ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePublic(quiz)}
                    >
                      {quiz.isPublic ? "Make Private" : "Make Public"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleExportQuiz(quiz)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Link href={`/admin/quiz/${quiz.id}/users`}>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/quiz/${quiz.id}/edit`}>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteQuiz(quiz)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}