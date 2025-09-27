import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

// Extend Express Request type to include originalBody
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      originalBody?: any;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

@Injectable()
export class SanitizationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Sanitize request body
    if (req.body) {
      req.body = this.sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
      req.query = this.sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params) {
      req.params = this.sanitizeObject(req.params);
    }

    next();
  }

  /**
   * Sanitize an object by removing potentially dangerous content
   */
  private sanitizeObject(obj: any): any {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    const sanitized: any = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const sanitizedKey = this.sanitizeString(key);
        const value = obj[key];

        if (typeof value === "string") {
          sanitized[sanitizedKey] = this.sanitizeString(value);
        } else if (typeof value === "object" && value !== null) {
          sanitized[sanitizedKey] = this.sanitizeObject(value);
        } else {
          sanitized[sanitizedKey] = value;
        }
      }
    }

    return sanitized;
  }

  /**
   * Sanitize a string by removing potentially dangerous content
   */
  private sanitizeString(str: string): string {
    if (typeof str !== "string") {
      return str;
    }

    // Remove potential XSS attacks
    const sanitized = str
      // Replace < and > with HTML entities
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // Replace quotes with HTML entities
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      // Replace backticks with HTML entities
      .replace(/`/g, "&#96;")
      // Remove potentially dangerous characters
      .replace(/javascript:/gi, "")
      .replace(/vbscript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      // Remove null bytes
      .replace(/\0/g, "");

    return sanitized;
  }
}

/**
 * Factory function to create sanitization middleware with custom options
 */
export function createSanitizationMiddleware(options?: { excludePaths?: string[]; excludeFields?: string[] }) {
  const middleware = new SanitizationMiddleware();

  if (options?.excludePaths || options?.excludeFields) {
    const originalUse = middleware.use;

    middleware.use = function (req: Request, res: Response, next: NextFunction) {
      // Skip sanitization for excluded paths
      if (options.excludePaths?.some((path) => req.path.startsWith(path))) {
        return next();
      }

      // Store original body before sanitization
      if (req.body) {
        req.originalBody = { ...req.body };
      }

      // Call original sanitization
      originalUse.call(this, req, res, next);

      // Restore excluded fields after sanitization
      if (options.excludeFields && req.body) {
        for (const field of options.excludeFields) {
          if (req.originalBody && req.originalBody[field] !== undefined) {
            req.body[field] = req.originalBody[field];
          }
        }
      }
    };
  }

  return middleware;
}
