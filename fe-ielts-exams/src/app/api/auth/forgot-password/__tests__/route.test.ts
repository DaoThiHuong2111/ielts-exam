import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock environment variables
process.env.BACKEND_API_URL = 'http://localhost:3001';
process.env.NODE_ENV = 'test';

// Mock fetch
global.fetch = jest.fn();

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should successfully send forgot password email', async () => {
    const mockBackendResponse = {
      message: 'Email đặt lại mật khẩu đã được gửi',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBackendResponse),
    });

    const requestBody = {
      email: 'test@example.com',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Email đặt lại mật khẩu đã được gửi thành công');
    expect(data.data).toEqual(mockBackendResponse);

    // Check if fetch was called with correct parameters
    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
  });

  it('should handle backend error response', async () => {
    const mockErrorResponse = {
      message: 'Email không tồn tại trong hệ thống',
      error: 'USER_NOT_FOUND',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve(mockErrorResponse),
    });

    const requestBody = {
      email: 'nonexistent@example.com',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toBe('Email không tồn tại trong hệ thống');
    expect(data.error).toBe('USER_NOT_FOUND');
    expect(data.statusCode).toBe(404);
  });

  it('should handle network error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const requestBody = {
      email: 'test@example.com',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Gửi yêu cầu đặt lại mật khẩu thất bại');
    expect(data.error).toBe('NETWORK_ERROR');
  });

  it('should handle backend error without specific message', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({}),
    });

    const requestBody = {
      email: 'test@example.com',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Gửi yêu cầu đặt lại mật khẩu thất bại');
  });

  it('should handle different backend error status codes', async () => {
    const mockErrorResponse = {
      message: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
      error: 'TOO_MANY_REQUESTS',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: () => Promise.resolve(mockErrorResponse),
    });

    const requestBody = {
      email: 'test@example.com',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.message).toBe('Quá nhiều yêu cầu, vui lòng thử lại sau');
    expect(data.error).toBe('TOO_MANY_REQUESTS');
    expect(data.statusCode).toBe(429);
  });
});