import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock environment variables
process.env.BACKEND_API_URL = 'http://localhost:3001';
process.env.NODE_ENV = 'test';

// Mock cookies
const mockCookieStore = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
};

jest.mock('next/headers', () => ({
  cookies: () => mockCookieStore,
}));

// Mock fetch
global.fetch = jest.fn();

describe('POST /api/auth/refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('should successfully refresh tokens', async () => {
    const mockBackendResponse = {
      data: {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBackendResponse),
    });

    mockCookieStore.get.mockReturnValue({ value: 'valid-refresh-token' });

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Token đã được làm mới thành công');
    expect(data.accessToken).toBe('new-access-token');
    expect(data.expiresIn).toBe(60 * 15);

    // Check if fetch was called with correct parameters
    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/v1/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-refresh-token',
      },
    });

    // Check if cookies were set correctly
    expect(mockCookieStore.set).toHaveBeenCalledWith('accessToken', 'new-access-token', {
      httpOnly: false,
      secure: false,
      path: '/',
      maxAge: 60 * 15,
      sameSite: 'lax',
    });

    expect(mockCookieStore.set).toHaveBeenCalledWith('refreshToken', 'new-refresh-token', {
      httpOnly: false,
      secure: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });
  });

  it('should handle missing refresh token', async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe('Không có refresh token');
    expect(data.error).toBe('NO_REFRESH_TOKEN');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should handle invalid refresh token (401)', async () => {
    const mockErrorResponse = {
      message: 'Refresh token không hợp lệ',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve(mockErrorResponse),
    });

    mockCookieStore.get.mockReturnValue({ value: 'invalid-refresh-token' });

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe('Refresh token không hợp lệ hoặc đã hết hạn');
    expect(data.error).toBe('INVALID_REFRESH_TOKEN');

    // Check if cookies were deleted
    expect(mockCookieStore.delete).toHaveBeenCalledWith('refreshToken');
    expect(mockCookieStore.delete).toHaveBeenCalledWith('accessToken');
  });

  it('should handle forbidden error (403)', async () => {
    const mockErrorResponse = {
      message: 'Không có quyền truy cập',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve(mockErrorResponse),
    });

    mockCookieStore.get.mockReturnValue({ value: 'forbidden-refresh-token' });

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.message).toBe('Không có quyền truy cập');
    expect(data.error).toBe('FORBIDDEN');

    // Check if cookies were deleted
    expect(mockCookieStore.delete).toHaveBeenCalledWith('refreshToken');
    expect(mockCookieStore.delete).toHaveBeenCalledWith('accessToken');
  });

  it('should handle user not found error (404)', async () => {
    const mockErrorResponse = {
      message: 'Người dùng không tồn tại',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve(mockErrorResponse),
    });

    mockCookieStore.get.mockReturnValue({ value: 'user-not-found-token' });

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toBe('Người dùng không tồn tại');
    expect(data.error).toBe('USER_NOT_FOUND');

    // Check if cookies were deleted
    expect(mockCookieStore.delete).toHaveBeenCalledWith('refreshToken');
    expect(mockCookieStore.delete).toHaveBeenCalledWith('accessToken');
  });

  it('should handle missing access token in response', async () => {
    const mockBackendResponse = {
      data: {
        // Missing access_token
        refresh_token: 'new-refresh-token',
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBackendResponse),
    });

    mockCookieStore.get.mockReturnValue({ value: 'valid-refresh-token' });

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Không nhận được access token mới');
    expect(data.error).toBe('NO_ACCESS_TOKEN');
  });

  it('should handle network error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    mockCookieStore.get.mockReturnValue({ value: 'valid-refresh-token' });

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe('Refresh token thất bại');
    expect(data.error).toBe('REFRESH_FAILED');

    // Check if cookies were deleted
    expect(mockCookieStore.delete).toHaveBeenCalledWith('refreshToken');
    expect(mockCookieStore.delete).toHaveBeenCalledWith('accessToken');
  });

  it('should handle backend error without specific message', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({}),
    });

    mockCookieStore.get.mockReturnValue({ value: 'valid-refresh-token' });

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe('Refresh token thất bại');
    expect(data.error).toBe('REFRESH_FAILED');

    // Check if cookies were deleted
    expect(mockCookieStore.delete).toHaveBeenCalledWith('refreshToken');
    expect(mockCookieStore.delete).toHaveBeenCalledWith('accessToken');
  });

  it('should use secure cookies in production', async () => {
    process.env.NODE_ENV = 'production';

    const mockBackendResponse = {
      data: {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBackendResponse),
    });

    mockCookieStore.get.mockReturnValue({ value: 'valid-refresh-token' });

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
    });

    await POST(request);

    // Check if cookies were set with secure flag
    expect(mockCookieStore.set).toHaveBeenCalledWith('accessToken', 'new-access-token', {
      httpOnly: false,
      secure: true,
      path: '/',
      maxAge: 60 * 15,
      sameSite: 'lax',
    });

    expect(mockCookieStore.set).toHaveBeenCalledWith('refreshToken', 'new-refresh-token', {
      httpOnly: false,
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    process.env.NODE_ENV = 'test';
  });

  it('should not set refresh token if not provided in response', async () => {
    const mockBackendResponse = {
      data: {
        access_token: 'new-access-token',
        // No refresh_token
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBackendResponse),
    });

    mockCookieStore.get.mockReturnValue({ value: 'valid-refresh-token' });

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
    });

    await POST(request);

    // Check if only access token was set
    expect(mockCookieStore.set).toHaveBeenCalledWith('accessToken', 'new-access-token', expect.any(Object));
    expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
  });
});