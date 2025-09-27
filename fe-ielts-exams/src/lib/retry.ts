/**
 * Retry utility for network failures
 */

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
}

const defaultRetryOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffFactor: 2,
  retryCondition: (error) => {
    // Retry on network errors or 5xx server errors
    return (
      !error.response ||
      (error.response?.status >= 500 && error.response?.status < 600) ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNRESET'
    );
  },
};

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...defaultRetryOptions, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!config.retryCondition(error) || attempt === config.maxAttempts) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = config.delayMs * Math.pow(config.backoffFactor, attempt - 1);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Retry an API call with exponential backoff
 */
export async function retryApiCall<T>(
  apiCall: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(apiCall, {
    ...options,
    retryCondition: (error) => {
      // Default retry condition for API calls
      if (options.retryCondition) {
        return options.retryCondition(error);
      }
      
      return (
        !error.response || // Network error
        error.response?.status === 429 || // Too Many Requests
        error.response?.status === 502 || // Bad Gateway
        error.response?.status === 503 || // Service Unavailable
        error.response?.status === 504 || // Gateway Timeout
        error.code === 'ECONNABORTED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ECONNRESET'
      );
    },
  });
}

/**
 * Create a retry wrapper for axios requests
 */
export function createRetryInterceptor(options: RetryOptions = {}) {
  return async (error: any) => {
    const { config } = error;
    
    // Check if this request should be retried
    if (!config || config._retry) {
      return Promise.reject(error);
    }

    const retryOptions = { ...defaultRetryOptions, ...options };
    
    // Check if we should retry this error
    if (!retryOptions.retryCondition(error)) {
      return Promise.reject(error);
    }

    // Set retry flag
    config._retry = true;
    
    // Calculate delay with exponential backoff
    const attempt = config._retryCount || 0;
    const delay = retryOptions.delayMs * Math.pow(retryOptions.backoffFactor, attempt);
    config._retryCount = attempt + 1;
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry the request
    return config.axios(config);
  };
}