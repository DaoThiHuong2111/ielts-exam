export const QUIZ_FILTERS = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1,
  DEFAULT_SORT_BY: 'createdAt',
  DEFAULT_SORT_ORDER: 'desc' as const,
} as const;

export const QUIZ_STATUS = {
  PUBLISHED: true,
  UNPUBLISHED: false,
  PUBLIC: true,
  PRIVATE: false,
} as const;

export const QUIZ_TYPES = {
  READING: 'READING',
  LISTENING: 'LISTENING',
} as const;

export const DIFFICULTY_LEVELS = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
} as const;