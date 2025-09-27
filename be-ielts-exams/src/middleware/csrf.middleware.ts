import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import * as crypto from "crypto";
import { appConfig } from "src/config/app.config";

// Extend Express Request type to include csrfToken
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      csrfToken?: () => string;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly csrfTokenLength = 32;
  private readonly cookieName = "XSRF-TOKEN";
  private readonly headerName = "X-XSRF-TOKEN";
  private readonly excludedMethods = ["GET", "HEAD", "OPTIONS"];
  private readonly excludedPaths = ["/api/auth/login", "/api/auth/register"];

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF protection for safe methods and excluded paths
    if (this.excludedMethods.includes(req.method) || this.excludedPaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    // Get CSRF token from cookie
    const csrfTokenFromCookie = req.cookies[this.cookieName];

    // If no CSRF token in cookie, generate a new one
    if (!csrfTokenFromCookie) {
      const newToken = this.generateCsrfToken();
      this.setCsrfCookie(res, newToken);
      req.csrfToken = () => newToken;
      return next();
    }

    // For state-changing requests, validate CSRF token
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      const csrfTokenFromHeader = req.headers[this.headerName] as string;

      if (!csrfTokenFromHeader) {
        return res.status(403).json({
          statusCode: 403,
          message: "CSRF token missing",
          error: "Forbidden"
        });
      }

      if (!this.validateCsrfToken(csrfTokenFromCookie, csrfTokenFromHeader)) {
        return res.status(403).json({
          statusCode: 403,
          message: "Invalid CSRF token",
          error: "Forbidden"
        });
      }
    }

    // Attach CSRF token to request for use in controllers
    req.csrfToken = () => csrfTokenFromCookie;
    next();
  }

  /**
   * Generate a new CSRF token
   */
  private generateCsrfToken(): string {
    return crypto.randomBytes(this.csrfTokenLength).toString("hex");
  }

  /**
   * Validate CSRF token
   */
  private validateCsrfToken(tokenFromCookie: string, tokenFromHeader: string): boolean {
    // Use constant-time comparison to prevent timing attacks
    try {
      const buffer1 = Buffer.from(tokenFromCookie, "hex");
      const buffer2 = Buffer.from(tokenFromHeader, "hex");

      if (buffer1.length !== buffer2.length) {
        return false;
      }

      // Simple constant-time comparison
      let result = 0;
      for (let i = 0; i < buffer1.length; i++) {
        result |= buffer1[i] ^ buffer2[i];
      }

      return result === 0;
    } catch {
      return false;
    }
  }

  /**
   * Set CSRF token in cookie
   */
  private setCsrfCookie(res: Response, token: string): void {
    res.cookie(this.cookieName, token, {
      httpOnly: false, // Allow JavaScript to read the cookie
      secure: process.env.NODE_ENV === "production", // Send only over HTTPS in production
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // Prevent CSRF, more flexible in development
      maxAge: appConfig.csrf.cookieMaxAge, // Use configurable value
      path: "/"
    });
  }
}

/**
 * Factory function to create CSRF middleware with custom options
 */
export function createCsrfMiddleware(options?: { cookieName?: string; headerName?: string; excludedPaths?: string[] }) {
  const middleware = new CsrfMiddleware();

  if (options?.cookieName) {
    (middleware as any).cookieName = options.cookieName;
  }

  if (options?.headerName) {
    (middleware as any).headerName = options.headerName;
  }

  if (options?.excludedPaths) {
    (middleware as any).excludedPaths = options.excludedPaths;
  }

  return middleware;
}
