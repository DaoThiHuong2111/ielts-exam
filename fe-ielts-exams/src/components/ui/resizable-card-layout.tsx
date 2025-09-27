'use client'

import React, { useState, useRef, useCallback, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ResizableCardLayoutProps {
  children: [ReactNode, ReactNode, ReactNode] // Exactly 3 cards
  className?: string
  defaultWidths?: [number, number, number] // Percentages that sum to 100
  minWidth?: number // Minimum width percentage for each card
}

export function ResizableCardLayout({
  children,
  className,
  defaultWidths = [33.33, 33.33, 33.33],
  minWidth = 20
}: ResizableCardLayoutProps) {
  const [widths, setWidths] = useState(defaultWidths)
  const [isDragging, setIsDragging] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const startPosRef = useRef<number>(0)
  const startWidthsRef = useRef<[number, number, number]>([0, 0, 0])

  const handleMouseDown = useCallback((separatorIndex: number, e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(separatorIndex)
    startPosRef.current = e.clientX
    startWidthsRef.current = [...widths] as [number, number, number]
    
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [widths])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging === null || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const containerWidth = containerRect.width
    const deltaX = e.clientX - startPosRef.current
    const deltaPercentage = (deltaX / containerWidth) * 100

    const newWidths = [...startWidthsRef.current] as [number, number, number]

    if (isDragging === 0) {
      // Dragging separator between card 1 and 2
      const newFirstWidth = Math.max(minWidth, Math.min(100 - minWidth * 2, newWidths[0] + deltaPercentage))
      const newSecondWidth = Math.max(minWidth, Math.min(100 - minWidth * 2, newWidths[1] - deltaPercentage))
      
      newWidths[0] = newFirstWidth
      newWidths[1] = newSecondWidth
    } else if (isDragging === 1) {
      // Dragging separator between card 2 and 3
      const newSecondWidth = Math.max(minWidth, Math.min(100 - minWidth * 2, newWidths[1] + deltaPercentage))
      const newThirdWidth = Math.max(minWidth, Math.min(100 - minWidth * 2, newWidths[2] - deltaPercentage))
      
      newWidths[1] = newSecondWidth
      newWidths[2] = newThirdWidth
    }

    setWidths(newWidths)
  }, [isDragging, minWidth])

  const handleMouseUp = useCallback(() => {
    setIsDragging(null)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  // Add event listeners
  React.useEffect(() => {
    if (isDragging !== null) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div 
      ref={containerRef}
      className={cn('flex h-full relative', className)}
    >
      {/* Card 1 */}
      <div 
        style={{ 
          width: `${widths[0]}%`,
          minWidth: `${minWidth}%`
        }}
        className="flex-shrink-0 pr-3 overflow-hidden"
      >
        <div className="w-full h-full">
          {children[0]}
        </div>
      </div>

      {/* Separator 1 */}
      <div className="relative flex-shrink-0 w-0">
        <div
          className={cn(
            "absolute inset-y-0 -left-3 -right-3 cursor-col-resize hover:bg-blue-200/50 transition-colors z-10",
            isDragging === 0 && "bg-blue-300/70"
          )}
          onMouseDown={(e) => handleMouseDown(0, e)}
        />
      </div>

      {/* Card 2 */}
      <div 
        style={{ 
          width: `${widths[1]}%`,
          minWidth: `${minWidth}%`
        }}
        className="flex-shrink-0 px-3 overflow-hidden"
      >
        <div className="w-full h-full">
          {children[1]}
        </div>
      </div>

      {/* Separator 2 */}
      <div className="relative flex-shrink-0 w-0">
        <div
          className={cn(
            "absolute inset-y-0 -left-3 -right-3 cursor-col-resize hover:bg-blue-200/50 transition-colors z-10",
            isDragging === 1 && "bg-blue-300/70"
          )}
          onMouseDown={(e) => handleMouseDown(1, e)}
        />
      </div>

      {/* Card 3 */}
      <div 
        style={{ 
          width: `${widths[2]}%`,
          minWidth: `${minWidth}%`
        }}
        className="flex-shrink-0 pl-3 overflow-hidden"
      >
        <div className="w-full h-full">
          {children[2]}
        </div>
      </div>
    </div>
  )
}