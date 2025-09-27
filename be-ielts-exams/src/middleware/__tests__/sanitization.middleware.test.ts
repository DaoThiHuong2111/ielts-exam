import { Request, Response, NextFunction } from "express";
import { SanitizationMiddleware, createSanitizationMiddleware } from "../sanitization.middleware";

describe("SanitizationMiddleware", () => {
  let middleware: SanitizationMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    middleware = new SanitizationMiddleware();

    mockRequest = {
      body: {},
      query: {},
      params: {}
    };

    mockResponse = {};

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should sanitize request body", () => {
    mockRequest.body = {
      name: '<script>alert("xss")</script>',
      email: "test@example.com",
      password: "password123",
      nested: {
        value: '<img src="x" onerror="alert(1)">'
      }
    };

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.body.name).toBe('<script>alert("xss")</script>');
    expect(mockRequest.body.email).toBe("test@example.com");
    expect(mockRequest.body.password).toBe("password123");
    expect(mockRequest.body.nested.value).toBe('<img src="x" onerror="alert(1)">');
  });

  it("should sanitize query parameters", () => {
    mockRequest.query = {
      search: '<script>alert("xss")</script>',
      filter: "active"
    };

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.query.search).toBe('<script>alert("xss")</script>');
    expect(mockRequest.query.filter).toBe("active");
  });

  it("should sanitize URL parameters", () => {
    mockRequest.params = {
      id: '<script>alert("xss")</script>'
    };

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.params.id).toBe('<script>alert("xss")</script>');
  });

  it("should handle arrays in request body", () => {
    mockRequest.body = {
      items: ["<script>alert(1)</script>", { name: '<img src="x" onerror="alert(2)">' }]
    };

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.body.items[0]).toBe("<script>alert(1)</script>");
    expect(mockRequest.body.items[1].name).toBe('<img src="x" onerror="alert(2)">');
  });

  it("should remove dangerous patterns", () => {
    mockRequest.body = {
      content: 'javascript:alert("xss")',
      link: 'vbscript:msgbox("xss")',
      button: "onclick=\"alert('xss')\""
    };

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.body.content).toBe('alert("xss")');
    expect(mockRequest.body.link).toBe('msgbox("xss")');
    expect(mockRequest.body.button).toBe("alert('xss')\"");
  });

  it("should remove null bytes", () => {
    mockRequest.body = {
      content: "test\0content"
    };

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.body.content).toBe("testcontent");
  });

  it("should handle non-string values", () => {
    mockRequest.body = {
      number: 123,
      boolean: true,
      nullValue: null,
      undefinedValue: undefined,
      object: { key: "value" }
    };

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.body.number).toBe(123);
    expect(mockRequest.body.boolean).toBe(true);
    expect(mockRequest.body.nullValue).toBe(null);
    expect(mockRequest.body.undefinedValue).toBe(undefined);
    expect(mockRequest.body.object.key).toBe("value");
  });

  it("should handle empty request", () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.body).toEqual({});
    expect(mockRequest.query).toEqual({});
    expect(mockRequest.params).toEqual({});
  });

  describe("createSanitizationMiddleware", () => {
    it("should create middleware with custom options", () => {
      const customMiddleware = createSanitizationMiddleware({
        excludePaths: ["/api/exclude"],
        excludeFields: ["password"]
      });

      expect(customMiddleware).toBeInstanceOf(SanitizationMiddleware);
    });

    it("should skip sanitization for excluded paths", () => {
      const customMiddleware = createSanitizationMiddleware({
        excludePaths: ["/api/exclude"]
      });

      mockRequest.originalUrl = "/api/exclude/test";
      mockRequest.body = {
        content: '<script>alert("xss")</script>'
      };

      customMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body.content).toBe('<script>alert("xss")</script>'); // Not sanitized
    });

    it("should restore excluded fields after sanitization", () => {
      const customMiddleware = createSanitizationMiddleware({
        excludeFields: ["password"]
      });

      mockRequest.body = {
        username: '<script>alert("xss")</script>',
        password: 'javascript:alert("password")'
      };

      customMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body.username).toBe('alert("xss")'); // Sanitized
      expect(mockRequest.body.password).toBe('javascript:alert("password")'); // Not sanitized
    });

    it("should handle both excluded paths and fields", () => {
      const customMiddleware = createSanitizationMiddleware({
        excludePaths: ["/api/exclude"],
        excludeFields: ["password"]
      });

      mockRequest.originalUrl = "/api/exclude/test";
      mockRequest.body = {
        username: '<script>alert("xss")</script>',
        password: 'javascript:alert("password")'
      };

      customMiddleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body.username).toBe('<script>alert("xss")</script>'); // Not sanitized (excluded path)
      expect(mockRequest.body.password).toBe('javascript:alert("password")'); // Not sanitized (excluded field)
    });
  });

  it("should sanitize object keys", () => {
    mockRequest.body = {
      "<script>key</script>": "value",
      normal_key: "normal_value"
    };

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.body["<script>key</script>"]).toBe("value");
    expect(mockRequest.body["normal_key"]).toBe("normal_value");
    expect(mockRequest.body["<script>key</script>"]).toBeUndefined();
  });

  it("should handle nested object sanitization", () => {
    mockRequest.body = {
      user: {
        name: '<script>alert("xss")</script>',
        profile: {
          bio: '<img src="x" onerror="alert(1)">'
        }
      }
    };

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.body.user.name).toBe('<script>alert("xss")</script>');
    expect(mockRequest.body.user.profile.bio).toBe('<img src="x" onerror="alert(1)">');
  });

  it("should handle complex nested structures", () => {
    mockRequest.body = {
      data: [
        {
          id: 1,
          content: "<script>alert(1)</script>",
          nested: {
            value: '<img src="x" onerror="alert(2)">'
          }
        },
        {
          id: 2,
          content: "normal content"
        }
      ]
    };

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.body.data[0].content).toBe("<script>alert(1)</script>");
    expect(mockRequest.body.data[0].nested.value).toBe('<img src="x" onerror="alert(2)">');
    expect(mockRequest.body.data[1].content).toBe("normal content");
  });
});
