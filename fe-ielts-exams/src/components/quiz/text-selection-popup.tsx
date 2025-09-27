'use client'

import { useEffect, useState } from 'react';

interface TextSelectionPopupProps {
  isVisible: boolean
  position: { x: number; y: number }
  selectedText: string
  onHighlight: () => void
  onNote: () => void
  onClose: () => void
}

export default function TextSelectionPopup({
  isVisible,
  position,
  selectedText: _selectedText,
  onHighlight,
  onNote,
  onClose
}: TextSelectionPopupProps) {
  const [popupPosition, setPopupPosition] = useState(position)
  
  // Only log when visibility changes or in development mode
  const shouldLog = process.env.NODE_ENV === 'development'
  
  useEffect(() => {
    if (shouldLog && isVisible) {
      console.log('🌆 TextSelectionPopup render:', { isVisible, position, selectedText: _selectedText })
    }
  }, [isVisible, shouldLog, position, _selectedText])

  useEffect(() => {
    if (isVisible) {
      // Adjust popup position to stay within viewport
      const popupWidth = 120
      const popupHeight = 80
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

  // Early return without logging for better performance
  if (!isVisible) {
    return null
  }

  return (
    <>
      {/* Overlay to detect clicks outside */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div
        className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-2 text-selection-popup"
        style={{
          left: `${popupPosition.x}px`,
          top: `${popupPosition.y}px`,
        }}
      >
        <div className="flex flex-col space-y-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onHighlight();
            }}
            className="px-3 py-1.5 text-sm bg-yellow-400 hover:bg-yellow-500 text-gray-800 rounded transition-colors duration-150 flex items-center space-x-1"
          >
            <span>🖍️</span>
            <span>Highlight</span>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onNote();
            }}
            className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors duration-150 flex items-center space-x-1"
          >
            <span>📝</span>
            <span>Note</span>
          </button>
        </div>
      </div>
    </>
  )
}