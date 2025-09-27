'use client'

import { useLayoutEffect } from 'react'

export default function ReadingTestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useLayoutEffect(() => {
    // Add quiz-mode class before paint to prevent flash
    document.body.classList.add('quiz-mode')
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('quiz-mode')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}