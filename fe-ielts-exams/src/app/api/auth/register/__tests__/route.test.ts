import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock environment variables
process.env.BACKEND_API_URL = 'http://localhost:3001';
process.env.NODE_ENV = 'test';

// Mock fetch
global.fetch = jest.fn();

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should successfully register a user and set cookies', async () => {
    const mockBackendResponse = {
      auth: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      },
      user: {
        id: 'user-id-123',
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBackendResponse),
    });

    const requestBody = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Đăng ký thành công');
    expect(data.user).toEqual(mockBackendResponse.user);
    expect(data.auth).toEqual(mockBackendResponse.auth);

    // Check if fetch was called with correct parameters
    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Check if cookies are set
    const setCookieHeaders = response.headers.get('set-cookie');
    expect(setCookieHeaders).toContain('accessToken=mock-access-token');
    expect(setCookieHeaders).toContain('refreshToken=mock-refresh-token');
    expect(setCookieHeaders).toContain('HttpOnly');
    expect(setCookieHeaders).toContain('SameSite=strict');
  });

  it('should handle backend error response', async () => {
    const mockErrorResponse = {
      message: 'Email đã được sử dụng',
      error: 'CONFLICT',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve(mockErrorResponse),
    });

    const requestBody = {
      name: 'Test User',
      email: 'existing@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.message).toBe('Email đã được sử dụng');
    expect(data.error).toBe('CONFLICT');
    expect(data.statusCode).toBe(409);
  });

  it('should handle network error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const requestBody = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Lỗi đăng ký');
    expect(data.error).toBe('NETWORK_ERROR');
  });

  it('should handle backend error without specific message', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({}),
    });

    const requestBody = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Lỗi đăng ký');
  });

  it('should set secure cookies in production environment', async () => {
    // Set production environment
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const mockBackendResponse = {
      auth: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      },
      user: {
        id: 'user-id-123',
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBackendResponse),
    });

    const requestBody = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const setCookieHeaders = response.headers.get('set-cookie');

    // Check if secure flag is set in production
    expect(setCookieHeaders).toContain('Secure');

    // Restore original environment
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should not set secure cookies in development environment', async () => {
    // Set development environment
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const mockBackendResponse = {
      auth: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      },
      user: {
        id: 'user-id-123',
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBackendResponse),
    });

    const requestBody = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const setCookieHeaders = response.headers.get('set-cookie');

    // Check if secure flag is not set in development
    expect(setCookieHeaders).not.toContain('Secure');

    // Restore original environment
    process.env.NODE_ENV = originalNodeEnv;
  });
});