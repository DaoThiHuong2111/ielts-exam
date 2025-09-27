'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Hash, Eye, EyeOff } from 'lucide-react'

interface TableCompletionData {
  headers: string[]
  rows: Array<{
    cells: string[]
    answers: Record<string, string> // question number -> correct answer
  }>
}

interface TableCompletionEditorProps {
  tableData: TableCompletionData
  onUpdate: (data: TableCompletionData) => void
}

export function TableCompletionEditor({
  tableData,
  onUpdate
}: TableCompletionEditorProps) {
  const [localData, setLocalData] = useState<TableCompletionData>(tableData)
  
  // Sync with parent when props change
  useEffect(() => {
    setLocalData(tableData)
  }, [tableData])

  const updateData = (newData: TableCompletionData) => {
    setLocalData(newData)
    onUpdate(newData)
  }

  // Header management
  const addHeader = () => {
    const newHeaders = [...localData.headers, `Header ${localData.headers.length + 1}`]
    const newRows = localData.rows.map(row => ({
      ...row,
      cells: [...row.cells, '']
    }))
    updateData({ headers: newHeaders, rows: newRows })
  }

  const updateHeader = (index: number, value: string) => {
    const newHeaders = [...localData.headers]
    newHeaders[index] = value
    updateData({ ...localData, headers: newHeaders })
  }

  const deleteHeader = (index: number) => {
    if (localData.headers.length <= 1) {
      alert('Table phải có ít nhất 1 header!')
      return
    }
    
    const newHeaders = localData.headers.filter((_, i) => i !== index)
    const newRows = localData.rows.map(row => ({
      ...row,
      cells: row.cells.filter((_, i) => i !== index)
    }))
    updateData({ headers: newHeaders, rows: newRows })
  }

  // Row management
  const addRow = () => {
    const newRow = {
      cells: Array(localData.headers.length).fill(''),
      answers: {}
    }
    const newRows = [...localData.rows, newRow]
    updateData({ ...localData, rows: newRows })
  }

  const deleteRow = (index: number) => {
    const newRows = localData.rows.filter((_, i) => i !== index)
    updateData({ ...localData, rows: newRows })
  }

  // Cell management
  const updateCell = (rowIndex: number, cellIndex: number, value: string) => {
    const newRows = [...localData.rows]
    const newCells = [...newRows[rowIndex].cells]
    newCells[cellIndex] = value
    newRows[rowIndex] = { ...newRows[rowIndex], cells: newCells }
    updateData({ ...localData, rows: newRows })
  }

  // Answer management
  const toggleAnswerField = (rowIndex: number, cellIndex: number) => {
    const newRows = [...localData.rows]
    const currentAnswers = { ...newRows[rowIndex].answers }
    
    // Find if this cell is already an answer field
    const existingQuestionNum = Object.entries(currentAnswers).find(([_, answer]) => 
      answer === newRows[rowIndex].cells[cellIndex]
    )?.[0]
    
    if (existingQuestionNum) {
      // Remove answer field
      delete currentAnswers[existingQuestionNum]
    } else {
      // Add answer field
      const nextQuestionNum = Math.max(0, ...Object.keys(currentAnswers).map(k => parseInt(k) || 0)) + 1
      currentAnswers[nextQuestionNum.toString()] = newRows[rowIndex].cells[cellIndex] || ''
    }
    
    newRows[rowIndex] = { ...newRows[rowIndex], answers: currentAnswers }
    updateData({ ...localData, rows: newRows })
  }

  const updateAnswer = (rowIndex: number, questionNum: string, value: string) => {
    const newRows = [...localData.rows]
    const newAnswers = { ...newRows[rowIndex].answers }
    newAnswers[questionNum] = value
    newRows[rowIndex] = { ...newRows[rowIndex], answers: newAnswers }
    updateData({ ...localData, rows: newRows })
  }

  const deleteAnswer = (rowIndex: number, questionNum: string) => {
    const newRows = [...localData.rows]
    const newAnswers = { ...newRows[rowIndex].answers }
    delete newAnswers[questionNum]
    newRows[rowIndex] = { ...newRows[rowIndex], answers: newAnswers }
    updateData({ ...localData, rows: newRows })
  }

  // Check if cell is an answer field
  const getCellAnswerInfo = (rowIndex: number, cellIndex: number) => {
    const row = localData.rows[rowIndex]
    if (!row) return null
    
    const entry = Object.entries(row.answers).find(([_, answer]) => 
      answer === row.cells[cellIndex]
    )
    
    return entry ? { questionNum: entry[0], answer: entry[1] } : null
  }

  const getTotalAnswerCount = () => {
    const allAnswers = localData.rows.flatMap(row => Object.keys(row.answers))
    return Math.max(0, ...allAnswers.map(k => parseInt(k) || 0))
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
                  placeholder={`Header ${index + 1}`}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteHeader(index)}
                  disabled={localData.headers.length <= 1}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Table Rows */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Table Data 
              <Badge variant="secondary" className="ml-2">
                {getTotalAnswerCount()} questions
              </Badge>
            </CardTitle>
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
            <div className="space-y-6">
              {/* Table Preview */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        {localData.headers.map((header, index) => (
                          <th key={index} className="px-4 py-3 text-left font-medium border-r border-gray-200 last:border-r-0">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {localData.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-t border-gray-200">
                          {row.cells.map((cell, cellIndex) => {
                            const answerInfo = getCellAnswerInfo(rowIndex, cellIndex)
                            return (
                              <td key={cellIndex} className="px-4 py-3 border-r border-gray-200 last:border-r-0 relative">
                                {answerInfo ? (
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="destructive" className="text-xs">
                                      Q{answerInfo.questionNum}
                                    </Badge>
                                    <span className="italic text-gray-600">
                                      [{cell || 'blank'}]
                                    </span>
                                  </div>
                                ) : (
                                  <span>{cell}</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Row Editors */}
              <div className="space-y-4">
                {localData.rows.map((row, rowIndex) => (
                  <Card key={rowIndex} className="bg-gray-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Row {rowIndex + 1}</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteRow(rowIndex)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Cell editors */}
                      <div className="grid grid-cols-1 gap-4">
                        {row.cells.map((cell, cellIndex) => {
                          const answerInfo = getCellAnswerInfo(rowIndex, cellIndex)
                          return (
                            <div key={cellIndex} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">
                                  {localData.headers[cellIndex] || `Column ${cellIndex + 1}`}
                                </Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleAnswerField(rowIndex, cellIndex)}
                                  className={answerInfo ? "bg-red-50 text-red-700" : ""}
                                >
                                  {answerInfo ? (
                                    <>
                                      <EyeOff className="h-3 w-3 mr-1" />
                                      Q{answerInfo.questionNum}
                                    </>
                                  ) : (
                                    <>
                                      <Hash className="h-3 w-3 mr-1" />
                                      Make Answer
                                    </>
                                  )}
                                </Button>
                              </div>
                              <Input
                                value={cell}
                                onChange={(e) => updateCell(rowIndex, cellIndex, e.target.value)}
                                placeholder="Enter cell content..."
                                className={answerInfo ? "border-red-300 bg-red-50" : ""}
                              />
                              {answerInfo && (
                                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                  This cell is Question {answerInfo.questionNum}. 
                                  Answer: "{answerInfo.answer}"
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Answer management for this row */}
                      {Object.keys(row.answers).length > 0 && (
                        <div className="border-t pt-3">
                          <Label className="text-sm font-medium mb-2 block">
                            Answer Fields in this Row:
                          </Label>
                          <div className="space-y-2">
                            {Object.entries(row.answers).map(([questionNum, answer]) => (
                              <div key={questionNum} className="flex items-center space-x-2 bg-white p-2 rounded border">
                                <Badge variant="destructive">Q{questionNum}</Badge>
                                <Input
                                  value={answer}
                                  onChange={(e) => updateAnswer(rowIndex, questionNum, e.target.value)}
                                  placeholder="Correct answer..."
                                  className="flex-1"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteAnswer(rowIndex, questionNum)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}