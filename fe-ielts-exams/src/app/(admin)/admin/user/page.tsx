'use client'

import { useEffect, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react'
import { useAdminRouteProtection } from '@/hooks/useRouteProtection'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter,
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users, Plus, Trash2, Search, Settings, Eye } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface User {
  id: string
  username: string
  email: string
  name: string
  role: 'USER' | 'ADMIN'
  active: boolean
  createdAt: string
  updatedAt: string
}

interface Quiz {
  id: string
  title: string
  testType: string
  isPublished: boolean
  isPublic: boolean
}

interface UserQuizAccess {
  id: string
  userId: string
  quizId: string
  grantedAt: string
  expiresAt: string | null
  isActive: boolean
  quiz: Quiz
}

export default function UserManagementPage() {
  const { isChecking, isAdmin } = useAdminRouteProtection()
  const [users, setUsers] = useState<User[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userQuizAccess, setUserQuizAccess] = useState<UserQuizAccess[]>([])
  const [showAccessDialog, setShowAccessDialog] = useState(false)
  const [selectedQuizId, setSelectedQuizId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [userToToggle, setUserToToggle] = useState<User | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [showEditAccessDialog, setShowEditAccessDialog] = useState(false)
  const [accessToEdit, setAccessToEdit] = useState<UserQuizAccess | null>(null)
  const [editExpiresAt, setEditExpiresAt] = useState('')
  const [isUpdatingAccess, setIsUpdatingAccess] = useState(false)

  useEffect(() => {
    if (isAdmin && !isChecking) {
      loadUsers()
      loadQuizzes()
    }
  }, [isAdmin, isChecking])

  // Show loading while checking admin access
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // If not admin, return null (will be handled by useAdminRouteProtection)
  if (!isAdmin) {
    return null
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      if (data.success) {
        setUsers(data.data || [])
      } else {
        toast.error('Không thể tải danh sách người dùng')
      }
    } catch (error) {
      console.error('Failed to load users:', error)
      toast.error('Lỗi khi tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  const loadQuizzes = async () => {
    try {
      const response = await fetch('/api/quiz?limit=100')
      const data = await response.json()
      if (data.status === 'success') {
        const quizzesData = data?.data?.data || data?.data || []
        setQuizzes(Array.isArray(quizzesData) ? quizzesData : [])
      }
    } catch (error) {
      console.error('Failed to load quizzes:', error)
    }
  }

  const loadUserQuizAccess = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/quiz-access`)
      const data = await response.json()
      if (data.success) {
        setUserQuizAccess(data.data || [])
      } else {
        toast.error('Không thể tải quyền truy cập quiz')
      }
    } catch (error) {
      console.error('Failed to load user quiz access:', error)
      toast.error('Lỗi khi tải quyền truy cập quiz')
    }
  }

  const openStatusDialogForUser = (user: User) => {
    setUserToToggle(user)
    setShowStatusDialog(true)
  }

  const handleStatusBadgeClick = (
    event: ReactMouseEvent<HTMLDivElement>,
    user: User
  ) => {
    event.stopPropagation()
    if (user.role !== 'USER') {
      return
    }

    openStatusDialogForUser(user)
  }

  const handleStatusBadgeKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
    user: User
  ) => {
    if (user.role !== 'USER') {
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.stopPropagation()
      openStatusDialogForUser(user)
    }
  }

  const handleStatusDialogOpenChange = (open: boolean) => {
    setShowStatusDialog(open)
    if (!open) {
      setUserToToggle(null)
    }
  }

  const toggleUserStatus = async () => {
    if (!userToToggle) {
      return
    }

    const nextActive = !userToToggle.active
    setIsUpdatingStatus(true)

    try {
      const response = await fetch(`/api/admin/users/${userToToggle.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: nextActive }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.success) {
        toast.error(data.message || 'Không thể cập nhật trạng thái người dùng')
        return
      }

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userToToggle.id ? { ...user, active: nextActive } : user
        )
      )

      setSelectedUser((prevSelected) =>
        prevSelected && prevSelected.id === userToToggle.id
          ? { ...prevSelected, active: nextActive }
          : prevSelected
      )

      toast.success(
        nextActive
          ? 'Đã kích hoạt người dùng'
          : 'Đã vô hiệu hóa người dùng'
      )

      setShowStatusDialog(false)
      setUserToToggle(null)
    } catch (error) {
      console.error('Failed to update user status:', error)
      toast.error('Lỗi khi cập nhật trạng thái người dùng')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleEditAccessDialogOpenChange = (open: boolean) => {
    setShowEditAccessDialog(open)
    if (!open) {
      setAccessToEdit(null)
      setEditExpiresAt('')
    }
  }

  const grantQuizAccess = async () => {
    if (!selectedUser || !selectedQuizId) return

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/quiz-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: selectedQuizId,
          expiresAt: expiresAt || null,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Đã cấp quyền truy cập quiz thành công')
        loadUserQuizAccess(selectedUser.id)
        setSelectedQuizId('')
        setExpiresAt('')
        setShowAccessDialog(false)
      } else {
        toast.error(data.message || 'Không thể cấp quyền truy cập')
      }
    } catch (error) {
      console.error('Failed to grant quiz access:', error)
      toast.error('Lỗi khi cấp quyền truy cập')
    }
  }

  const revokeQuizAccess = async (accessId: string, quizId: string) => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/quiz-access/${accessId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quizId }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Đã thu hồi quyền truy cập thành công')
        loadUserQuizAccess(selectedUser.id)
      } else {
        toast.error(data.message || 'Không thể thu hồi quyền truy cập')
      }
    } catch (error) {
      console.error('Failed to revoke quiz access:', error)
      toast.error('Lỗi khi thu hồi quyền truy cập')
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleUserClick = (user: User) => {
    setSelectedUser(user)
    loadUserQuizAccess(user.id)
  }

  const toInputDateTime = (value: string | null) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return ''
    }
    const tzOffset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
  }

  const openEditAccessDialog = (access: UserQuizAccess) => {
    setAccessToEdit(access)
    setEditExpiresAt(toInputDateTime(access.expiresAt))
    setShowEditAccessDialog(true)
  }

  const handleAccessItemClick = (
    event: ReactMouseEvent<HTMLDivElement>,
    access: UserQuizAccess
  ) => {
    event.stopPropagation()
    openEditAccessDialog(access)
  }

  const updateAccessExpiry = async () => {
    if (!selectedUser || !accessToEdit) {
      return
    }

    setIsUpdatingAccess(true)

    try {
      const response = await fetch(
        `/api/admin/users/${selectedUser.id}/quiz-access/${accessToEdit.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quizId: accessToEdit.quiz.id,
            expiresAt: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
          }),
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.success) {
        toast.error(data.message || 'Không thể cập nhật thời hạn truy cập')
        return
      }

      const updatedAccess: UserQuizAccess = {
        ...accessToEdit,
        expiresAt: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
      }

      setUserQuizAccess((prev) =>
        prev.map((item) => (item.id === updatedAccess.id ? updatedAccess : item))
      )

      toast.success('Đã cập nhật thời hạn truy cập')
      setShowEditAccessDialog(false)
      setAccessToEdit(null)
      setEditExpiresAt('')
    } catch (error) {
      console.error('Failed to update access expiry:', error)
      toast.error('Lỗi khi cập nhật thời hạn truy cập')
    } finally {
      setIsUpdatingAccess(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Dialog open={showStatusDialog} onOpenChange={handleStatusDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {userToToggle?.active
                ? 'Vô hiệu hóa tài khoản?'
                : 'Kích hoạt tài khoản?'}
            </DialogTitle>
            <DialogDescription>
              {userToToggle
                ? `${userToToggle.name} sẽ ${
                    userToToggle.active
                      ? 'không thể đăng nhập cho đến khi được kích hoạt lại.'
                      : 'có thể truy cập nền tảng sau khi kích hoạt.'
                  }`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleStatusDialogOpenChange(false)}
              disabled={isUpdatingStatus}
            >
              Hủy
            </Button>
            <Button
              variant={userToToggle?.active ? 'destructive' : 'default'}
              onClick={toggleUserStatus}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus
                ? 'Đang cập nhật...'
                : userToToggle?.active
                ? 'Vô hiệu hóa'
                : 'Kích hoạt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={showEditAccessDialog}
        onOpenChange={handleEditAccessDialogOpenChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thời hạn truy cập</DialogTitle>
            <DialogDescription>
              {accessToEdit
                ? `Cập nhật hạn truy cập cho ${accessToEdit.quiz.title}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-expires">Ngày hết hạn</Label>
              <Input
                id="edit-expires"
                type="datetime-local"
                value={editExpiresAt}
                onChange={(event) => setEditExpiresAt(event.target.value)}
                min={toInputDateTime(new Date().toISOString())}
              />
              <p className="text-xs text-gray-500 mt-1">
                Để trống nếu muốn bỏ giới hạn thời gian truy cập.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleEditAccessDialogOpenChange(false)}
                disabled={isUpdatingAccess}
              >
                Hủy
              </Button>
              <Button
                onClick={updateAccessExpiry}
                disabled={isUpdatingAccess}
              >
                {isUpdatingAccess ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-gray-600 mt-2">Quản lý người dùng và quyền truy cập quiz</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách người dùng</CardTitle>
            <CardDescription>
              Tổng cộng {users.length} người dùng
            </CardDescription>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedUser?.id === user.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleUserClick(user)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={user.role === 'ADMIN' ? 'destructive' : 'default'}
                        onClick={(event) => handleStatusBadgeClick(event, user)}
                        onKeyDown={(event) => handleStatusBadgeKeyDown(event, user)}
                        role={user.role === 'USER' ? 'button' : undefined}
                        tabIndex={user.role === 'USER' ? 0 : -1}
                        aria-disabled={user.role !== 'USER'}
                        className={`select-none ${
                          user.role === 'USER'
                            ? 'cursor-pointer'
                            : 'cursor-not-allowed opacity-70'
                        }`}
                        title={
                          user.role === 'USER'
                            ? 'Nhấn để kích hoạt/vô hiệu hóa tài khoản'
                            : undefined
                        }
                      >
                        {user.role}
                      </Badge>
                      <Badge variant={user.active ? 'default' : 'secondary'}>
                        {user.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Quiz Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Quyền truy cập Quiz</span>
              {selectedUser && (
                <Dialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Cấp quyền
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cấp quyền truy cập Quiz</DialogTitle>
                      <DialogDescription>
                        Cấp quyền cho {selectedUser.name} truy cập quiz
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="quiz">Chọn Quiz</Label>
                        <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn quiz..." />
                          </SelectTrigger>
                          <SelectContent>
                            {quizzes.map((quiz) => (
                              <SelectItem key={quiz.id} value={quiz.id}>
                                {quiz.title} ({quiz.testType})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="expires">Ngày hết hạn (tùy chọn)</Label>
                        <Input
                          id="expires"
                          type="datetime-local"
                          value={expiresAt}
                          onChange={(e) => setExpiresAt(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowAccessDialog(false)}>
                          Hủy
                        </Button>
                        <Button onClick={grantQuizAccess} disabled={!selectedQuizId}>
                          Cấp quyền
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardTitle>
            <CardDescription>
              {selectedUser 
                ? `Quyền truy cập của ${selectedUser.name}`
                : 'Chọn người dùng để xem quyền truy cập'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedUser ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {userQuizAccess.length > 0 ? (
                  userQuizAccess.map((access) => {
                    const expiresAtDate = access.expiresAt ? new Date(access.expiresAt) : null
                    const isExpired = expiresAtDate ? expiresAtDate < new Date() : false

                    return (
                      <div
                        key={access.id}
                        className="p-3 border rounded-lg transition-colors cursor-pointer hover:border-blue-300"
                        onClick={(event) => handleAccessItemClick(event, access)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            openEditAccessDialog(access)
                          }
                        }}
                        aria-label={`Chỉnh sửa thời hạn truy cập cho ${access.quiz.title}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{access.quiz.title}</h4>
                            <p className="text-sm text-gray-600">
                              {access.quiz.testType} • {access.quiz.isPublic ? 'Public' : 'Private'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Cấp: {new Date(access.grantedAt).toLocaleDateString('vi-VN')}
                              {access.expiresAt && (
                                <> • Hết hạn: {new Date(access.expiresAt).toLocaleDateString('vi-VN')}</>
                              )}
                            </p>
                            {isExpired && (
                              <p className="text-xs text-red-500 mt-1">
                                Quyền truy cập đã hết hạn. Cập nhật để kích hoạt lại.
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={access.isActive && !isExpired ? 'default' : 'secondary'}>
                              {access.isActive && !isExpired ? 'Active' : 'Expired'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(event) => {
                                event.stopPropagation()
                                revokeQuizAccess(access.id, access.quiz.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Người dùng này chưa có quyền truy cập quiz nào
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Chọn một người dùng để xem quyền truy cập quiz
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
