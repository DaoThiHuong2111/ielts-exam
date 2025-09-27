import axios from 'axios';
import { clientService } from '../axios';
import {
  getAccessToken,
  isTokenExpired,
  clearAuthTokens,
  saveTokens,
} from '../token-utils';

// Mock token utilities
jest.mock('../token-utils', () => ({
  getAccessToken: jest.fn(),
  isTokenExpired: jest.fn(),
  clearAuthTokens: jest.fn(),
  saveTokens: jest.fn(),
  redirectToLogin: jest.fn(),
}));

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock environment variable
Object.defineProperty(process, 'env', {
  value: {
    BACKEND_API_URL: 'http://localhost:3001',
    NODE_ENV: 'test',
  },
  writable: true,
});

describe('Axios Interceptor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset axios mock
    mockedAxios.create.mockReturnValue(clientService);
    mockedAxios.post.mockClear();
    
    // Mock successful response by default
    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: { accessToken: 'new-access-token' },
    });
  });

  describe('Request Interceptor', () => {
    it('should add Authorization header if access token exists', async () => {
      (getAccessToken as jest.Mock).mockReturnValue('valid-token');
      (isTokenExpired as jest.Mock).mockReturnValue(false);

      const config = { headers: {} };
      const requestInterceptor = clientService.interceptors.request.handlers[0].fulfilled;
      const result = await requestInterceptor(config);

      expect(result.headers.Authorization).toBe('Bearer valid-token');
    });

    it('should not add Authorization header if no access token', async () => {
      (getAccessToken as jest.Mock).mockReturnValue(null);

      const config = { headers: {} };
      const requestInterceptor = clientService.interceptors.request.handlers[0].fulfilled;
      const result = await requestInterceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should attempt token refresh if token is expired', async () => {
      (getAccessToken as jest.Mock).mockReturnValue('expired-token');
      (isTokenExpired as jest.Mock).mockReturnValue(true);

      const config = { headers: {} };
      const requestInterceptor = clientService.interceptors.request.handlers[0].fulfilled;
      await requestInterceptor(config);

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/refresh', {}, { withCredentials: true });
    });

    it('should clear tokens and redirect if refresh fails during request', async () => {
      (getAccessToken as jest.Mock).mockReturnValue('expired-token');
      (isTokenExpired as jest.Mock).mockReturnValue(true);
      mockedAxios.post.mockRejectedValue(new Error('Refresh failed'));

      const config = { headers: {} };
      const requestInterceptor = clientService.interceptors.request.handlers[0].fulfilled;
      await requestInterceptor(config);

      expect(clearAuthTokens).toHaveBeenCalled();
    });
  });

  describe('Response Interceptor', () => {
    it('should return response if successful', async () => {
      const response = { data: { success: true }, status: 200 };
      const responseInterceptor = clientService.interceptors.response.handlers[0].fulfilled;
      const result = await responseInterceptor(response);

      expect(result).toBe(response);
    });

    it('should retry request with 401 error', async () => {
      (getAccessToken as jest.Mock).mockReturnValue('new-token');
      
      const originalRequest = {
        headers: {},
        _retry: false,
      };

      const error = {
        config: originalRequest,
        response: { status: 401 },
      };

      const responseInterceptor = clientService.interceptors.response.handlers[0].rejected;
      
      // Mock the retry request to succeed
      const mockRetryResponse = { data: { success: true } };
      clientService.request = jest.fn().mockResolvedValue(mockRetryResponse);

      const result = await responseInterceptor(error);

      expect(result).toBe(mockRetryResponse);
      expect(originalRequest._retry).toBe(true);
    });

    it('should not retry if already retried', async () => {
      const originalRequest = {
        headers: {},
        _retry: true,
      };

      const error = {
        config: originalRequest,
        response: { status: 401 },
      };

      const responseInterceptor = clientService.interceptors.response.handlers[0].rejected;
      
      await expect(responseInterceptor(error)).rejects.toThrow(error);
    });

    it('should clear tokens and redirect on 403 error', async () => {
      const error = {
        config: { headers: {} },
        response: { status: 403 },
      };

      const responseInterceptor = clientService.interceptors.response.handlers[0].rejected;
      
      await expect(responseInterceptor(error)).rejects.toThrow(error);
      expect(clearAuthTokens).toHaveBeenCalled();
    });

    it('should handle multiple requests during token refresh', async () => {
      (getAccessToken as jest.Mock).mockReturnValue('new-token');
      
      // Create two requests that will fail with 401
      const originalRequest1 = {
        headers: {},
        _retry: false,
      };

      const originalRequest2 = {
        headers: {},
        _retry: false,
      };

      const error1 = {
        config: originalRequest1,
        response: { status: 401 },
      };

      const error2 = {
        config: originalRequest2,
        response: { status: 401 },
      };

      const responseInterceptor = clientService.interceptors.response.handlers[0].rejected;
      
      // Mock the retry requests
      const mockRetryResponse1 = { data: { success: true, id: 1 } };
      const mockRetryResponse2 = { data: { success: true, id: 2 } };
      
      clientService.request = jest.fn()
        .mockResolvedValueOnce(mockRetryResponse1)
        .mockResolvedValueOnce(mockRetryResponse2);

      // Process both errors
      const result1 = responseInterceptor(error1);
      const result2 = responseInterceptor(error2);

      // Wait for both to complete
      const [finalResult1, finalResult2] = await Promise.all([result1, result2]);

      expect(finalResult1).toBe(mockRetryResponse1);
      expect(finalResult2).toBe(mockRetryResponse2);
      expect(originalRequest1._retry).toBe(true);
      expect(originalRequest2._retry).toBe(true);
    });

    it('should reject all queued requests if refresh fails', async () => {
      const originalRequest1 = {
        headers: {},
        _retry: false,
      };

      const originalRequest2 = {
        headers: {},
        _retry: false,
      };

      const error1 = {
        config: originalRequest1,
        response: { status: 401 },
      };

      const error2 = {
        config: originalRequest2,
        response: { status: 401 },
      };

      const responseInterceptor = clientService.interceptors.response.handlers[0].rejected;
      
      // Mock refresh to fail
      mockedAxios.post.mockRejectedValue(new Error('Refresh failed'));

      // Process both errors
      const result1 = responseInterceptor(error1);
      const result2 = responseInterceptor(error2);

      // Wait for both to complete
      await expect(Promise.all([result1, result2])).rejects.toThrow('Refresh failed');
      expect(clearAuthTokens).toHaveBeenCalled();
    });

    it('should save new tokens after successful refresh', async () => {
      (getAccessToken as jest.Mock).mockReturnValue('new-token');
      
      const originalRequest = {
        headers: {},
        _retry: false,
      };

      const error = {
        config: originalRequest,
        response: { status: 401 },
      };

      const responseInterceptor = clientService.interceptors.response.handlers[0].rejected;
      
      // Mock the retry request to succeed
      const mockRetryResponse = { data: { success: true } };
      clientService.request = jest.fn().mockResolvedValue(mockRetryResponse);

      await responseInterceptor(error);

      expect(saveTokens).toHaveBeenCalledWith('new-access-token');
    });
  });
});