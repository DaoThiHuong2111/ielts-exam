'use client'

import { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft, 
  UserPlus, 
  UserMinus, 
  Search, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import quizApiService, { QuizAccess } from '@/services/quiz-api.service'
import { MultiPartQuiz } from '@/types/multi-part-quiz'
import UserSearchModal from '@/components/admin/user-search-modal'

interface QuizUsersPageProps {
  params: Promise<{
    id: string
  }>
}

export default function QuizUsersPage({ params }: QuizUsersPageProps) {
  const resolvedParams = use(params)
  const [quiz, setQuiz] = useState<MultiPartQuiz | null>(null)
  const [quizAccess, setQuizAccess] = useState<QuizAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showUserModal, setShowUserModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [resolvedParams.id])

  const loadData = async () => {
    try {
      setLoading(true)
      const [quizData, accessData] = await Promise.all([
        quizApiService.getQuiz(resolvedParams.id),
        quizApiService.getQuizUsers(resolvedParams.id)
      ])
      setQuiz(quizData)
      setQuizAccess(accessData)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const handleGrantAccess = async (userIds: string[], expiresAt?: string) => {
    try {
      const result = await quizApiService.grantQuizAccess(
        resolvedParams.id,
        userIds,
        expiresAt
      )
      toast.success(result.message)
      loadData() // Reload access list
      setShowUserModal(false)
    } catch (error) {
      console.error('Failed to grant access:', error)
      toast.error('Không thể cấp quyền truy cập')
    }
  }

  const handleRevokeAccess = async (userId: string, userName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn thu hồi quyền truy cập của ${userName}?`)) {
      try {
        await quizApiService.revokeQuizAccess(resolvedParams.id, userId)
        toast.success('Đã thu hồi quyền truy cập')
        loadData() // Reload access list
      } catch (error) {
        console.error('Failed to revoke access:', error)
        toast.error('Không thể thu hồi quyền truy cập')
      }
    }
  }

  const handleUpdateAccess = async (userId: string, updates: { isActive?: boolean; expiresAt?: string }) => {
    try {
      await quizApiService.updateQuizAccess(resolvedParams.id, userId, updates)
      toast.success('Đã cập nhật quyền truy cập')
      loadData()
    } catch (error) {
      console.error('Failed to update access:', error)
      toast.error('Không thể cập nhật quyền truy cập')
    }
  }

  const filteredAccess = quizAccess.filter(access => {
    const searchLower = searchTerm.toLowerCase()
    return (
      access.user?.name?.toLowerCase().includes(searchLower) ||
      access.user?.email?.toLowerCase().includes(searchLower) ||
      access.user?.username?.toLowerCase().includes(searchLower)
    )
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Đang tải dữ liệu...</div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Không tìm thấy quiz</div>
      </div>
    )
  }

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
          <div>
            <h1 className="text-2xl font-bold">Quản lý quyền truy cập</h1>
            <p className="text-gray-600">{quiz.title}</p>
          </div>
        </div>
        <Button onClick={() => setShowUserModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Thêm người dùng
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizAccess.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quizAccess.filter(a => a.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã tạm dừng</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quizAccess.filter(a => !a.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sắp hết hạn</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quizAccess.filter(a => {
                const days = getDaysRemaining(a.expiresAt)
                return days !== null && days > 0 && days <= 7
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng có quyền truy cập</CardTitle>
          <CardDescription>
            Quản lý quyền truy cập quiz cho từng người dùng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo tên, email hoặc username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* User Access List */}
          <div className="space-y-4">
            {filteredAccess.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'Không tìm thấy người dùng phù hợp' : 'Chưa có người dùng nào được cấp quyền'}
              </div>
            ) : (
              filteredAccess.map((access) => (
                <div
                  key={access.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{access.user?.name}</h4>
                        {access.isActive ? (
                          <Badge variant="default" className="text-xs">Hoạt động</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Tạm dừng</Badge>
                        )}
                        {(() => {
                          const days = getDaysRemaining(access.expiresAt)
                          if (days !== null && days <= 0) {
                            return <Badge variant="destructive" className="text-xs">Đã hết hạn</Badge>
                          } else if (days !== null && days <= 7) {
                            return <Badge variant="outline" className="text-xs text-yellow-600">
                              Còn {days} ngày
                            </Badge>
                          }
                          return null
                        })()}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <div>Email: {access.user?.email}</div>
                        <div>Username: {access.user?.username}</div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2 space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Cấp ngày: {formatDate(access.grantedAt)}
                        </div>
                        {access.expiresAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Hết hạn: {formatDate(access.expiresAt)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={access.isActive ? "outline" : "default"}
                        onClick={() => handleUpdateAccess(access.userId, { 
                          isActive: !access.isActive 
                        })}
                      >
                        {access.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRevokeAccess(access.userId, access.user?.name || '')}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Search Modal */}
      {showUserModal && (
        <UserSearchModal
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          onSelectUsers={handleGrantAccess}
          excludeUserIds={quizAccess.map(a => a.userId)}
        />
      )}
    </div>
  )
}