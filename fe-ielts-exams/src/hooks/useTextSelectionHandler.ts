'use client'

import { useTextSelection } from '@/contexts/text-selection-context'
import { useCallback, useEffect, useRef, useState } from 'react'

interface SelectionState {
  isVisible: boolean
  position: { x: number; y: number }
  selectedText: string
  range: Range | null
}

interface HighlightManagementState {
  isVisible: boolean
  position: { x: number; y: number }
  highlightId: string
}

export const useTextSelectionHandler = (containerId?: string) => {
  const { addHighlight, removeHighlight, clearAllHighlights } = useTextSelection()
  const [selectionState, setSelectionState] = useState<SelectionState>({
    isVisible: false,
    position: { x: 0, y: 0 },
    selectedText: '',
    range: null
  })
  
  const [highlightManagementState, setHighlightManagementState] = useState<HighlightManagementState>({
    isVisible: false,
    position: { x: 0, y: 0 },
    highlightId: ''
  })

  // Add ref to track if we're currently processing a selection to prevent race conditions
  const processingSelectionRef = useRef(false)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Only enable debug logging in development mode
  const debugMode = process.env.NODE_ENV === 'development'

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (debugMode) {
      console.log('🎯 Mouse up event triggered!', { processingSelectionRef: processingSelectionRef.current })
    }
    
    // Check if the event target is a form element that should not trigger text selection
    // But allow buttons inside text-selection-popup
    const target = event.target as Element
    if (target && target.nodeType === Node.ELEMENT_NODE) {
      const element = target as Element
      const isPopupButton = element.closest('.text-selection-popup, .highlight-management-popup')
      const isFormElement = element.matches('input, textarea, select, button') || 
                           element.closest('input, textarea, select, button')
      
      if (debugMode) {
        console.log('🎯 Event target check:', { 
          tagName: element.tagName, 
          isFormElement,
          isPopupButton
        })
      }
      
      if (isFormElement && !isPopupButton) {
        if (debugMode) console.log('❌ Ignoring text selection on form element')
        setSelectionState(prev => ({ ...prev, isVisible: false }))
        return
      }
    }
    
    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      if (debugMode) console.log('⏰ Cleared existing timeout')
    }
    
    // Prevent multiple simultaneous processing
    if (processingSelectionRef.current) {
      if (debugMode) console.log('⚠️ Already processing selection, skipping')
      return
    }
    
    // Debounce to handle rapid consecutive events (like double-clicks)
    debounceTimeoutRef.current = setTimeout(() => {
      if (debugMode) console.log('🏁 Starting selection processing after debounce')
      processingSelectionRef.current = true
      
      try {
        const selection = window.getSelection()
        
        if (!selection || selection.rangeCount === 0) {
          if (debugMode) console.log('❌ No selection or range')
          setSelectionState(prev => ({ ...prev, isVisible: false }))
          return
        }

        const range = selection.getRangeAt(0)
        const selectedText = selection.toString().trim()

        if (!selectedText) {
          if (debugMode) console.log('❌ No selected text content')
          setSelectionState(prev => ({ ...prev, isVisible: false }))
          return
        }

        // Check if selection is within the quiz content area
        if (containerId) {
          const container = document.getElementById(containerId)
          
          if (!container) {
            if (debugMode) console.log('❌ Container not found:', containerId)
            setSelectionState(prev => ({ ...prev, isVisible: false }))
            return
          }
          
          // Check if the selection is within the container
          const startContainer = range.startContainer
          const endContainer = range.endContainer
          const isWithinContainer = container.contains(startContainer) && container.contains(endContainer)
          
          if (debugMode) {
            console.log('🔍 Container check:', { 
              containerId, 
              isWithinContainer, 
              selectedText: selectedText.substring(0, 50) + (selectedText.length > 50 ? '...' : '')
            })
          }
          
          if (!isWithinContainer) {
            if (debugMode) console.log('❌ Selection outside container')
            setSelectionState(prev => ({ ...prev, isVisible: false }))
            return
          }
        }

        // Get mouse position for popup placement
        const rect = range.getBoundingClientRect()
        const position = {
          x: event.clientX || rect.left + (rect.width / 2),
          y: event.clientY || rect.top
        }
        
        if (debugMode) {
          console.log('🎯 Showing popup at:', position, 'with text:', selectedText.substring(0, 30) + (selectedText.length > 30 ? '...' : ''))
        }

        setSelectionState({
          isVisible: true,
          position,
          selectedText,
          range: range.cloneRange()
        })
      } catch (error) {
        console.error('Error in handleMouseUp:', error)
      } finally {
        processingSelectionRef.current = false
      }
    }, 100) // Increased debounce to 100ms for better handling of double-clicks
  }, [containerId, debugMode])

  const handleHighlightClick = useCallback((event: MouseEvent) => {
    const target = event.target as Element
    
    // Check if clicked element is a highlight or contains highlights
    const highlightElement = target.closest('.quiz-highlight') as HTMLElement
    if (!highlightElement) return
    
    // Prevent default text selection behavior
    event.preventDefault()
    event.stopPropagation()
    
    // Hide text selection popup if visible
    setSelectionState(prev => ({ ...prev, isVisible: false }))
    
    // Get highlight ID
    const highlightId = highlightElement.getAttribute('data-highlight-id') || ''
    
    // Position popup at click location
    const position = {
      x: event.clientX,
      y: event.clientY
    }
    
    if (debugMode) {
      console.log('🎯 Highlight clicked:', { highlightId, position })
    }
    
    setHighlightManagementState({
      isVisible: true,
      position,
      highlightId
    })
  }, [debugMode])

  const handleClickOutside = useCallback((event: MouseEvent) => {
    // Don't hide popup if clicking on the popup itself
    const target = event.target as Element
    if (target && (target.closest('.text-selection-popup') || target.closest('.highlight-management-popup'))) {
      return
    }
    
    // Check if clicking on a highlight to show management popup
    if (target && target.closest('.quiz-highlight')) {
      handleHighlightClick(event)
      return
    }
    
    // Only hide if there's no active selection
    const selection = window.getSelection()
    if (!selection || selection.toString().trim() === '') {
      setSelectionState(prev => ({ ...prev, isVisible: false }))
      setHighlightManagementState(prev => ({ ...prev, isVisible: false }))
    }
  }, [handleHighlightClick])

  const handleHighlight = useCallback(() => {
    if (!selectionState.range || !selectionState.selectedText) return

    try {
      // Create a unique ID for this highlight
      const highlightId = `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Create highlight span element
      const highlightSpan = document.createElement('span')
      highlightSpan.className = 'quiz-highlight'
      highlightSpan.setAttribute('data-highlight-id', highlightId)

      // Wrap the selected text with highlight span
      try {
        selectionState.range.surroundContents(highlightSpan)
      } catch (error) {
        // If surroundContents fails (usually due to range crossing element boundaries),
        // extract and replace the content
        if (debugMode) console.warn('surroundContents failed, using fallback method:', error)
        const contents = selectionState.range.extractContents()
        highlightSpan.appendChild(contents)
        selectionState.range.insertNode(highlightSpan)
      }

      // Store highlight information
      const highlight = {
        id: highlightId,
        text: selectionState.selectedText,
        startOffset: selectionState.range.startOffset,
        endOffset: selectionState.range.endOffset,
        containerPath: getElementPath(selectionState.range.startContainer)
      }

      addHighlight(highlight)

      // Clear selection and hide popup
      window.getSelection()?.removeAllRanges()
      setSelectionState(prev => ({ ...prev, isVisible: false }))
    } catch (error) {
      console.error('Error highlighting text:', error)
    }
  }, [selectionState, addHighlight, debugMode])

  const handleNote = useCallback(() => {
    // For now, just log the selected text (future implementation)
    if (debugMode) {
      console.log('Note feature - Selected text:', selectionState.selectedText)
    }
    
    // Clear selection and hide popup
    window.getSelection()?.removeAllRanges()
    setSelectionState(prev => ({ ...prev, isVisible: false }))
  }, [selectionState.selectedText, debugMode])

  const closePopup = useCallback(() => {
    setSelectionState(prev => ({ ...prev, isVisible: false }))
  }, [])
  
  const closeHighlightManagementPopup = useCallback(() => {
    setHighlightManagementState(prev => ({ ...prev, isVisible: false }))
  }, [])
  
  const handleHighlightNote = useCallback(() => {
    if (debugMode) {
      console.log('Note feature for highlight:', highlightManagementState.highlightId)
    }
    // Future implementation for note functionality
    closeHighlightManagementPopup()
  }, [highlightManagementState.highlightId, closeHighlightManagementPopup, debugMode])
  
  const handleHighlightDelete = useCallback(() => {
    const highlightId = highlightManagementState.highlightId
    if (!highlightId) return
    
    // Find and remove the highlight element from DOM
    const highlightElement = document.querySelector(`[data-highlight-id="${highlightId}"]`) as HTMLElement
    if (highlightElement) {
      const textContent = highlightElement.textContent || ''
      const parent = highlightElement.parentNode
      
      if (parent) {
        // Replace highlight span with plain text
        const textNode = document.createTextNode(textContent)
        parent.replaceChild(textNode, highlightElement)
        
        // Normalize the parent to merge adjacent text nodes
        parent.normalize()
      }
    }
    
    // Remove from context state
    removeHighlight(highlightId)
    closeHighlightManagementPopup()
    
    if (debugMode) {
      console.log('🗑️ Deleted highlight:', highlightId)
    }
  }, [highlightManagementState.highlightId, removeHighlight, closeHighlightManagementPopup, debugMode])
  
  const handleHighlightDeleteAll = useCallback(() => {
    // Find and remove all highlight elements from DOM
    const allHighlights = document.querySelectorAll('.quiz-highlight')
    allHighlights.forEach((highlightElement) => {
      const textContent = highlightElement.textContent || ''
      const parent = highlightElement.parentNode
      
      if (parent) {
        // Replace highlight span with plain text
        const textNode = document.createTextNode(textContent)
        parent.replaceChild(textNode, highlightElement)
      }
    })
    
    // Normalize all containers to merge adjacent text nodes
    if (containerId) {
      const container = document.getElementById(containerId)
      if (container) {
        container.normalize()
      }
    }
    
    // Clear all from context state
    clearAllHighlights()
    closeHighlightManagementPopup()
    
    if (debugMode) {
      console.log('🗑️ Deleted all highlights')
    }
  }, [containerId, clearAllHighlights, closeHighlightManagementPopup, debugMode])

  useEffect(() => {
    if (debugMode) {
      console.log('🔌 Setting up event listeners for containerId:', containerId)
    }
    
    // Add event listeners to document for global text selection
    document.addEventListener('mouseup', handleMouseUp, true) // Use capture phase
    document.addEventListener('click', handleClickOutside)
    
    // Also add to the specific container if it exists
    if (containerId) {
      const container = document.getElementById(containerId)
      if (container && debugMode) {
        console.log('🎯 Adding listeners to container:', container)
      }
      container?.addEventListener('mouseup', handleMouseUp, true)
    }

    return () => {
      if (debugMode) {
        console.log('🧹 Cleaning up event listeners')
      }
      
      // Clear debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      
      document.removeEventListener('mouseup', handleMouseUp, true)
      document.removeEventListener('click', handleClickOutside)
      
      if (containerId) {
        const container = document.getElementById(containerId)
        container?.removeEventListener('mouseup', handleMouseUp, true)
      }
    }
  }, [handleMouseUp, handleClickOutside, containerId, debugMode])

  return {
    selectionState,
    highlightManagementState,
    handleHighlight,
    handleNote,
    closePopup,
    handleHighlightNote,
    handleHighlightDelete,
    handleHighlightDeleteAll,
    closeHighlightManagementPopup
  }
}

// Helper function to get element path for storing highlight location
function getElementPath(element: Node): string {
  const path: string[] = []
  let current = element

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    const elem = current as Element
    let selector = elem.tagName.toLowerCase()
    
    if (elem.id) {
      selector += `#${elem.id}`
    } else if (elem.className) {
      selector += `.${elem.className.split(' ').join('.')}`
    }
    
    path.unshift(selector)
    const parentNode = elem.parentNode
    if (!parentNode) break
    current = parentNode
  }

  return path.join(' > ')
}