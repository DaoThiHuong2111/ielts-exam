'use client'

import React, { memo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { QuizPart, Paragraph } from '@/types/multi-part-quiz'

interface PartEditorProps {
  part: QuizPart
  partIndex: number
  testType: string
  onUpdatePart: (partIndex: number, updates: Partial<QuizPart>) => void
  onDeletePart: (partIndex: number) => void
}

const PartEditor = memo(function PartEditor({ 
  part, 
  partIndex, 
  testType, 
  onUpdatePart, 
  onDeletePart 
}: PartEditorProps) {
  
  const updateContent = useCallback((updates: any) => {
    onUpdatePart(partIndex, {
      content: { ...part.content, ...updates }
    })
  }, [onUpdatePart, partIndex, part.content])

  const updateParagraph = (paragraphIndex: number, updates: Partial<Paragraph>) => {
    if (!part.content.paragraphs) return
    
    const updatedParagraphs = [...part.content.paragraphs]
    updatedParagraphs[paragraphIndex] = { ...updatedParagraphs[paragraphIndex], ...updates }
    updateContent({ paragraphs: updatedParagraphs })
  }

  const addParagraph = () => {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
    const currentParagraphs = part.content.paragraphs || []
    const newLabel = labels[currentParagraphs.length] || `P${currentParagraphs.length + 1}`
    
    const newParagraph: Paragraph = {
      label: newLabel,
      text: 'Đoạn văn mới...'
    }
    
    updateContent({ 
      paragraphs: [...currentParagraphs, newParagraph] 
    })
  }

  const deleteParagraph = (paragraphIndex: number) => {
    if (!part.content.paragraphs || part.content.paragraphs.length <= 1) return
    
    const updatedParagraphs = part.content.paragraphs.filter((_, index) => index !== paragraphIndex)
    updateContent({ paragraphs: updatedParagraphs })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Phần {part.partNumber}: {part.title}</CardTitle>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => onDeletePart(partIndex)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Xóa phần
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Part Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`part-title-${partIndex}`}>Tên phần</Label>
            <Input
              id={`part-title-${partIndex}`}
              value={part.title}
              onChange={(e) => onUpdatePart(partIndex, { title: e.target.value })}
              placeholder="Part 1"
            />
          </div>
          <div>
            <Label htmlFor={`part-number-${partIndex}`}>Số phần</Label>
            <Input
              id={`part-number-${partIndex}`}
              type="number"
              min="1"
              value={part.partNumber}
              onChange={(e) => onUpdatePart(partIndex, { partNumber: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>

        {/* Content Title & Subtitle */}
        <div className="space-y-2">
          <div>
            <Label htmlFor={`content-title-${partIndex}`}>Tiêu đề nội dung</Label>
            <Input
              id={`content-title-${partIndex}`}
              value={part.content.title}
              onChange={(e) => updateContent({ title: e.target.value })}
              placeholder="Reading Passage 1"
            />
          </div>
          <div>
            <Label htmlFor={`content-subtitle-${partIndex}`}>Phụ đề</Label>
            <Input
              id={`content-subtitle-${partIndex}`}
              value={part.content.subtitle || ''}
              onChange={(e) => updateContent({ subtitle: e.target.value })}
              placeholder="Mô tả ngắn về nội dung..."
            />
          </div>
        </div>

        {/* Audio URL for Listening */}
        {testType === 'listening' && (
          <div>
            <Label htmlFor={`audio-url-${partIndex}`}>URL Audio</Label>
            <Input
              id={`audio-url-${partIndex}`}
              value={part.content.audioUrl || ''}
              onChange={(e) => updateContent({ audioUrl: e.target.value })}
              placeholder="/audio/listening-section-1.mp3"
            />
          </div>
        )}

        {/* Instruction */}
        <div>
          <Label htmlFor={`instruction-${partIndex}`}>Hướng dẫn</Label>
          <Textarea
            id={`instruction-${partIndex}`}
            value={part.content.instruction || ''}
            onChange={(e) => updateContent({ instruction: e.target.value })}
            placeholder="Hướng dẫn làm bài..."
            rows={3}
          />
        </div>

        {/* Paragraphs for Reading */}
        {testType === 'reading' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Đoạn văn</Label>
              <Button variant="outline" size="sm" onClick={addParagraph}>
                <Plus className="h-4 w-4 mr-1" />
                Thêm đoạn
              </Button>
            </div>
            
            {part.content.paragraphs?.map((paragraph, paragraphIndex) => (
              <Card key={paragraphIndex} className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`paragraph-label-${partIndex}-${paragraphIndex}`}>
                        Nhãn đoạn
                      </Label>
                      <Input
                        id={`paragraph-label-${partIndex}-${paragraphIndex}`}
                        value={paragraph.label}
                        onChange={(e) => updateParagraph(paragraphIndex, { label: e.target.value })}
                        className="w-16"
                      />
                    </div>
                    {(part.content.paragraphs?.length || 0) > 1 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteParagraph(paragraphIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`paragraph-text-${partIndex}-${paragraphIndex}`}>
                      Nội dung
                    </Label>
                    <Textarea
                      id={`paragraph-text-${partIndex}-${paragraphIndex}`}
                      value={paragraph.text}
                      onChange={(e) => updateParagraph(paragraphIndex, { text: e.target.value })}
                      placeholder="Nội dung đoạn văn..."
                      rows={6}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
})

export { PartEditor }