import { Question, DragOption } from '@/types/multi-part-quiz'

export interface DragDropGroup {
  groupId: string
  startIndex: number
  endIndex: number
  questionIds: string[]
  sharedOptions: DragOption[]
}

/**
 * Phân tích các câu hỏi và tìm ra các nhóm DRAG_AND_DROP liền kề
 */
export function analyzeDragDropGroups(questions: Question[]): DragDropGroup[] {
  const groups: DragDropGroup[] = []
  let currentGroup: DragDropGroup | null = null
  
  questions.forEach((question, index) => {
    if (question.type === 'DRAG_AND_DROP') {
      if (!currentGroup) {
        // Bắt đầu nhóm mới
        currentGroup = {
          groupId: `group_${groups.length + 1}`,
          startIndex: index,
          endIndex: index,
          questionIds: [question.id],
          sharedOptions: []
        }
      } else {
        // Mở rộng nhóm hiện tại
        currentGroup.endIndex = index
        currentGroup.questionIds.push(question.id)
      }
    } else {
      // Kết thúc nhóm hiện tại (nếu có)
      if (currentGroup) {
        groups.push(currentGroup)
        currentGroup = null
      }
    }
  })
  
  // Thêm nhóm cuối cùng nếu có
  if (currentGroup) {
    groups.push(currentGroup)
  }
  
  return groups
}

/**
 * Tìm group ID cho một câu hỏi cụ thể
 */
export function getGroupIdForQuestion(questions: Question[], questionIndex: number): string | null {
  const groups = analyzeDragDropGroups(questions)
  
  for (const group of groups) {
    if (questionIndex >= group.startIndex && questionIndex <= group.endIndex) {
      return group.groupId
    }
  }
  
  return null
}

/**
 * Kiểm tra xem câu hỏi có thuộc về một nhóm DRAG_AND_DROP không
 */
export function isInDragDropGroup(questions: Question[], questionIndex: number): boolean {
  return getGroupIdForQuestion(questions, questionIndex) !== null
}

/**
 * Lấy thông tin nhóm cho một câu hỏi
 */
export function getGroupForQuestion(questions: Question[], questionIndex: number): DragDropGroup | null {
  const groups = analyzeDragDropGroups(questions)
  const groupId = getGroupIdForQuestion(questions, questionIndex)
  
  if (!groupId) return null
  
  return groups.find(g => g.groupId === groupId) || null
}

/**
 * Cập nhật shared options cho một nhóm
 */
export function updateGroupSharedOptions(
  currentGroups: Record<string, DragOption[]>,
  groupId: string,
  newOptions: DragOption[]
): Record<string, DragOption[]> {
  return {
    ...currentGroups,
    [groupId]: newOptions
  }
}

/**
 * Lấy shared options cho một nhóm
 */
export function getGroupSharedOptions(
  groups: Record<string, DragOption[]>,
  groupId: string
): DragOption[] {
  return groups[groupId] || []
}