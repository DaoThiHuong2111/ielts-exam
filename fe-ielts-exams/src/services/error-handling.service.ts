import { toast } from '@/components/ui/toast';

export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
  status?: number;
}

export interface ErrorHandlingOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  customMessage?: string;
  fallbackMessage?: string;
}

/**
 * Error Handling Service
 * Provides centralized error handling for the application
 */
export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private defaultOptions: ErrorHandlingOptions = {
    showToast: true,
    logToConsole: true,
    fallbackMessage: 'An unexpected error occurred. Please try again.',
  };

  private constructor() {}

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Handle API errors
   */
  public handleApiError(error: any, options: ErrorHandlingOptions = {}): void {
    const finalOptions = { ...this.defaultOptions, ...options };
    
    // Parse the error
    const apiError = this.parseApiError(error);
    
    // Log to console if enabled
    if (finalOptions.logToConsole) {
      console.error('API Error:', error);
    }
    
    // Show toast notification if enabled
    if (finalOptions.showToast) {
      const message = finalOptions.customMessage || apiError.message || finalOptions.fallbackMessage;
      toast.error('Error', message);
    }
    
    // Handle specific error codes
    this.handleSpecificErrorCodes(apiError);
  }

  /**
   * Handle authentication errors
   */
  public handleAuthError(error: any, options: ErrorHandlingOptions = {}): void {
    const finalOptions = { 
      ...this.defaultOptions, 
      ...options,
      customMessage: options.customMessage || 'Authentication error. Please log in again.',
    };
    
    this.handleApiError(error, finalOptions);
    
    // Redirect to login page if authentication error
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search;
      sessionStorage.setItem('redirectAfterLogin', currentPath);
      window.location.href = '/login';
    }
  }

  /**
   * Handle network errors
   */
  public handleNetworkError(error: any, options: ErrorHandlingOptions = {}): void {
    const finalOptions = { 
      ...this.defaultOptions, 
      ...options,
      customMessage: options.customMessage || 'Network error. Please check your connection and try again.',
    };
    
    this.handleApiError(error, finalOptions);
  }

  /**
   * Handle validation errors
   */
  public handleValidationError(error: any, options: ErrorHandlingOptions = {}): Record<string, string[]> {
    const finalOptions = { 
      ...this.defaultOptions, 
      ...options,
      customMessage: options.customMessage || 'Please check your input and try again.',
    };
    
    const apiError = this.parseApiError(error);
    
    // Log to console if enabled
    if (finalOptions.logToConsole) {
      console.error('Validation Error:', error);
    }
    
    // Show toast notification if enabled
    if (finalOptions.showToast) {
      const message = finalOptions.customMessage || apiError.message || finalOptions.fallbackMessage;
      toast.warning('Validation Error', message);
    }
    
    return apiError.errors || {};
  }

  /**
   * Handle success messages
   */
  public handleSuccess(message: string, description?: string): void {
    toast.success('Success', message);
  }

  /**
   * Handle info messages
   */
  public handleInfo(message: string, description?: string): void {
    toast.info('Info', message);
  }

  /**
   * Handle warning messages
   */
  public handleWarning(message: string, description?: string): void {
    toast.warning('Warning', message);
  }

  /**
   * Parse API error to standard format
   */
  private parseApiError(error: any): ApiError {
    if (!error) {
      return { message: this.defaultOptions.fallbackMessage! };
    }

    // Handle Axios errors
    if (error.response) {
      const { data, status } = error.response;
      
      // Handle different response formats
      if (data) {
        if (data.message) {
          return {
            message: data.message,
            code: data.code,
            errors: data.errors,
            status,
          };
        }
        
        if (data.error) {
          return {
            message: data.error,
            code: data.code,
            errors: data.errors,
            status,
          };
        }
        
        // Handle array of errors
        if (Array.isArray(data) && data.length > 0) {
          return {
            message: data[0].message || data[0],
            status,
          };
        }
      }
      
      return {
        message: `Request failed with status ${status}`,
        status,
      };
    }

    // Handle network errors
    if (error.request) {
      return {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      };
    }

    // Handle other errors
    if (error.message) {
      return {
        message: error.message,
        code: error.code,
      };
    }

    // Handle string errors
    if (typeof error === 'string') {
      return {
        message: error,
      };
    }

    return {
      message: this.defaultOptions.fallbackMessage!,
    };
  }

  /**
   * Handle specific error codes
   */
  private handleSpecificErrorCodes(error: ApiError): void {
    switch (error.code) {
      case 'UNAUTHORIZED':
      case 'INVALID_TOKEN':
      case 'TOKEN_EXPIRED':
        // This is handled by handleAuthError
        break;
      
      case 'FORBIDDEN':
        if (typeof window !== 'undefined') {
          window.location.href = '/unauthorized';
        }
        break;
      
      case 'NOT_FOUND':
        if (typeof window !== 'undefined') {
          window.location.href = '/not-found';
        }
        break;
      
      case 'RATE_LIMIT_EXCEEDED':
        toast.warning('Rate Limit', 'Too many requests. Please try again later.');
        break;
      
      case 'MAINTENANCE_MODE':
        toast.info('Maintenance', 'The system is currently under maintenance. Please try again later.');
        break;
      
      default:
        // No specific handling for other error codes
        break;
    }
  }
}

/**
 * Hook for error handling
 */
export function useErrorHandler() {
  const errorService = ErrorHandlingService.getInstance();

  const handleError = (error: any, options?: ErrorHandlingOptions) => {
    errorService.handleApiError(error, options);
  };

  const handleAuthError = (error: any, options?: ErrorHandlingOptions) => {
    errorService.handleAuthError(error, options);
  };

  const handleNetworkError = (error: any, options?: ErrorHandlingOptions) => {
    errorService.handleNetworkError(error, options);
  };

  const handleValidationError = (error: any, options?: ErrorHandlingOptions) => {
    return errorService.handleValidationError(error, options);
  };

  const showSuccess = (message: string, description?: string) => {
    errorService.handleSuccess(message, description);
  };

  const showInfo = (message: string, description?: string) => {
    errorService.handleInfo(message, description);
  };

  const showWarning = (message: string, description?: string) => {
    errorService.handleWarning(message, description);
  };

  return {
    handleError,
    handleAuthError,
    handleNetworkError,
    handleValidationError,
    showSuccess,
    showInfo,
    showWarning,
  };
}