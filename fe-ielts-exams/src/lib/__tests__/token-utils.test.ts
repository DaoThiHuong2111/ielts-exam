import {
  getCookie,
  setCookie,
  deleteCookie,
  isTokenExpired,
  getTokenExpirationTime,
  getTokenPayload,
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
  isAuthenticated,
  redirectToLogin
} from '../token-utils';

// Mock document object
Object.defineProperty(window, 'document', {
  value: {
    cookie: '',
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock location
const locationMock = {
  href: '',
};
Object.defineProperty(window, 'location', {
  value: locationMock,
  writable: true,
});

// Mock process.env
Object.defineProperty(process, 'env', {
  value: {
    NODE_ENV: 'test',
  },
  writable: true,
});

describe('Token Utils', () => {
  beforeEach(() => {
    // Reset mocks
    document.cookie = '';
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    locationMock.href = '';
  });

  describe('getCookie', () => {
    it('should return cookie value if exists', () => {
      document.cookie = 'accessToken=test-token-value';
      expect(getCookie('accessToken')).toBe('test-token-value');
    });

    it('should return null if cookie does not exist', () => {
      expect(getCookie('nonexistent')).toBeNull();
    });

    it('should handle URL-encoded cookie values', () => {
      document.cookie = 'accessToken=test%20token%20value';
      expect(getCookie('accessToken')).toBe('test token value');
    });
  });

  describe('setCookie', () => {
    it('should set cookie with default options', () => {
      setCookie('testCookie', 'testValue');
      expect(document.cookie).toContain('testCookie=testValue');
      expect(document.cookie).toContain('path=/');
      expect(document.cookie).toContain('samesite=lax');
    });

    it('should set cookie with custom options', () => {
      setCookie('testCookie', 'testValue', {
        maxAge: 3600,
        path: '/api',
        secure: true,
        sameSite: 'strict',
      });
      expect(document.cookie).toContain('testCookie=testValue');
      expect(document.cookie).toContain('max-age=3600');
      expect(document.cookie).toContain('path=/api');
      expect(document.cookie).toContain('secure');
      expect(document.cookie).toContain('samesite=strict');
    });

    it('should use secure flag in production', () => {
      process.env.NODE_ENV = 'production';
      setCookie('testCookie', 'testValue');
      expect(document.cookie).toContain('secure');
      process.env.NODE_ENV = 'test';
    });
  });

  describe('deleteCookie', () => {
    it('should delete cookie', () => {
      document.cookie = 'testCookie=value';
      deleteCookie('testCookie');
      expect(document.cookie).toContain('testCookie=; max-age=0');
    });
  });

  describe('isTokenExpired', () => {
    it('should return true for expired token', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj3UFYzP5aQN8V7iE3U4Y7jQh9lN0X8X0J0X8X0';
      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it('should return false for valid token', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const validToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOiR7fHV0dW1lfQ==.signature`;
      const tokenWithFutureExp = validToken.replace('${futureTime}', futureTime.toString());
      expect(isTokenExpired(tokenWithFutureExp)).toBe(false);
    });

    it('should return true for invalid token', () => {
      expect(isTokenExpired('invalid-token')).toBe(true);
    });

    it('should consider token expired if it expires in the next 5 minutes', () => {
      const nearFutureTime = Math.floor(Date.now() / 1000) + 200; // 200 seconds from now
      const nearExpiryToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOiR7fHV0dW1lfQ==.signature`;
      const tokenWithNearExp = nearExpiryToken.replace('${nearFutureTime}', nearFutureTime.toString());
      expect(isTokenExpired(tokenWithNearExp)).toBe(true);
    });
  });

  describe('getTokenExpirationTime', () => {
    it('should return expiration time for valid token', () => {
      const expirationTime = Math.floor(Date.now() / 1000) + 3600;
      const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOiR7fHV0dW1lfQ==.signature`;
      const tokenWithExp = token.replace('${expirationTime}', expirationTime.toString());
      expect(getTokenExpirationTime(tokenWithExp)).toBe(expirationTime);
    });

    it('should return null for invalid token', () => {
      expect(getTokenExpirationTime('invalid-token')).toBeNull();
    });
  });

  describe('getTokenPayload', () => {
    it('should return payload for valid token', () => {
      const payload = { sub: '1234567890', name: 'John Doe' };
      const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(payload))}.signature`;
      expect(getTokenPayload(token)).toEqual(payload);
    });

    it('should return null for invalid token', () => {
      expect(getTokenPayload('invalid-token')).toBeNull();
    });
  });

  describe('clearAuthTokens', () => {
    it('should clear tokens from localStorage and cookies', () => {
      document.cookie = 'accessToken=token; refreshToken=refresh';
      
      clearAuthTokens();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(document.cookie).toContain('accessToken=; max-age=0');
      expect(document.cookie).toContain('refreshToken=; max-age=0');
    });
  });

  describe('getAccessToken', () => {
    it('should get token from cookie first', () => {
      document.cookie = 'accessToken=cookie-token';
      localStorageMock.getItem.mockReturnValue('localStorage-token');
      
      expect(getAccessToken()).toBe('cookie-token');
    });

    it('should fallback to localStorage if cookie not found', () => {
      document.cookie = '';
      localStorageMock.getItem.mockReturnValue('localStorage-token');
      
      expect(getAccessToken()).toBe('localStorage-token');
    });

    it('should return null if token not found', () => {
      document.cookie = '';
      localStorageMock.getItem.mockReturnValue(null);
      
      expect(getAccessToken()).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('should get token from cookie first', () => {
      document.cookie = 'refreshToken=cookie-token';
      localStorageMock.getItem.mockReturnValue('localStorage-token');
      
      expect(getRefreshToken()).toBe('cookie-token');
    });

    it('should fallback to localStorage if cookie not found', () => {
      document.cookie = '';
      localStorageMock.getItem.mockReturnValue('localStorage-token');
      
      expect(getRefreshToken()).toBe('localStorage-token');
    });
  });

  describe('saveTokens', () => {
    it('should save tokens to localStorage and cookies', () => {
      saveTokens('access-token', 'refresh-token');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-token');
      expect(document.cookie).toContain('accessToken=access-token');
      expect(document.cookie).toContain('refreshToken=refresh-token');
    });

    it('should save only access token if refresh token not provided', () => {
      saveTokens('access-token');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'access-token');
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('refreshToken', expect.any(String));
      expect(document.cookie).toContain('accessToken=access-token');
      expect(document.cookie).not.toContain('refreshToken=');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if user has valid tokens', () => {
      const validToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOiR7TWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCkgKyAzNjAwfX0=.signature`;
      const tokenWithFutureExp = validToken.replace('${Math.floor(Date.now() / 1000) + 3600}', (Math.floor(Date.now() / 1000) + 3600).toString());
      
      document.cookie = `accessToken=${tokenWithFutureExp}; refreshToken=refresh-token`;
      
      expect(isAuthenticated()).toBe(true);
    });

    it('should return false if access token is missing', () => {
      document.cookie = 'refreshToken=refresh-token';
      
      expect(isAuthenticated()).toBe(false);
    });

    it('should return false if refresh token is missing', () => {
      document.cookie = 'accessToken=access-token';
      
      expect(isAuthenticated()).toBe(false);
    });

    it('should return false if access token is expired', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj3UFYzP5aQN8V7iE3U4Y7jQh9lN0X8X0J0X8X0';
      document.cookie = `accessToken=${expiredToken}; refreshToken=refresh-token`;
      
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('redirectToLogin', () => {
    it('should redirect to login page', () => {
      redirectToLogin();
      expect(locationMock.href).toBe('/login');
    });
  });
});