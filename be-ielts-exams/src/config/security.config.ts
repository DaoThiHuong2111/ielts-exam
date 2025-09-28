import { appConfig } from './app.config';

/**
 * Security configuration for the application
 */
export class SecurityConfig {
  /**
   * Get secure cookie options based on environment
   */
  static getCookieOptions() {
    const isProduction = process.env.NODE_ENV === "production";

    return {
      httpOnly: true, // Prevent JavaScript access to cookies
      secure: isProduction, // Send only over HTTPS in production
      sameSite: isProduction ? "strict" as const : "lax" as const, // Prevent CSRF, more flexible in development
      maxAge: appConfig.csrf.cookieMaxAge, // Use configurable value
      path: "/",
      domain: process.env.COOKIE_DOMAIN || undefined // Restrict to specific domain in production
    };
  }

  /**
   * Get rate limiting options
   */
  static getRateLimitOptions() {
    const isProduction = process.env.NODE_ENV === "production";

    return {
      auth: {
        windowMs: appConfig.rateLimit.windowMs,
        max: isProduction ? 5 : 100 // 5 attempts in production, 100 in development
      },
      passwordReset: {
        windowMs: appConfig.rateLimit.authWindowMs,
        max: isProduction ? 3 : 100 // 3 attempts in production, 100 in development
      },
      general: {
        windowMs: appConfig.rateLimit.windowMs,
        max: appConfig.rateLimit.maxRequests
      }
    };
  }

  /**
   * Get CORS options
   */
  static getCorsOptions() {
    const isProduction = process.env.NODE_ENV === "production";

    // Với credentials: true, không thể dùng origin: '*'
    // Cần chỉ định rõ ràng origin cho cả dev và prod
    const allowedOrigins = Array.isArray(appConfig.cors.origin)
      ? appConfig.cors.origin
      : [appConfig.cors.origin];

    return {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        // In development, log rejected origins for debugging
        if (!isProduction) {
          console.warn(`CORS rejected origin: ${origin}`);
        }

        return callback(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true, // An toàn với origins cụ thể
      optionsSuccessStatus: 204,
      allowedHeaders: ["Content-Type", "Authorization", "X-XSRF-TOKEN", "Cookie"]
    };
  }

  /**
   * Get helmet security headers configuration
   */
  static getHelmetConfig() {
    const allowedOrigins = Array.isArray(appConfig.cors.origin)
      ? appConfig.cors.origin
      : [appConfig.cors.origin];

    return {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", ...allowedOrigins],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      hsts:
        process.env.NODE_ENV === "production"
          ? {
              maxAge: appConfig.hsts.maxAge,
              includeSubDomains: true,
              preload: true
            }
          : false,
      // noSniff, xssFilter, ieNoOpen đã được bật mặc định trong helmet v8
      frameguard: {
        action: "deny" as const
      },
      hidePoweredBy: true
    };
  }

  /**
   * Validate environment variables for security
   */
  static validateEnvironment() {
    // RSA keys validation is handled in configuration.ts
    // No JWT secrets needed anymore since we use RSA keys

    if (process.env.NODE_ENV === "production") {
      if (!process.env.FRONTEND_URL) {
        console.warn("FRONTEND_URL environment variable is not set in production");
      }

      if (!process.env.COOKIE_DOMAIN) {
        console.warn("COOKIE_DOMAIN environment variable is not set in production");
      }
    }
  }
}
