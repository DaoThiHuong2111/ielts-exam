'use client'

import { ReactNode } from 'react'
import { useTextSelectionHandler } from '@/hooks/useTextSelectionHandler'
import TextSelectionPopup from './text-selection-popup'
import HighlightManagementPopup from './highlight-management-popup'

interface QuizContentWithSelectionProps {
  children: ReactNode
  containerId: string
  className?: string
}

export default function QuizContentWithSelection({
  children,
  containerId,
  className = ''
}: QuizContentWithSelectionProps) {
  const {
    selectionState,
    highlightManagementState,
    handleHighlight,
    handleNote,
    closePopup,
    handleHighlightNote,
    handleHighlightDelete,
    handleHighlightDeleteAll,
    closeHighlightManagementPopup
  } = useTextSelectionHandler(containerId)

  return (
    <div
      id={containerId}
      className={`quiz-content-selectable ${className}`}
      style={{
        userSelect: 'text',
        WebkitUserSelect: 'text',
        MozUserSelect: 'text',
        msUserSelect: 'text'
      }}
    >
      {children}
      
      <TextSelectionPopup
        isVisible={selectionState.isVisible}
        position={selectionState.position}
        selectedText={selectionState.selectedText}
        onHighlight={handleHighlight}
        onNote={handleNote}
        onClose={closePopup}
      />
      
      <HighlightManagementPopup
        isVisible={highlightManagementState.isVisible}
        position={highlightManagementState.position}
        highlightId={highlightManagementState.highlightId}
        onNote={handleHighlightNote}
        onDelete={handleHighlightDelete}
        onDeleteAll={handleHighlightDeleteAll}
        onClose={closeHighlightManagementPopup}
      />
    </div>
  )
}