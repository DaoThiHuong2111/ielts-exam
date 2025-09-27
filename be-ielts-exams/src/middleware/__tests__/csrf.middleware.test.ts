import { Request, Response, NextFunction } from "express";
import { CsrfMiddleware, createCsrfMiddleware } from "../csrf.middleware";

describe("CsrfMiddleware", () => {
  let middleware: CsrfMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    middleware = new CsrfMiddleware();

    mockRequest = {
      method: "GET",
      originalUrl: "/test",
      cookies: {},
      headers: {}
    };

    mockResponse = {
      cookie: jest.fn()
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should skip CSRF protection for GET requests", () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.cookie).not.toHaveBeenCalled();
  });

  it("should skip CSRF protection for HEAD requests", () => {
    mockRequest.method = "HEAD";

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.cookie).not.toHaveBeenCalled();
  });

  it("should skip CSRF protection for OPTIONS requests", () => {
    mockRequest.method = "OPTIONS";

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.cookie).not.toHaveBeenCalled();
  });

  it("should skip CSRF protection for excluded paths", () => {
    mockRequest.method = "POST";
    (mockRequest as any).path = "/api/auth/login";

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.cookie).not.toHaveBeenCalled();
  });

  it("should generate CSRF token for POST requests if none exists", () => {
    mockRequest.method = "POST";
    (mockRequest as any).path = "/api/protected";

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      "XSRF-TOKEN",
      expect.any(String),
      expect.objectContaining({
        httpOnly: false,
        secure: false,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/"
      })
    );
    expect(mockRequest.csrfToken).toBeDefined();
  });

  it("should use existing CSRF token from cookie", () => {
    mockRequest.method = "POST";
    (mockRequest as any).path = "/api/protected";
    mockRequest.cookies = { "XSRF-TOKEN": "existing-token" };

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.cookie).not.toHaveBeenCalled();
    expect(mockRequest.csrfToken).toBeDefined();
    expect(mockRequest.csrfToken!()).toBe("existing-token");
  });

  it("should reject POST requests without CSRF token header", () => {
    mockRequest.method = "POST";
    (mockRequest as any).path = "/api/protected";
    mockRequest.cookies = { "XSRF-TOKEN": "test-token" };

    const statusMock = jest.fn().mockReturnThis();
    const jsonMock = jest.fn();
    mockResponse.status = statusMock;
    mockResponse.json = jsonMock;

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      statusCode: 403,
      message: "CSRF token missing",
      error: "Forbidden"
    });
  });

  it("should reject POST requests with invalid CSRF token", () => {
    mockRequest.method = "POST";
    (mockRequest as any).path = "/api/protected";
    mockRequest.cookies = { "XSRF-TOKEN": "valid-token" };
    mockRequest.headers = { "X-XSRF-TOKEN": "invalid-token" };

    const statusMock = jest.fn().mockReturnThis();
    const jsonMock = jest.fn();
    mockResponse.status = statusMock;
    mockResponse.json = jsonMock;

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      statusCode: 403,
      message: "Invalid CSRF token",
      error: "Forbidden"
    });
  });

  it("should allow POST requests with valid CSRF token", () => {
    mockRequest.method = "POST";
    (mockRequest as any).path = "/api/protected";
    const validToken = "a1b2c3d4e5f678901234567890123456";
    mockRequest.cookies = { "XSRF-TOKEN": validToken };
    mockRequest.headers = { "X-XSRF-TOKEN": validToken };

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it("should handle PUT requests with CSRF protection", () => {
    mockRequest.method = "PUT";
    (mockRequest as any).path = "/api/protected";
    const validToken = "a1b2c3d4e5f678901234567890123456";
    mockRequest.cookies = { "XSRF-TOKEN": validToken };
    mockRequest.headers = { "X-XSRF-TOKEN": validToken };

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it("should handle PATCH requests with CSRF protection", () => {
    mockRequest.method = "PATCH";
    (mockRequest as any).path = "/api/protected";
    const validToken = "a1b2c3d4e5f678901234567890123456";
    mockRequest.cookies = { "XSRF-TOKEN": validToken };
    mockRequest.headers = { "X-XSRF-TOKEN": validToken };

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it("should handle DELETE requests with CSRF protection", () => {
    mockRequest.method = "DELETE";
    (mockRequest as any).path = "/api/protected";
    const validToken = "a1b2c3d4e5f678901234567890123456";
    mockRequest.cookies = { "XSRF-TOKEN": validToken };
    mockRequest.headers = { "X-XSRF-TOKEN": validToken };

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  describe("createCsrfMiddleware", () => {
    it("should create middleware with custom options", () => {
      const customMiddleware = createCsrfMiddleware({
        cookieName: "CUSTOM-CSRF-TOKEN",
        headerName: "X-CUSTOM-CSRF-TOKEN",
        excludedPaths: ["/api/custom-exclude"]
      });

      expect(customMiddleware).toBeInstanceOf(CsrfMiddleware);
    });

    it("should use custom cookie name", () => {
      const customMiddleware = createCsrfMiddleware({
        cookieName: "CUSTOM-CSRF-TOKEN"
      });

      mockRequest.method = "POST";
      (mockRequest as any).path = "/api/protected";

      customMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.cookie).toHaveBeenCalledWith("CUSTOM-CSRF-TOKEN", expect.any(String), expect.any(Object));
    });

    it("should use custom header name", () => {
      const customMiddleware = createCsrfMiddleware({
        headerName: "X-CUSTOM-CSRF-TOKEN"
      });

      mockRequest.method = "POST";
      (mockRequest as any).path = "/api/protected";
      mockRequest.cookies = { "XSRF-TOKEN": "test-token" };
      mockRequest.headers = { "X-CUSTOM-CSRF-TOKEN": "test-token" };

      customMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should use custom excluded paths", () => {
      const customMiddleware = createCsrfMiddleware({
        excludedPaths: ["/api/custom-exclude"]
      });

      mockRequest.method = "POST";
      (mockRequest as any).path = "/api/custom-exclude";

      customMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.cookie).not.toHaveBeenCalled();
    });
  });

  it("should handle invalid hex tokens gracefully", () => {
    mockRequest.method = "POST";
    (mockRequest as any).path = "/api/protected";
    mockRequest.cookies = { "XSRF-TOKEN": "invalid-hex-token!" };
    mockRequest.headers = { "X-XSRF-TOKEN": "invalid-hex-token!" };

    const statusMock = jest.fn().mockReturnThis();
    const jsonMock = jest.fn();
    mockResponse.status = statusMock;
    mockResponse.json = jsonMock;

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      statusCode: 403,
      message: "Invalid CSRF token",
      error: "Forbidden"
    });
  });

  it("should handle tokens of different lengths", () => {
    mockRequest.method = "POST";
    (mockRequest as any).path = "/api/protected";
    mockRequest.cookies = { "XSRF-TOKEN": "a1b2" };
    mockRequest.headers = { "X-XSRF-TOKEN": "a1b2c3" };

    const statusMock = jest.fn().mockReturnThis();
    const jsonMock = jest.fn();
    mockResponse.status = statusMock;
    mockResponse.json = jsonMock;

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      statusCode: 403,
      message: "Invalid CSRF token",
      error: "Forbidden"
    });
  });
});
