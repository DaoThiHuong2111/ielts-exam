/**
 * Frontend Application Configuration
 *
 * Centralized configuration cho Next.js frontend
 * Quản lý environment variables và tích hợp với backend API
 *
 * Note: Variables với prefix NEXT_PUBLIC_ sẽ được expose ra browser
 * Variables không có prefix chỉ dùng được server-side (API routes)
 */

// Environment detection để điều chỉnh behavior
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

export const appConfig = {
  // =======================================================================
  // API INTEGRATION CONFIGURATION
  // =======================================================================
  api: {
    // Backend API URL (chỉ dùng trong Next.js API routes, không expose ra browser)
    baseUrl: process.env.BACKEND_API_URL || 'http://backend:8228',

    // Timeout cho API calls (milliseconds) - expose ra browser
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000'),
  },

  // =======================================================================
  // APPLICATION CONFIGURATION
  // =======================================================================
  app: {
    // Tên ứng dụng hiển thị trong UI - expose ra browser
    name: process.env.NEXT_PUBLIC_APP_NAME || 'IELTS Exams',

    // URL công khai của frontend - expose ra browser cho metadata, redirects
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

    // Environment mode - ưu tiên NEXT_PUBLIC_ nếu có, fallback về NODE_ENV
    nodeEnv: process.env.NEXT_PUBLIC_NODE_ENV || process.env.NODE_ENV || 'development',
  },

  // =======================================================================
  // TESTING CONFIGURATION
  // =======================================================================
  test: {
    // URL cho test environment - expose ra browser cho staging tests
    baseUrl: process.env.NEXT_PUBLIC_TEST_BASE_URL || 'http://localhost:3000',
  },

  // =======================================================================
  // PLAYWRIGHT E2E TESTING CONFIGURATION
  // =======================================================================
  playwright: {
    // Base URL cho Playwright tests (có thể khác với app.baseUrl)
    baseUrl: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Timeout cho Playwright operations (milliseconds)
    timeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || '30000'),
  },

  // =======================================================================
  // ENVIRONMENT FLAGS (computed)
  // =======================================================================

  // Flags để check environment trong code
  isDevelopment,
  isProduction,
} as const;

export default appConfig;