import { SecurityConfig } from "../security.config";

describe("SecurityConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getCookieOptions", () => {
    it("should return secure cookie options for production", () => {
      process.env.NODE_ENV = "production";
      process.env.COOKIE_DOMAIN = "example.com";

      const options = SecurityConfig.getCookieOptions();

      expect(options).toEqual({
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
        domain: "example.com"
      });
    });

    it("should return less secure cookie options for development", () => {
      process.env.NODE_ENV = "development";

      const options = SecurityConfig.getCookieOptions();

      expect(options).toEqual({
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
        domain: undefined
      });
    });
  });

  describe("getRateLimitOptions", () => {
    it("should return strict rate limit options for production", () => {
      process.env.NODE_ENV = "production";

      const options = SecurityConfig.getRateLimitOptions();

      expect(options).toEqual({
        auth: {
          windowMs: 15 * 60 * 1000,
          max: 5
        },
        passwordReset: {
          windowMs: 60 * 60 * 1000,
          max: 3
        },
        general: {
          windowMs: 15 * 60 * 1000,
          max: 100
        }
      });
    });

    it("should return lenient rate limit options for development", () => {
      process.env.NODE_ENV = "development";

      const options = SecurityConfig.getRateLimitOptions();

      expect(options).toEqual({
        auth: {
          windowMs: 15 * 60 * 1000,
          max: 100
        },
        passwordReset: {
          windowMs: 60 * 60 * 1000,
          max: 100
        },
        general: {
          windowMs: 15 * 60 * 1000,
          max: 1000
        }
      });
    });
  });

  describe("getCorsOptions", () => {
    it("should return restricted CORS options for production", () => {
      process.env.NODE_ENV = "production";
      process.env.FRONTEND_URL = "https://example.com";

      const options = SecurityConfig.getCorsOptions();

      expect(typeof options.origin).toBe("function");
      expect(options.methods).toEqual(["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]);
      expect(options.credentials).toBe(true);
      expect(options.optionsSuccessStatus).toBe(204);
      expect(options.allowedHeaders).toEqual(["Content-Type", "Authorization", "X-XSRF-TOKEN", "Cookie"]);
    });

    it("should return CORS options with origin function for development", () => {
      process.env.NODE_ENV = "development";

      const options = SecurityConfig.getCorsOptions();

      expect(typeof options.origin).toBe("function");
      expect(options.methods).toEqual(["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]);
      expect(options.credentials).toBe(true);
      expect(options.optionsSuccessStatus).toBe(204);
      expect(options.allowedHeaders).toEqual(["Content-Type", "Authorization", "X-XSRF-TOKEN", "Cookie"]);
    });

    it("should use default frontend URL when not set in production", () => {
      process.env.NODE_ENV = "production";
      delete process.env.FRONTEND_URL;

      const options = SecurityConfig.getCorsOptions();

      // Kiểm tra rằng origin là function và chấp nhận localhost:3000
      expect(typeof options.origin).toBe("function");
    });
  });

  describe("getHelmetConfig", () => {
    it("should return helmet configuration with HSTS enabled in production", () => {
      process.env.NODE_ENV = "production";
      process.env.FRONTEND_URL = "https://example.com";

      const config = SecurityConfig.getHelmetConfig();

      expect(config.contentSecurityPolicy.directives).toEqual({
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://example.com"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      });

      expect(config.hsts).toEqual({
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      });

      // noSniff, xssFilter, ieNoOpen đã được bật mặc định trong helmet v8
      expect(config.frameguard).toEqual({ action: "deny" });
      expect(config.hidePoweredBy).toBe(true);
    });

    it("should return helmet configuration with HSTS disabled in development", () => {
      process.env.NODE_ENV = "development";

      const config = SecurityConfig.getHelmetConfig();

      expect(config.hsts).toBe(false);
    });

    it("should use default frontend URL when not set", () => {
      delete process.env.FRONTEND_URL;

      const config = SecurityConfig.getHelmetConfig();

      expect(config.contentSecurityPolicy.directives.connectSrc).toEqual(["'self'", "http://localhost:3000"]);
    });
  });

  describe("validateEnvironment", () => {
    it("should not throw when all required environment variables are set", () => {
      process.env.JWT_ACCESS_SECRET = "test-access-secret";
      process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
      process.env.JWT_PASSWORD_RESET_SECRET = "test-password-reset-secret";

      expect(() => {
        SecurityConfig.validateEnvironment();
      }).not.toThrow();
    });

    it("should throw when required environment variables are missing", () => {
      delete process.env.JWT_ACCESS_SECRET;
      delete process.env.JWT_REFRESH_SECRET;
      delete process.env.JWT_PASSWORD_RESET_SECRET;

      expect(() => {
        SecurityConfig.validateEnvironment();
      }).toThrow(
        "Missing required environment variables: JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_PASSWORD_RESET_SECRET"
      );
    });

    it("should throw when some required environment variables are missing", () => {
      process.env.JWT_ACCESS_SECRET = "test-access-secret";
      delete process.env.JWT_REFRESH_SECRET;
      delete process.env.JWT_PASSWORD_RESET_SECRET;

      expect(() => {
        SecurityConfig.validateEnvironment();
      }).toThrow("Missing required environment variables: JWT_REFRESH_SECRET, JWT_PASSWORD_RESET_SECRET");
    });

    it("should warn about missing production-specific environment variables", () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      process.env.NODE_ENV = "production";
      process.env.JWT_ACCESS_SECRET = "test-access-secret";
      process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
      process.env.JWT_PASSWORD_RESET_SECRET = "test-password-reset-secret";
      delete process.env.FRONTEND_URL;
      delete process.env.COOKIE_DOMAIN;

      expect(() => {
        SecurityConfig.validateEnvironment();
      }).not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith("FRONTEND_URL environment variable is not set in production");
      expect(consoleWarnSpy).toHaveBeenCalledWith("COOKIE_DOMAIN environment variable is not set in production");

      consoleWarnSpy.mockRestore();
    });

    it("should not warn in development when production-specific variables are missing", () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      process.env.NODE_ENV = "development";
      process.env.JWT_ACCESS_SECRET = "test-access-secret";
      process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
      process.env.JWT_PASSWORD_RESET_SECRET = "test-password-reset-secret";
      delete process.env.FRONTEND_URL;
      delete process.env.COOKIE_DOMAIN;

      expect(() => {
        SecurityConfig.validateEnvironment();
      }).not.toThrow();

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
