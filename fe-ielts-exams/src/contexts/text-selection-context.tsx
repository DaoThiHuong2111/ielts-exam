'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface HighlightedText {
  id: string
  text: string
  startOffset: number
  endOffset: number
  containerPath: string
}

interface TextSelectionContextType {
  highlightedTexts: HighlightedText[]
  addHighlight: (highlight: HighlightedText) => void
  removeHighlight: (id: string) => void
  clearAllHighlights: () => void
}

const TextSelectionContext = createContext<TextSelectionContextType | undefined>(undefined)

export const useTextSelection = () => {
  const context = useContext(TextSelectionContext)
  if (!context) {
    throw new Error('useTextSelection must be used within a TextSelectionProvider')
  }
  return context
}

interface TextSelectionProviderProps {
  children: ReactNode
}

export const TextSelectionProvider = ({ children }: TextSelectionProviderProps) => {
  const [highlightedTexts, setHighlightedTexts] = useState<HighlightedText[]>([])

  const addHighlight = (highlight: HighlightedText) => {
    setHighlightedTexts(prev => [...prev, highlight])
  }

  const removeHighlight = (id: string) => {
    setHighlightedTexts(prev => prev.filter(h => h.id !== id))
  }

  const clearAllHighlights = () => {
    setHighlightedTexts([])
  }

  const value = {
    highlightedTexts,
    addHighlight,
    removeHighlight,
    clearAllHighlights
  }

  return (
    <TextSelectionContext.Provider value={value}>
      {children}
    </TextSelectionContext.Provider>
  )
}