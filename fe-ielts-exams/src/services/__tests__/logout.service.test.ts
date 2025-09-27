import { LogoutService } from '../logout.service';
import { clearAuthTokens, redirectToLogin } from '@/lib/token-utils';
import { clientService } from '@/lib/axios';

// Mock dependencies
jest.mock('@/lib/token-utils', () => ({
  clearAuthTokens: jest.fn(),
  redirectToLogin: jest.fn(),
}));

jest.mock('@/lib/axios', () => ({
  clientService: {
    post: jest.fn(),
  },
}));

// Mock window.confirm
const mockConfirm = jest.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
});

// Mock window.location
const mockLocation = {
  href: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('LogoutService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
    mockLocation.href = '';
  });

  describe('logout', () => {
    it('should successfully logout and clear tokens', async () => {
      const mockResponse = {
        data: {
          message: 'Đăng xuất thành công',
          backendError: null,
          cookieError: null,
        },
      };

      (clientService.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await LogoutService.logout();

      expect(clientService.post).toHaveBeenCalledWith('/api/auth/logout');
      expect(clearAuthTokens).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Đăng xuất thành công',
        backendError: undefined,
        cookieError: undefined,
      });
    });

    it('should handle API errors but still clear tokens', async () => {
      const mockError = new Error('Network error');
      (clientService.post as jest.Mock).mockRejectedValue(mockError);

      const result = await LogoutService.logout();

      expect(clientService.post).toHaveBeenCalledWith('/api/auth/logout');
      expect(clearAuthTokens).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Network error',
        backendError: 'Network error',
      });
    });

    it('should handle string errors', async () => {
      (clientService.post as jest.Mock).mockRejectedValue('String error');

      const result = await LogoutService.logout();

      expect(result).toEqual({
        success: true,
        message: 'String error',
        backendError: 'String error',
      });
    });

    it('should handle non-Error object errors', async () => {
      (clientService.post as jest.Mock).mockRejectedValue({ code: 500 });

      const result = await LogoutService.logout();

      expect(result).toEqual({
        success: true,
        message: 'Đăng xuất thành công (lỗi kết nối)',
        backendError: '[object Object]',
      });
    });
  });

  describe('logoutWithConfirmation', () => {
    it('should logout when user confirms', async () => {
      mockConfirm.mockReturnValue(true);
      const mockResponse = { data: { message: 'Đăng xuất thành công' } };
      (clientService.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await LogoutService.logoutWithConfirmation();

      expect(mockConfirm).toHaveBeenCalledWith('Bạn có chắc chắn muốn đăng xuất?');
      expect(clientService.post).toHaveBeenCalledWith('/api/auth/logout');
      expect(result.success).toBe(true);
    });

    it('should not logout when user cancels', async () => {
      mockConfirm.mockReturnValue(false);

      const result = await LogoutService.logoutWithConfirmation();

      expect(mockConfirm).toHaveBeenCalledWith('Bạn có chắc chắn muốn đăng xuất?');
      expect(clientService.post).not.toHaveBeenCalled();
      expect(clearAuthTokens).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Đăng xuất đã bị hủy',
      });
    });
  });

  describe('forceLogout', () => {
    it('should force logout even if API fails', async () => {
      (clientService.post as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await LogoutService.forceLogout();

      expect(clientService.post).toHaveBeenCalledWith('/api/auth/logout');
      expect(clearAuthTokens).toHaveBeenCalled();
      expect(redirectToLogin).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Đã đăng xuất',
      });
    });

    it('should force logout successfully', async () => {
      const mockResponse = { data: { message: 'Đăng xuất thành công' } };
      (clientService.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await LogoutService.forceLogout();

      expect(clientService.post).toHaveBeenCalledWith('/api/auth/logout');
      expect(clearAuthTokens).toHaveBeenCalled();
      expect(redirectToLogin).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Đã đăng xuất',
      });
    });

    it('should handle errors in force logout', async () => {
      (clientService.post as jest.Mock).mockRejectedValue(new Error('API Error'));
      (clearAuthTokens as jest.Mock).mockImplementation(() => {
        throw new Error('Clear tokens error');
      });

      const result = await LogoutService.forceLogout();

      expect(clearAuthTokens).toHaveBeenCalled();
      expect(redirectToLogin).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Đã đăng xuất (có lỗi xảy ra)',
      });
    });
  });

  describe('shouldLogout', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    it('should return true if no access token', () => {
      const result = LogoutService.shouldLogout();
      expect(result).toBe(true);
    });

    it('should return true if token is expired', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj3UFYzP5aQN8V7iE3U4Y7jQh9lN0X8X0J0X8X0';
      localStorage.setItem('accessToken', expiredToken);

      const result = LogoutService.shouldLogout();
      expect(result).toBe(true);
    });

    it('should return false if token is valid', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const validToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOiR7fHV0dW1lfQ==.signature`;
      const tokenWithFutureExp = validToken.replace('${futureTime}', futureTime.toString());
      localStorage.setItem('accessToken', tokenWithFutureExp);

      const result = LogoutService.shouldLogout();
      expect(result).toBe(false);
    });

    it('should return true if token is invalid', () => {
      localStorage.setItem('accessToken', 'invalid-token');

      const result = LogoutService.shouldLogout();
      expect(result).toBe(true);
    });
  });

  describe('autoLogoutIfNeeded', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should force logout if token is expired', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj3UFYzP5aQN8V7iE3U4Y7jQh9lN0X8X0J0X8X0';
      localStorage.setItem('accessToken', expiredToken);

      const result = await LogoutService.autoLogoutIfNeeded();

      expect(result).toBe(true);
      expect(clearAuthTokens).toHaveBeenCalled();
      expect(redirectToLogin).toHaveBeenCalled();
    });

    it('should not logout if token is valid', async () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const validToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOiR7fHV0dW1lfQ==.signature`;
      const tokenWithFutureExp = validToken.replace('${futureTime}', futureTime.toString());
      localStorage.setItem('accessToken', tokenWithFutureExp);

      const result = await LogoutService.autoLogoutIfNeeded();

      expect(result).toBe(false);
      expect(clearAuthTokens).not.toHaveBeenCalled();
      expect(redirectToLogin).not.toHaveBeenCalled();
    });

    it('should force logout if no token', async () => {
      const result = await LogoutService.autoLogoutIfNeeded();

      expect(result).toBe(true);
      expect(clearAuthTokens).toHaveBeenCalled();
      expect(redirectToLogin).toHaveBeenCalled();
    });
  });
});