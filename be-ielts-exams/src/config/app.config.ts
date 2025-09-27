/**
 * Backend Application Configuration
 *
 * Centralized configuration management sử dụng environment variables
 * Thay thế tất cả hardcode values để dễ deploy và maintain
 */

import { config } from 'dotenv';

// Load environment variables từ .env file
config();

// Environment detection để điều chỉnh behavior theo môi trường
const isProduction = process.env.NODE_ENV === 'production';

export const appConfig = {
  // =======================================================================
  // SERVER CONFIGURATION
  // =======================================================================

  // Port server sẽ listen (string -> number conversion)
  port: parseInt(process.env.PORT || '8228'),

  // Môi trường chạy (development/staging/production)
  nodeEnv: process.env.NODE_ENV || 'development',

  // =======================================================================
  // FRONTEND INTEGRATION CONFIGURATION
  // =======================================================================

  // Frontend URL cho CORS và redirect
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // =======================================================================
  // DATABASE CONFIGURATION
  // =======================================================================

  // Database connection string
  databaseUrl: process.env.DATABASE_URL || '',

  // Database port riêng biệt nếu cần
  databasePort: parseInt(process.env.DATABASE_PORT || '3306'),

  // JWT configuration
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'your-secret-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
    passwordResetSecret: process.env.JWT_PASSWORD_RESET_SECRET || 'your-password-reset-secret-change-in-production',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    passwordResetExpiresIn: process.env.JWT_PASSWORD_RESET_EXPIRES_IN || '1h',
  },

  // Security configuration
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env[isProduction ? 'RATE_LIMIT_MAX_REQUESTS' : 'RATE_LIMIT_MAX_REQUESTS_DEV'] || (isProduction ? '100' : '1000')),
    authWindowMs: parseInt(process.env.RATE_LIMIT_AUTH_HOURS || '1') * 60 * 60 * 1000, // 1 hour
  },

  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
    allowedTypes: ['application/json'],
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : [process.env.FRONTEND_URL || 'http://localhost:3000'],
    credentials: true,
  },

  // CSRF configuration
  csrf: {
    cookieMaxAge: parseInt(process.env.CSRF_COOKIE_MAX_AGE || '86400000'), // 24 hours
  },

  // HSTS configuration
  hsts: {
    maxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000'), // 1 year
  },

  // Time constants (in milliseconds)
  time: {
    tokenExpiryDays: parseInt(process.env.TOKEN_EXPIRY_DAYS || '30') * 24 * 60 * 60 * 1000,
    passwordResetHours: parseInt(process.env.PASSWORD_RESET_HOURS || '1') * 60 * 60 * 1000,
    csrfTokenHours: parseInt(process.env.CSRF_TOKEN_HOURS || '24') * 60 * 60 * 1000,
  },
} as const;

export default appConfig;