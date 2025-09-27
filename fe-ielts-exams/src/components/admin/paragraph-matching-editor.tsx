'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Check } from 'lucide-react'

interface ParagraphMatchingEditorProps {
  correctAnswer: string
  paragraphLabels: string[]
  onUpdate: (data: { correctAnswer: string; paragraphLabels: string[] }) => void
}

export function ParagraphMatchingEditor({
  correctAnswer,
  paragraphLabels,
  onUpdate
}: ParagraphMatchingEditorProps) {
  const [localCorrectAnswer, setLocalCorrectAnswer] = useState(correctAnswer)
  const [localParagraphLabels, setLocalParagraphLabels] = useState(paragraphLabels)

  // Sync with parent when props change
  useEffect(() => {
    setLocalCorrectAnswer(correctAnswer)
    setLocalParagraphLabels(paragraphLabels)
  }, [correctAnswer, paragraphLabels])

  const addParagraphLabel = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const usedLabels = new Set(localParagraphLabels)
    
    // Find next available letter
    const newLabel = letters.split('').find(letter => !usedLabels.has(letter)) || `${letters.length + 1}`
    
    const newLabels = [...localParagraphLabels, newLabel]
    setLocalParagraphLabels(newLabels)
    onUpdate({ correctAnswer: localCorrectAnswer, paragraphLabels: newLabels })
  }

  const updateLabel = (index: number, newLabel: string) => {
    const updatedLabels = [...localParagraphLabels]
    updatedLabels[index] = newLabel.toUpperCase()
    setLocalParagraphLabels(updatedLabels)
    
    // If the correct answer was the old label, update it to the new label
    if (localCorrectAnswer === localParagraphLabels[index]) {
      setLocalCorrectAnswer(newLabel.toUpperCase())
      onUpdate({ correctAnswer: newLabel.toUpperCase(), paragraphLabels: updatedLabels })
    } else {
      onUpdate({ correctAnswer: localCorrectAnswer, paragraphLabels: updatedLabels })
    }
  }

  const removeLabel = (index: number) => {
    const labelToRemove = localParagraphLabels[index]
    const updatedLabels = localParagraphLabels.filter((_, i) => i !== index)
    setLocalParagraphLabels(updatedLabels)
    
    // If the removed label was the correct answer, clear the correct answer
    const newCorrectAnswer = localCorrectAnswer === labelToRemove ? '' : localCorrectAnswer
    setLocalCorrectAnswer(newCorrectAnswer)
    onUpdate({ correctAnswer: newCorrectAnswer, paragraphLabels: updatedLabels })
  }

  const setCorrectAnswer = (label: string) => {
    setLocalCorrectAnswer(label)
    onUpdate({ correctAnswer: label, paragraphLabels: localParagraphLabels })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Paragraph Matching Labels</CardTitle>
          <Button variant="outline" size="sm" onClick={addParagraphLabel}>
            <Plus className="h-4 w-4 mr-1" />
            Thêm Label
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {localParagraphLabels.length === 0 ? (
          <div className="text-gray-500 italic text-center p-8 border-2 border-dashed border-gray-200 rounded-lg">
            Chưa có paragraph labels. Nhấn "Thêm Label" để bắt đầu.
          </div>
        ) : (
          <div className="space-y-3">
            {localParagraphLabels.map((label, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50">
                <button
                  type="button"
                  onClick={() => setCorrectAnswer(label)}
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors
                    ${localCorrectAnswer === label 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  {localCorrectAnswer === label && <Check className="h-4 w-4" />}
                </button>
                
                <div className="flex items-center space-x-2 flex-1">
                  <Label htmlFor={`label-${index}`} className="text-sm">
                    Paragraph
                  </Label>
                  <Input
                    id={`label-${index}`}
                    value={label}
                    onChange={(e) => updateLabel(index, e.target.value)}
                    placeholder="A"
                    maxLength={1}
                    className="w-16 text-center font-bold"
                  />
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeLabel(index)}
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
  )
}