export const USER_ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export const UserRole = {
  ...USER_ROLES,
} as const;

export type UserRoleType = keyof typeof USER_ROLES;

export const DEFAULT_USER_ROLE = USER_ROLES.USER;

export const PROTECTED_PATHS = [
  '/profile',
  '/quiz',
  '/admin',
] as const;

export const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/refresh',
  '/api/auth/logout',
] as const;