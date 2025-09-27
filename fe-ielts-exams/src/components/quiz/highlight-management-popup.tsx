'use client'

import { useEffect, useState } from 'react';

interface HighlightManagementPopupProps {
  isVisible: boolean
  position: { x: number; y: number }
  highlightId: string
  onNote: () => void
  onDelete: () => void
  onDeleteAll: () => void
  onClose: () => void
}

export default function HighlightManagementPopup({
  isVisible,
  position,
  highlightId: _highlightId, // Used by parent component, not directly in render
  onNote,
  onDelete,
  onDeleteAll,
  onClose
}: HighlightManagementPopupProps) {
  const [popupPosition, setPopupPosition] = useState(position)

  useEffect(() => {
    if (isVisible) {
      // Adjust popup position to stay within viewport
      const popupWidth = 140
      const popupHeight = 120
      const margin = 20 // Increased from 10 to give more distance from text

      let adjustedX = position.x
      let adjustedY = position.y - popupHeight - margin

      // Check if popup goes beyond right edge
      if (adjustedX + popupWidth > window.innerWidth) {
        adjustedX = window.innerWidth - popupWidth - margin
      }

      // Check if popup goes beyond left edge
      if (adjustedX < margin) {
        adjustedX = margin
      }

      // Check if popup goes beyond top edge
      if (adjustedY < margin) {
        adjustedY = position.y + margin
      }

      setPopupPosition({ x: adjustedX, y: adjustedY })
    }
  }, [position, isVisible])

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete()
  }

  const handleDeleteAll = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDeleteAll()
  }

  const handleNote = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onNote()
  }

  if (!isVisible) return null

  return (
    <>
      {/* Overlay to detect clicks outside */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div
        className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-2 highlight-management-popup"
        style={{
          left: `${popupPosition.x}px`,
          top: `${popupPosition.y}px`,
        }}
      >
        <div className="flex flex-col space-y-1">
          <button
            onClick={handleNote}
            className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors duration-150 flex items-center space-x-1"
          >
            <span>📝</span>
            <span>Note</span>
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded transition-colors duration-150 flex items-center space-x-1"
          >
            <span>🗑️</span>
            <span>Delete</span>
          </button>
          <button
            onClick={handleDeleteAll}
            className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-800 text-white rounded transition-colors duration-150 flex items-center space-x-1"
          >
            <span>🗑️</span>
            <span>Delete All</span>
          </button>
        </div>
      </div>
    </>
  )
}