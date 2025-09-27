import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { appConfig } from "src/config/app.config";

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests in the window
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (req: Request) => string; // Custom key generator
  handler?: (req: Request, res: Response) => void; // Custom handler when limit is exceeded
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private store = new Map<string, RateLimitRecord>();
  private readonly defaultOptions: Required<RateLimitOptions> = {
    windowMs: appConfig.rateLimit.windowMs, // Use configurable value
    max: appConfig.rateLimit.maxRequests, // Use configurable value
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req: Request) => {
      // Use IP address as the default key
      return req.ip || req.connection.remoteAddress || "unknown";
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        statusCode: 429,
        message: "Too many requests, please try again later.",
        error: "Too Many Requests"
      });
    }
  };

  constructor(private options: RateLimitOptions) {}

  use(req: Request, res: Response, next: NextFunction) {
    const finalOptions = { ...this.defaultOptions, ...this.options };
    const key = finalOptions.keyGenerator(req);

    // Get or create rate limit record
    let record = this.store.get(key);
    const now = Date.now();

    if (!record || now > record.resetTime) {
      // Create new record if it doesn't exist or has expired
      record = {
        count: 0,
        resetTime: now + finalOptions.windowMs
      };
      this.store.set(key, record);
    }

    // Check if limit is exceeded
    if (record.count >= finalOptions.max) {
      return finalOptions.handler(req, res);
    }

    // Increment count
    record.count++;

    // Add rate limit headers
    res.setHeader("X-RateLimit-Limit", finalOptions.max.toString());
    res.setHeader("X-RateLimit-Remaining", Math.max(0, finalOptions.max - record.count).toString());
    res.setHeader("X-RateLimit-Reset", new Date(record.resetTime).toISOString());

    // Skip counting based on response status
    const originalEnd = res.end;
    res.end = function (chunk?: any, encoding?: any) {
      // Call original end method
      const result = originalEnd.call(this, chunk, encoding);

      const statusCode = res.statusCode;

      // Decrement count if we should skip this request
      if (
        (finalOptions.skipSuccessfulRequests && statusCode >= 200 && statusCode < 300) ||
        (finalOptions.skipFailedRequests && statusCode >= 400)
      ) {
        record!.count--;
      }

      return result;
    };

    next();
  }
}

/**
 * Factory function to create rate limiting middleware for authentication endpoints
 */
export function createAuthRateLimitMiddleware() {
  return new RateLimitMiddleware({
    windowMs: appConfig.rateLimit.windowMs, // Use configurable value
    max: 5, // 5 attempts per window for auth endpoints
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req: Request) => {
      // Use IP address and endpoint path for more granular rate limiting
      const ip = req.ip || req.connection.remoteAddress || "unknown";
      const path = req.path;
      return `${ip}:${path}`;
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        statusCode: 429,
        message: "Too many authentication attempts. Please try again later.",
        error: "Too Many Requests",
        retryAfter: Math.ceil(15 * 60) // 15 minutes in seconds
      });
    }
  });
}

/**
 * Factory function to create rate limiting middleware for password reset endpoints
 */
export function createPasswordResetRateLimitMiddleware() {
  return new RateLimitMiddleware({
    windowMs: appConfig.rateLimit.authWindowMs, // Use configurable value
    max: 3, // 3 attempts per hour for password reset
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req: Request) => {
      // Use email address for password reset rate limiting
      const email = req.body?.email || req.ip || "unknown";
      return `password-reset:${email}`;
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        statusCode: 429,
        message: "Too many password reset attempts. Please try again later.",
        error: "Too Many Requests",
        retryAfter: Math.ceil(60 * 60) // 1 hour in seconds
      });
    }
  });
}

/**
 * Factory function to create general API rate limiting middleware
 */
export function createGeneralApiRateLimitMiddleware() {
  return new RateLimitMiddleware({
    windowMs: appConfig.rateLimit.windowMs, // Use configurable value
    max: appConfig.rateLimit.maxRequests, // Use configurable value
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req: Request) => {
      // Use IP address for general rate limiting
      return req.ip || req.connection.remoteAddress || "unknown";
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        statusCode: 429,
        message: "Too many requests. Please try again later.",
        error: "Too Many Requests",
        retryAfter: Math.ceil(15 * 60) // 15 minutes in seconds
      });
    }
  });
}
