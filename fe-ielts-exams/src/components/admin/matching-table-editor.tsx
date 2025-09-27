'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Edit3 } from 'lucide-react'

interface MatchingTableData {
  headers: string[]
  options: Record<string, string>
  rows: Array<{
    label: string
    questionId: string
    correctAnswer: string
  }>
}

interface MatchingTableEditorProps {
  tableData: MatchingTableData
  onUpdate: (data: MatchingTableData) => void
}

export function MatchingTableEditor({
  tableData,
  onUpdate
}: MatchingTableEditorProps) {
  const [localData, setLocalData] = useState<MatchingTableData>(tableData)
  
  // Sync with parent when props change
  useEffect(() => {
    setLocalData(tableData)
  }, [tableData])

  const updateData = (newData: MatchingTableData) => {
    setLocalData(newData)
    onUpdate(newData)
  }

  // Header management
  const addHeader = () => {
    const newHeaders = [...localData.headers, `Header ${localData.headers.length + 1}`]
    updateData({ ...localData, headers: newHeaders })
  }

  const updateHeader = (index: number, value: string) => {
    const newHeaders = [...localData.headers]
    newHeaders[index] = value
    updateData({ ...localData, headers: newHeaders })
  }

  const deleteHeader = (index: number) => {
    const newHeaders = localData.headers.filter((_, i) => i !== index)
    updateData({ ...localData, headers: newHeaders })
  }

  // Options management
  const addOption = () => {
    const usedKeys = Object.keys(localData.options)
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const nextKey = letters.split('').find(letter => !usedKeys.includes(letter)) || `${usedKeys.length + 1}`
    
    const newOptions = { ...localData.options, [nextKey]: '' }
    updateData({ ...localData, options: newOptions })
  }

  const updateOption = (key: string, value: string) => {
    const newOptions = { ...localData.options, [key]: value }
    updateData({ ...localData, options: newOptions })
  }

  const deleteOption = (key: string) => {
    const newOptions = { ...localData.options }
    delete newOptions[key]
    
    // Update rows that use this option
    const newRows = localData.rows.map(row => ({
      ...row,
      correctAnswer: row.correctAnswer === key ? '' : row.correctAnswer
    }))
    
    updateData({ ...localData, options: newOptions, rows: newRows })
  }

  // Row management
  const addRow = () => {
    const newRow = {
      label: '',
      questionId: `q${localData.rows.length + 1}`,
      correctAnswer: ''
    }
    const newRows = [...localData.rows, newRow]
    updateData({ ...localData, rows: newRows })
  }

  const updateRow = (index: number, field: string, value: string) => {
    const newRows = [...localData.rows]
    newRows[index] = { ...newRows[index], [field]: value }
    updateData({ ...localData, rows: newRows })
  }

  const deleteRow = (index: number) => {
    const newRows = localData.rows.filter((_, i) => i !== index)
    updateData({ ...localData, rows: newRows })
  }

  return (
    <div className="space-y-6">
      {/* Table Headers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Table Headers</CardTitle>
            <Button variant="outline" size="sm" onClick={addHeader}>
              <Plus className="h-4 w-4 mr-1" />
              Add Header
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {localData.headers.length === 0 ? (
            <div className="text-gray-500 italic text-center p-8 border-2 border-dashed border-gray-200 rounded-lg">
              No headers yet. Click "Add Header" to start.
            </div>
          ) : (
            localData.headers.map((header, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Label className="w-20">Header {index + 1}:</Label>
                <Input
                  value={header}
                  onChange={(e) => updateHeader(index, e.target.value)}
                  placeholder={index === 0 ? "Categories..." : `Option ${String.fromCharCode(65 + index - 1)}`}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteHeader(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Answer Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Answer Options</CardTitle>
            <Button variant="outline" size="sm" onClick={addOption}>
              <Plus className="h-4 w-4 mr-1" />
              Add Option
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(localData.options).length === 0 ? (
            <div className="text-gray-500 italic text-center p-8 border-2 border-dashed border-gray-200 rounded-lg">
              No options yet. Click "Add Option" to start.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(localData.options).map(([key, value]) => (
                <div key={key} className="flex items-start space-x-3 p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-bold">
                    {key}
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`option-${key}`} className="text-sm font-medium">
                      Option {key}
                    </Label>
                    <Textarea
                      id={`option-${key}`}
                      value={value}
                      onChange={(e) => updateOption(key, e.target.value)}
                      placeholder="Enter option description..."
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteOption(key)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table Rows */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Table Rows</CardTitle>
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4 mr-1" />
              Add Row
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {localData.rows.length === 0 ? (
            <div className="text-gray-500 italic text-center p-8 border-2 border-dashed border-gray-200 rounded-lg">
              No rows yet. Click "Add Row" to start.
            </div>
          ) : (
            <div className="space-y-4">
              {localData.rows.map((row, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">Row {index + 1}</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRow(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`row-label-${index}`} className="text-sm">
                        Label/Description
                      </Label>
                      <Textarea
                        id={`row-label-${index}`}
                        value={row.label}
                        onChange={(e) => updateRow(index, 'label', e.target.value)}
                        placeholder="Enter row description..."
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`row-questionId-${index}`} className="text-sm">
                        Question ID
                      </Label>
                      <Input
                        id={`row-questionId-${index}`}
                        value={row.questionId}
                        onChange={(e) => updateRow(index, 'questionId', e.target.value)}
                        placeholder="e.g., l4q25"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`row-answer-${index}`} className="text-sm">
                        Correct Answer
                      </Label>
                      <Select
                        value={row.correctAnswer}
                        onValueChange={(value) => updateRow(index, 'correctAnswer', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select answer" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(localData.options).map(key => (
                            <SelectItem key={key} value={key}>
                              {key}: {localData.options[key].substring(0, 30)}{localData.options[key].length > 30 ? '...' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}