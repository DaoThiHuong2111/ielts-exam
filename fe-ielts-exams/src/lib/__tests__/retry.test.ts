import { withRetry, retryApiCall, createRetryInterceptor } from '@/lib/retry';

// Mock setTimeout
jest.useFakeTimers();

describe('Retry Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('withRetry', () => {
    it('should return result on first success', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await withRetry(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and return result', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValue('success');
      
      const result = await withRetry(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should retry with exponential backoff', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');
      
      const promise = withRetry(mockFn, { delayMs: 1000, backoffFactor: 2 });
      
      // First attempt fails immediately
      await Promise.resolve();
      
      // Fast forward to first retry (1000ms)
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      // Fast forward to second retry (2000ms)
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
      
      const result = await promise;
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max attempts', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Persistent failure'));
      
      await expect(withRetry(mockFn, { maxAttempts: 3 })).rejects.toThrow('Persistent failure');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should not retry if retryCondition returns false', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Non-retryable error'));
      const retryCondition = jest.fn().mockReturnValue(false);
      
      await expect(withRetry(mockFn, { retryCondition })).rejects.toThrow('Non-retryable error');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(retryCondition).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should use default options', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValue('success');
      
      const result = await withRetry(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('retryApiCall', () => {
    it('should retry on network errors', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce({ code: 'ENOTFOUND' })
        .mockResolvedValue('success');
      
      const result = await retryApiCall(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should retry on 5xx server errors', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockResolvedValue('success');
      
      const result = await retryApiCall(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should retry on 429 Too Many Requests', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce({ response: { status: 429 } })
        .mockResolvedValue('success');
      
      const result = await retryApiCall(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should retry on 502 Bad Gateway', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce({ response: { status: 502 } })
        .mockResolvedValue('success');
      
      const result = await retryApiCall(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should retry on 503 Service Unavailable', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockResolvedValue('success');
      
      const result = await retryApiCall(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should retry on 504 Gateway Timeout', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce({ response: { status: 504 } })
        .mockResolvedValue('success');
      
      const result = await retryApiCall(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 4xx client errors', async () => {
      const mockFn = jest.fn().mockRejectedValue({ response: { status: 400 } });
      
      await expect(retryApiCall(mockFn)).rejects.toEqual({ response: { status: 400 } });
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should use custom retry condition', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce({ response: { status: 400 } })
        .mockResolvedValue('success');
      const retryCondition = jest.fn().mockReturnValue(true);
      
      const result = await retryApiCall(mockFn, { retryCondition });
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(retryCondition).toHaveBeenCalledWith({ response: { status: 400 } });
    });
  });

  describe('createRetryInterceptor', () => {
    it('should create interceptor that retries on retryable errors', async () => {
      const mockAxios = jest.fn();
      const mockConfig = { axios: mockAxios, _retry: false };
      const error = { config: mockConfig, code: 'ENOTFOUND' };
      
      const interceptor = createRetryInterceptor();
      
      // Mock the delay
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return null as any;
      });
      
      const result = interceptor(error);
      
      expect(mockConfig._retry).toBe(true);
      expect(mockAxios).toHaveBeenCalledWith(mockConfig);
    });

    it('should not retry if already retried', async () => {
      const mockConfig = { _retry: true };
      const error = { config: mockConfig, code: 'ENOTFOUND' };
      
      const interceptor = createRetryInterceptor();
      
      await expect(interceptor(error)).rejects.toEqual(error);
    });

    it('should not retry if no config', async () => {
      const error = { code: 'ENOTFOUND' };
      
      const interceptor = createRetryInterceptor();
      
      await expect(interceptor(error)).rejects.toEqual(error);
    });

    it('should not retry if error does not meet retry condition', async () => {
      const mockConfig = { _retry: false };
      const error = { config: mockConfig, response: { status: 400 } };
      
      const interceptor = createRetryInterceptor();
      
      await expect(interceptor(error)).rejects.toEqual(error);
    });

    it('should use custom retry options', async () => {
      const mockAxios = jest.fn();
      const mockConfig = { axios: mockAxios, _retry: false, _retryCount: 2 };
      const error = { config: mockConfig, code: 'ENOTFOUND' };
      
      const interceptor = createRetryInterceptor({
        maxAttempts: 5,
        delayMs: 2000,
        backoffFactor: 3,
      });
      
      // Mock the delay
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return null as any;
      });
      
      const result = interceptor(error);
      
      expect(mockConfig._retry).toBe(true);
      expect(mockConfig._retryCount).toBe(3);
      expect(mockAxios).toHaveBeenCalledWith(mockConfig);
    });
  });
});