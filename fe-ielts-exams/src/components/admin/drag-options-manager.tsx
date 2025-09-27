'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { DragOption } from '@/types/multi-part-quiz'

interface DragOptionsManagerProps {
  options: DragOption[]
  onUpdateOptions: (options: DragOption[]) => void
  groupId?: string
  groupInfo?: {
    startIndex: number
    endIndex: number
    questionIds: string[]
  }
  className?: string
}

export function DragOptionsManager({ 
  options, 
  onUpdateOptions,
  groupId,
  groupInfo,
  className 
}: DragOptionsManagerProps) {

  const addOption = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const usedLabels = new Set(options.map(opt => opt.label))
    
    // Find next available letter
    const newLabel = letters.split('').find(letter => !usedLabels.has(letter)) || `${letters.length + 1}`
    
    const newOption: DragOption = {
      id: `opt_${newLabel.toLowerCase()}`,
      label: newLabel,
      text: ''
    }
    
    onUpdateOptions([...options, newOption])
  }

  const updateOption = (index: number, updates: Partial<DragOption>) => {
    const updatedOptions = [...options]
    updatedOptions[index] = { ...updatedOptions[index], ...updates }
    
    // Auto-update ID when label changes
    if (updates.label) {
      updatedOptions[index].id = `opt_${updates.label.toLowerCase()}`
    }
    
    onUpdateOptions(updatedOptions)
  }

  const removeOption = (index: number) => {
    const updatedOptions = options.filter((_, i) => i !== index)
    onUpdateOptions(updatedOptions)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              Shared Drag Options
              {groupId && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({groupId})
                </span>
              )}
            </CardTitle>
            {groupInfo && (
              <div className="text-sm text-gray-500 mt-1">
                Dùng chung cho câu hỏi {groupInfo.startIndex + 1} - {groupInfo.endIndex + 1}
                {' '}({groupInfo.questionIds.join(', ')})
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={addOption}>
            <Plus className="h-4 w-4 mr-1" />
            Thêm Option
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {options.length === 0 ? (
          <div className="text-gray-500 italic text-center p-8 border-2 border-dashed border-gray-200 rounded-lg">
            Chưa có drag options. Nhấn "Thêm Option" để bắt đầu.
          </div>
        ) : (
          options.map((option, index) => (
            <div key={option.id} className="border rounded-lg p-4 bg-gray-50 border-l-4 border-l-blue-500">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Option {index + 1}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    ID: {option.id}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => removeOption(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <Label htmlFor={`label-${index}`}>Label</Label>
                  <Input
                    id={`label-${index}`}
                    value={option.label}
                    onChange={(e) => updateOption(index, { label: e.target.value.toUpperCase() })}
                    placeholder="A"
                    maxLength={1}
                    className="text-center font-bold"
                  />
                </div>
                <div className="md:col-span-3">
                  <Label htmlFor={`text-${index}`}>Nội dung</Label>
                  <Textarea
                    id={`text-${index}`}
                    value={option.text}
                    onChange={(e) => updateOption(index, { text: e.target.value })}
                    placeholder="Nhập nội dung option..."
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}