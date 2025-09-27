import { SessionService } from '../session.service';
import { isAuthenticated, getAccessToken, getRefreshToken, isTokenExpired, clearAuthTokens } from '@/lib/token-utils';
import { clientService } from '@/lib/axios';
import { LogoutService } from '../logout.service';

// Mock dependencies
jest.mock('@/lib/token-utils', () => ({
  isAuthenticated: jest.fn(),
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
  isTokenExpired: jest.fn(),
  clearAuthTokens: jest.fn(),
}));

jest.mock('@/lib/axios', () => ({
  clientService: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('../logout.service', () => ({
  LogoutService: {
    forceLogout: jest.fn(),
  },
}));

// Mock DOM APIs
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
const mockSetTimeout = jest.fn();
const mockClearTimeout = jest.fn();
const mockSetInterval = jest.fn();
const mockClearInterval = jest.fn();

Object.defineProperty(document, 'addEventListener', {
  value: mockAddEventListener,
});
Object.defineProperty(document, 'removeEventListener', {
  value: mockRemoveEventListener,
});
Object.defineProperty(document, 'visibilityState', {
  value: 'visible',
  writable: true,
});

Object.defineProperty(window, 'setTimeout', {
  value: mockSetTimeout,
});
Object.defineProperty(window, 'clearTimeout', {
  value: mockClearTimeout,
});
Object.defineProperty(window, 'setInterval', {
  value: mockSetInterval,
});
Object.defineProperty(window, 'clearInterval', {
  value: mockClearInterval,
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('SessionService', () => {
  let sessionService: SessionService;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionService = new SessionService();
    
    // Reset mock implementations
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (getAccessToken as jest.Mock).mockReturnValue('valid-token');
    (getRefreshToken as jest.Mock).mockReturnValue('valid-refresh-token');
    (isTokenExpired as jest.Mock).mockReturnValue(false);
    
    // Mock setTimeout to call callback immediately for testing
    mockSetTimeout.mockImplementation((callback: Function) => {
      callback();
      return 123 as any;
    });
    
    // Mock setInterval to call callback immediately for testing
    mockSetInterval.mockImplementation((callback: Function) => {
      callback();
      return 456 as any;
    });
  });

  afterEach(() => {
    // Destroy service instance to clean up
    if (SessionService['instance']) {
      SessionService['instance'].destroy();
    }
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = SessionService.getInstance();
      const instance2 = SessionService.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should create new instance with config', () => {
      const config = { inactivityTimeout: 60000 };
      const instance = SessionService.getInstance(config);
      
      expect(instance).toBeInstanceOf(SessionService);
    });
  });

  describe('initialize', () => {
    it('should start monitoring when authenticated', async () => {
      await sessionService.initialize();
      
      expect(mockSetInterval).toHaveBeenCalled();
      expect(mockAddEventListener).toHaveBeenCalled();
    });

    it('should clear session when not authenticated', async () => {
      (isAuthenticated as jest.Mock).mockReturnValue(false);
      
      await sessionService.initialize();
      
      expect(mockSetInterval).not.toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('lastActivity');
    });

    it('should validate session with backend', async () => {
      (clientService.get as jest.Mock).mockResolvedValue({ status: 200 });
      
      await sessionService.initialize();
      
      expect(clientService.get).toHaveBeenCalledWith('/v1/auth/validate');
    });
  });

  describe('getSessionInfo', () => {
    it('should return correct session info when authenticated', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.signature';
      (getAccessToken as jest.Mock).mockReturnValue(mockToken);
      
      const sessionInfo = sessionService.getSessionInfo();
      
      expect(sessionInfo.isAuthenticated).toBe(true);
      expect(sessionInfo.accessToken).toBe(mockToken);
      expect(sessionInfo.refreshToken).toBe('valid-refresh-token');
      expect(sessionInfo.isExpired).toBe(false);
      expect(sessionInfo.tokenExpiry).toBe(1916239022000); // exp * 1000
    });

    it('should handle invalid token', () => {
      (getAccessToken as jest.Mock).mockReturnValue('invalid-token');
      
      const sessionInfo = sessionService.getSessionInfo();
      
      expect(sessionInfo.isAuthenticated).toBe(true);
      expect(sessionInfo.isExpired).toBe(true);
    });

    it('should return correct info when not authenticated', () => {
      (isAuthenticated as jest.Mock).mockReturnValue(false);
      
      const sessionInfo = sessionService.getSessionInfo();
      
      expect(sessionInfo.isAuthenticated).toBe(false);
      expect(sessionInfo.accessToken).toBeNull();
      expect(sessionInfo.refreshToken).toBeNull();
    });
  });

  describe('session listeners', () => {
    it('should add and remove session listeners', () => {
      const listener = jest.fn();
      
      sessionService.addSessionListener(listener);
      expect(sessionService['listeners'].has(listener)).toBe(true);
      
      sessionService.removeSessionListener(listener);
      expect(sessionService['listeners'].has(listener)).toBe(false);
    });

    it('should add and remove warning listeners', () => {
      const listener = jest.fn();
      
      sessionService.addWarningListener(listener);
      expect(sessionService['warningListeners'].has(listener)).toBe(true);
      
      sessionService.removeWarningListener(listener);
      expect(sessionService['warningListeners'].has(listener)).toBe(false);
    });

    it('should add and remove timeout listeners', () => {
      const listener = jest.fn();
      
      sessionService.addTimeoutListener(listener);
      expect(sessionService['timeoutListeners'].has(listener)).toBe(true);
      
      sessionService.removeTimeoutListener(listener);
      expect(sessionService['timeoutListeners'].has(listener)).toBe(false);
    });

    it('should notify listeners on session update', () => {
      const listener = jest.fn();
      sessionService.addSessionListener(listener);
      
      sessionService['notifyListeners']();
      
      expect(listener).toHaveBeenCalledWith(sessionService.getSessionInfo());
    });
  });

  describe('session timeout handling', () => {
    it('should handle session timeout', async () => {
      const timeoutListener = jest.fn();
      sessionService.addTimeoutListener(timeoutListener);
      
      // Simulate session timeout
      sessionService['lastActivity'] = Date.now() - 31 * 60 * 1000; // 31 minutes ago
      
      await sessionService['checkSession']();
      
      expect(mockClearInterval).toHaveBeenCalled();
      expect(mockClearTimeout).toHaveBeenCalled();
      expect(timeoutListener).toHaveBeenCalled();
      expect(LogoutService.forceLogout).toHaveBeenCalled();
    });

    it('should show warning before timeout', () => {
      const warningListener = jest.fn();
      sessionService.addWarningListener(warningListener);
      
      // Simulate approaching timeout
      sessionService['lastActivity'] = Date.now() - 26 * 60 * 1000; // 26 minutes ago
      
      sessionService['checkSession']();
      
      expect(warningListener).toHaveBeenCalled();
      expect(mockSetTimeout).toHaveBeenCalled();
    });
  });

  describe('activity handling', () => {
    it('should update last activity on user interaction', () => {
      const now = Date.now();
      
      sessionService['handleActivity']();
      
      expect(sessionService['lastActivity']).toBeGreaterThanOrEqual(now);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('lastActivity', sessionService['lastActivity'].toString());
    });

    it('should clear warning timeout on activity', () => {
      sessionService['warningTimeoutId'] = 123 as any;
      
      sessionService['handleActivity']();
      
      expect(mockClearTimeout).toHaveBeenCalledWith(123);
      expect(sessionService['warningTimeoutId']).toBeNull();
    });
  });

  describe('token refresh', () => {
    it('should refresh token when expired', async () => {
      (isTokenExpired as jest.Mock).mockReturnValue(true);
      (clientService.post as jest.Mock).mockResolvedValue({ status: 200 });
      
      await sessionService['checkSession']();
      
      expect(clientService.post).toHaveBeenCalledWith('/api/auth/refresh');
    });

    it('should handle token refresh failure', async () => {
      (isTokenExpired as jest.Mock).mockReturnValue(true);
      (clientService.post as jest.Mock).mockRejectedValue(new Error('Refresh failed'));
      
      await sessionService['checkSession']();
      
      expect(clientService.post).toHaveBeenCalledWith('/api/auth/refresh');
      // Should not throw error, just log warning
    });
  });

  describe('visibility change handling', () => {
    it('should check session when tab becomes visible', () => {
      const checkSessionSpy = jest.spyOn(sessionService as any, 'checkSession');
      
      document.visibilityState = 'visible';
      sessionService['handleVisibilityChange']();
      
      expect(checkSessionSpy).toHaveBeenCalled();
    });

    it('should not check session when tab is hidden', () => {
      const checkSessionSpy = jest.spyOn(sessionService as any, 'checkSession');
      
      document.visibilityState = 'hidden';
      sessionService['handleVisibilityChange']();
      
      expect(checkSessionSpy).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should clean up all resources', () => {
      const listener = jest.fn();
      sessionService.addSessionListener(listener);
      sessionService.addWarningListener(listener);
      sessionService.addTimeoutListener(listener);
      
      sessionService.destroy();
      
      expect(mockClearInterval).toHaveBeenCalled();
      expect(mockClearTimeout).toHaveBeenCalled();
      expect(sessionService['listeners'].size).toBe(0);
      expect(sessionService['warningListeners'].size).toBe(0);
      expect(sessionService['timeoutListeners'].size).toBe(0);
    });
  });

  describe('extendSession', () => {
    it('should update last activity', () => {
      const now = Date.now();
      
      sessionService.extendSession();
      
      expect(sessionService['lastActivity']).toBeGreaterThanOrEqual(now);
    });
  });
});