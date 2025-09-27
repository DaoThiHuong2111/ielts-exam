'use client'

import { useEffect } from 'react'
import { TextSelectionProvider } from '@/contexts/text-selection-context'

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Hide header and footer when entering a quiz page
    document.body.classList.add('quiz-mode')
    
    return () => {
      // Show them again when leaving the page
      document.body.classList.remove('quiz-mode')
    }
  }, [])

  return (
    <TextSelectionProvider>
      {children}
    </TextSelectionProvider>
  )
}
