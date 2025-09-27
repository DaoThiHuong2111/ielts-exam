import { ErrorHandlingService, useErrorHandler } from '@/services/error-handling.service';
import { renderHook, act } from '@testing-library/react';

// Mock the toast component
jest.mock('@/components/ui/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock window.location
const mockWindowLocation = {
  href: '',
  pathname: '/test',
  search: '',
};
Object.defineProperty(window, 'location', {
  value: mockWindowLocation,
  writable: true,
});

// Mock sessionStorage
const mockSessionStorage = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

describe('ErrorHandlingService', () => {
  let errorService: ErrorHandlingService;

  beforeEach(() => {
    errorService = ErrorHandlingService.getInstance();
    jest.clearAllMocks();
  });

  describe('handleApiError', () => {
    it('should handle API error with response', () => {
      const error = {
        response: {
          data: {
            message: 'Test error message',
            code: 'TEST_ERROR',
          },
          status: 400,
        },
      };

      errorService.handleApiError(error);

      expect(console.error).toHaveBeenCalledWith('API Error:', error);
      expect(require('@/components/ui/toast').toast.error).toHaveBeenCalledWith('Error', 'Test error message');
    });

    it('should handle API error with error property', () => {
      const error = {
        response: {
          data: {
            error: 'Test error message',
            code: 'TEST_ERROR',
          },
          status: 400,
        },
      };

      errorService.handleApiError(error);

      expect(console.error).toHaveBeenCalledWith('API Error:', error);
      expect(require('@/components/ui/toast').toast.error).toHaveBeenCalledWith('Error', 'Test error message');
    });

    it('should handle API error with array of errors', () => {
      const error = {
        response: {
          data: [
            { message: 'First error' },
            { message: 'Second error' },
          ],
          status: 400,
        },
      };

      errorService.handleApiError(error);

      expect(console.error).toHaveBeenCalledWith('API Error:', error);
      expect(require('@/components/ui/toast').toast.error).toHaveBeenCalledWith('Error', 'First error');
    });

    it('should handle network error', () => {
      const error = {
        request: {},
      };

      errorService.handleApiError(error);

      expect(console.error).toHaveBeenCalledWith('API Error:', error);
      expect(require('@/components/ui/toast').toast.error).toHaveBeenCalledWith('Error', 'Network error. Please check your connection.');
    });

    it('should handle error with message property', () => {
      const error = {
        message: 'Test error message',
        code: 'TEST_ERROR',
      };

      errorService.handleApiError(error);

      expect(console.error).toHaveBeenCalledWith('API Error:', error);
      expect(require('@/components/ui/toast').toast.error).toHaveBeenCalledWith('Error', 'Test error message');
    });

    it('should handle string error', () => {
      const error = 'Test error message';

      errorService.handleApiError(error);

      expect(console.error).toHaveBeenCalledWith('API Error:', error);
      expect(require('@/components/ui/toast').toast.error).toHaveBeenCalledWith('Error', 'Test error message');
    });

    it('should handle unknown error', () => {
      const error = null;

      errorService.handleApiError(error);

      expect(console.error).toHaveBeenCalledWith('API Error:', error);
      expect(require('@/components/ui/toast').toast.error).toHaveBeenCalledWith('Error', 'An unexpected error occurred. Please try again.');
    });

    it('should handle custom options', () => {
      const error = {
        response: {
          data: {
            message: 'Test error message',
          },
          status: 400,
        },
      };

      errorService.handleApiError(error, {
        showToast: false,
        logToConsole: false,
        customMessage: 'Custom error message',
      });

      expect(console.error).not.toHaveBeenCalled();
      expect(require('@/components/ui/toast').toast.error).toHaveBeenCalledWith('Error', 'Custom error message');
    });

    it('should handle specific error codes', () => {
      const error = {
        response: {
          data: {
            message: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
          },
          status: 429,
        },
      };

      errorService.handleApiError(error);

      expect(console.error).toHaveBeenCalledWith('API Error:', error);
      expect(require('@/components/ui/toast').toast.error).toHaveBeenCalledWith('Error', 'Rate limit exceeded');
      expect(require('@/components/ui/toast').toast.warning).toHaveBeenCalledWith('Rate Limit', 'Too many requests. Please try again later.');
    });
  });

  describe('handleAuthError', () => {
    it('should handle authentication error and redirect to login', () => {
      const error = {
        response: {
          data: {
            message: 'Unauthorized',
            code: 'UNAUTHORIZED',
          },
          status: 401,
        },
      };

      errorService.handleAuthError(error);

      expect(console.error).toHaveBeenCalledWith('API Error:', error);
      expect(require('@/components/ui/toast').toast.error).toHaveBeenCalledWith('Error', 'Authentication error. Please log in again.');
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('redirectAfterLogin', '/test');
      expect(mockWindowLocation.href).toBe('/login');
    });
  });

  describe('handleNetworkError', () => {
    it('should handle network error', () => {
      const error = {
        request: {},
      };

      errorService.handleNetworkError(error);

      expect(console.error).toHaveBeenCalledWith('API Error:', error);
      expect(require('@/components/ui/toast').toast.error).toHaveBeenCalledWith('Error', 'Network error. Please check your connection and try again.');
    });
  });

  describe('handleValidationError', () => {
    it('should handle validation error', () => {
      const error = {
        response: {
          data: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            errors: {
              email: ['Invalid email format'],
              password: ['Password is too short'],
            },
          },
          status: 422,
        },
      };

      const result = errorService.handleValidationError(error);

      expect(console.error).toHaveBeenCalledWith('Validation Error:', error);
      expect(require('@/components/ui/toast').toast.warning).toHaveBeenCalledWith('Validation Error', 'Please check your input and try again.');
      expect(result).toEqual({
        email: ['Invalid email format'],
        password: ['Password is too short'],
      });
    });
  });

  describe('handleSuccess', () => {
    it('should handle success message', () => {
      errorService.handleSuccess('Operation successful');

      expect(require('@/components/ui/toast').toast.success).toHaveBeenCalledWith('Success', 'Operation successful');
    });
  });

  describe('handleInfo', () => {
    it('should handle info message', () => {
      errorService.handleInfo('Information message');

      expect(require('@/components/ui/toast').toast.info).toHaveBeenCalledWith('Info', 'Information message');
    });
  });

  describe('handleWarning', () => {
    it('should handle warning message', () => {
      errorService.handleWarning('Warning message');

      expect(require('@/components/ui/toast').toast.warning).toHaveBeenCalledWith('Warning', 'Warning message');
    });
  });
});

describe('useErrorHandler', () => {
  it('should provide error handling functions', () => {
    const { result } = renderHook(() => useErrorHandler());

    expect(result.current).toHaveProperty('handleError');
    expect(result.current).toHaveProperty('handleAuthError');
    expect(result.current).toHaveProperty('handleNetworkError');
    expect(result.current).toHaveProperty('handleValidationError');
    expect(result.current).toHaveProperty('showSuccess');
    expect(result.current).toHaveProperty('showInfo');
    expect(result.current).toHaveProperty('showWarning');
  });

  it('should call handleError with error', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = new Error('Test error');

    act(() => {
      result.current.handleError(error);
    });

    expect(console.error).toHaveBeenCalledWith('API Error:', error);
    expect(require('@/components/ui/toast').toast.error).toHaveBeenCalledWith('Error', 'Test error');
  });

  it('should call showSuccess with message', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.showSuccess('Success message');
    });

    expect(require('@/components/ui/toast').toast.success).toHaveBeenCalledWith('Success', 'Success message');
  });
});