import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock environment variables
process.env.BACKEND_API_URL = 'http://localhost:3001';
process.env.NODE_ENV = 'test';

// Mock fetch
global.fetch = jest.fn();

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should successfully reset password', async () => {
    const mockBackendResponse = {
      message: 'Đặt lại mật khẩu thành công',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBackendResponse),
    });

    const requestBody = {
      password: 'newpassword123',
      confirmPassword: 'newpassword123',
      token: 'test-reset-token-123',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Đặt lại mật khẩu thành công');
    expect(data.data).toEqual(mockBackendResponse);

    // Check if fetch was called with correct parameters
    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
  });

  it('should handle invalid token error', async () => {
    const mockErrorResponse = {
      message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
      error: 'INVALID_TOKEN',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve(mockErrorResponse),
    });

    const requestBody = {
      password: 'newpassword123',
      confirmPassword: 'newpassword123',
      token: 'invalid-token',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toBe('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
    expect(data.error).toBe('INVALID_TOKEN');
    expect(data.statusCode).toBe(404);
  });

  it('should handle network error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const requestBody = {
      password: 'newpassword123',
      confirmPassword: 'newpassword123',
      token: 'test-reset-token-123',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Đặt lại mật khẩu thất bại');
    expect(data.error).toBe('NETWORK_ERROR');
  });

  it('should handle backend error without specific message', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({}),
    });

    const requestBody = {
      password: 'newpassword123',
      confirmPassword: 'newpassword123',
      token: 'test-reset-token-123',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Đặt lại mật khẩu thất bại');
  });

  it('should handle password validation error from backend', async () => {
    const mockErrorResponse = {
      message: 'Mật khẩu mới không được trùng với mật khẩu cũ',
      error: 'PASSWORD_SAME_AS_OLD',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve(mockErrorResponse),
    });

    const requestBody = {
      password: 'oldpassword123',
      confirmPassword: 'oldpassword123',
      token: 'test-reset-token-123',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Mật khẩu mới không được trùng với mật khẩu cũ');
    expect(data.error).toBe('PASSWORD_SAME_AS_OLD');
    expect(data.statusCode).toBe(400);
  });

  it('should handle expired token error', async () => {
    const mockErrorResponse = {
      message: 'Token đã hết hạn, vui lòng yêu cầu đặt lại mật khẩu mới',
      error: 'TOKEN_EXPIRED',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 410,
      json: () => Promise.resolve(mockErrorResponse),
    });

    const requestBody = {
      password: 'newpassword123',
      confirmPassword: 'newpassword123',
      token: 'expired-token',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.message).toBe('Token đã hết hạn, vui lòng yêu cầu đặt lại mật khẩu mới');
    expect(data.error).toBe('TOKEN_EXPIRED');
    expect(data.statusCode).toBe(410);
  });
});