import { Request, Response, NextFunction } from "express";
import {
  RateLimitMiddleware,
  createAuthRateLimitMiddleware,
  createPasswordResetRateLimitMiddleware,
  createGeneralApiRateLimitMiddleware
} from "../rate-limit.middleware";

describe("RateLimitMiddleware", () => {
  let middleware: RateLimitMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    middleware = new RateLimitMiddleware({
      windowMs: 60000, // 1 minute
      max: 5
    });

    mockRequest = {
      ip: "127.0.0.1",
      path: "/test"
    };

    mockResponse = {
      statusCode: 200,
      setHeader: jest.fn()
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should allow requests within the limit", () => {
    for (let i = 0; i < 5; i++) {
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    }

    expect(mockNext).toHaveBeenCalledTimes(5);
    expect(mockResponse.statusCode).toBe(200);
  });

  it("should block requests exceeding the limit", () => {
    // Make 6 requests (exceeding the limit of 5)
    for (let i = 0; i < 6; i++) {
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    }

    expect(mockNext).toHaveBeenCalledTimes(5); // Only first 5 should call next
    expect(mockResponse.statusCode).toBe(429); // Last one should be rate limited
  });

  it("should set rate limit headers", () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", "5");
    expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", "4");
    expect(mockResponse.setHeader).toHaveBeenCalledWith("X-RateLimit-Reset", expect.any(String));
  });

  it("should use custom key generator if provided", () => {
    const customKeyGenerator = jest.fn().mockReturnValue("custom-key");
    const customMiddleware = new RateLimitMiddleware({
      windowMs: 60000,
      max: 5,
      keyGenerator: customKeyGenerator
    });

    customMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(customKeyGenerator).toHaveBeenCalledWith(mockRequest);
  });

  it("should use custom handler if provided", () => {
    const customHandler = jest.fn();
    const customMiddleware = new RateLimitMiddleware({
      windowMs: 60000,
      max: 1,
      handler: customHandler
    });

    // Make 2 requests to exceed the limit
    customMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    customMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(customHandler).toHaveBeenCalledWith(mockRequest, mockResponse);
  });

  it("should skip successful requests if configured", () => {
    const middleware = new RateLimitMiddleware({
      windowMs: 60000,
      max: 2,
      skipSuccessfulRequests: true
    });

    // Make 3 requests, but set status code to 200 for all
    mockResponse.statusCode = 200;

    for (let i = 0; i < 3; i++) {
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    }

    expect(mockNext).toHaveBeenCalledTimes(3); // All should pass since they're successful
  });

  it("should skip failed requests if configured", () => {
    const middleware = new RateLimitMiddleware({
      windowMs: 60000,
      max: 2,
      skipFailedRequests: true
    });

    // Make 3 requests, but set status code to 400 for all
    mockResponse.statusCode = 400;

    for (let i = 0; i < 3; i++) {
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    }

    expect(mockNext).toHaveBeenCalledTimes(3); // All should pass since they're failed
  });

  describe("createAuthRateLimitMiddleware", () => {
    it("should create middleware with auth-specific settings", () => {
      const authMiddleware = createAuthRateLimitMiddleware();

      expect(authMiddleware).toBeInstanceOf(RateLimitMiddleware);
    });
  });

  describe("createPasswordResetRateLimitMiddleware", () => {
    it("should create middleware with password reset specific settings", () => {
      const passwordResetMiddleware = createPasswordResetRateLimitMiddleware();

      expect(passwordResetMiddleware).toBeInstanceOf(RateLimitMiddleware);
    });

    it("should use email as key for password reset rate limiting", () => {
      const passwordResetMiddleware = createPasswordResetRateLimitMiddleware();

      const requestWithEmail = {
        ip: "127.0.0.1",
        path: "/api/auth/forgot-password",
        body: { email: "test@example.com" }
      };

      const keyGenerator = (passwordResetMiddleware as any).options.keyGenerator;
      const key = keyGenerator(requestWithEmail);

      expect(key).toBe("password-reset:test@example.com");
    });
  });

  describe("createGeneralApiRateLimitMiddleware", () => {
    it("should create middleware with general API settings", () => {
      const generalMiddleware = createGeneralApiRateLimitMiddleware();

      expect(generalMiddleware).toBeInstanceOf(RateLimitMiddleware);
    });
  });

  it("should reset count after window expires", (done) => {
    const middleware = new RateLimitMiddleware({
      windowMs: 100, // Very short window for testing
      max: 2
    });

    // Make 2 requests to reach the limit
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(2);

    // Wait for window to expire
    setTimeout(() => {
      // Make another request, should be allowed
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(3);
      done();
    }, 150);
  });

  it("should handle different IPs separately", () => {
    const request1 = { ip: "192.168.1.1", path: "/test" };
    const request2 = { ip: "192.168.1.2", path: "/test" };

    // Make 6 requests with first IP (exceeding limit)
    for (let i = 0; i < 6; i++) {
      middleware.use(request1 as Request, mockResponse as Response, mockNext);
    }

    // Make 1 request with second IP (should be allowed)
    middleware.use(request2 as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(6); // 5 for first IP, 1 for second IP
  });
});
