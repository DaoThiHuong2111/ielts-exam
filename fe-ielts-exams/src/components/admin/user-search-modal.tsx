'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, UserPlus, Calendar } from 'lucide-react'
import { clientService } from '@/lib/axios'
import toast from 'react-hot-toast'

interface User {
  id: string
  username: string
  email: string
  name: string
  role: string
}

interface UserSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectUsers: (userIds: string[], expiresAt?: string) => void
  excludeUserIds?: string[]
}

export default function UserSearchModal({
  isOpen,
  onClose,
  onSelectUsers,
  excludeUserIds = []
}: UserSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [expiresAt, setExpiresAt] = useState('')

  useEffect(() => {
    if (isOpen) {
      searchUsers('')
    }
  }, [isOpen])

  const searchUsers = async (query: string) => {
    try {
      setLoading(true)
      const { data } = await clientService.get('/v1/users', {
        params: {
          search: query,
          limit: 20
        }
      })
      // Filter out excluded users (users who already have access to this quiz)
      const filteredUsers = data.filter((user: User) => !excludeUserIds.includes(user.id))
      setUsers(filteredUsers)
    } catch (error) {
      console.error('Failed to search users:', error)
      toast.error('Không thể tìm kiếm người dùng')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    if (value.length >= 2 || value === '') {
      searchUsers(value)
    }
  }

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId)
      } else {
        return [...prev, userId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(u => u.id))
    }
  }

  const handleSubmit = () => {
    if (selectedUsers.length === 0) {
      toast.error('Vui lòng chọn ít nhất một người dùng')
      return
    }

    onSelectUsers(selectedUsers, expiresAt || undefined)
    setSelectedUsers([])
    setSearchTerm('')
    setExpiresAt('')
  }

  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Thêm người dùng vào quiz</DialogTitle>
          <DialogDescription>
            {excludeUserIds.length > 0 && 
              `Đã lọc bỏ ${excludeUserIds.length} người dùng đã có quyền truy cập quiz này`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* Search Input */}
          <div>
            <Label htmlFor="search">Tìm kiếm người dùng</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Nhập tên, email hoặc username..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* User List */}
          <div className="border rounded-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                Đang tìm kiếm...
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'Không tìm thấy người dùng phù hợp' : 'Không có người dùng mới để thêm'}
              </div>
            ) : (
              <>
                {/* Select All */}
                <div className="border-b p-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <Label htmlFor="select-all" className="text-sm font-medium">
                      Chọn tất cả ({users.length} người dùng)
                    </Label>
                  </div>
                </div>

                {/* User List */}
                {users.map((user) => (
                  <div key={user.id} className="border-b last:border-b-0">
                    <div className="p-3 hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleUserToggle(user.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <Label 
                            htmlFor={`user-${user.id}`} 
                            className="block cursor-pointer"
                          >
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400">@{user.username}</div>
                          </Label>
                        </div>
                        <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'default'}>
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Expiration Date */}
          <div>
            <Label htmlFor="expiresAt">Ngày hết hạn (tùy chọn)</Label>
            <Input
              id="expiresAt"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={getMinDate()}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Để trống nếu muốn bỏ giới hạn thời gian truy cập
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={selectedUsers.length === 0 || loading}
          >
            Cấp quyền ({selectedUsers.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}