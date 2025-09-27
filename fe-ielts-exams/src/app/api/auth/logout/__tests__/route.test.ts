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
  getAll: jest.fn(),
};

jest.mock('next/headers', () => ({
  cookies: () => mockCookieStore,
}));

// Mock fetch
global.fetch = jest.fn();

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
    mockCookieStore.getAll.mockReturnValue([]);
  });

  it('should successfully logout with valid tokens', async () => {
    const mockBackendResponse = {
      message: 'Logout successful',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBackendResponse),
    });

    mockCookieStore.get.mockImplementation((name: string) => {
      if (name === 'accessToken') return { value: 'valid-access-token' };
      if (name === 'refreshToken') return { value: 'valid-refresh-token' };
      return undefined;
    });

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Đăng xuất thành công');
    expect(data.backendLogoutSuccess).toBe(true);
    expect(data.backendError).toBeNull();

    // Check if fetch was called with correct parameters
    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/v1/auth/signOut', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-access-token',
      },
      body: JSON.stringify({ refreshToken: 'valid-refresh-token' }),
    });

    // Check if cookies were deleted
    expect(mockCookieStore.delete).toHaveBeenCalledWith('accessToken');
    expect(mockCookieStore.delete).toHaveBeenCalledWith('refreshToken');
  });

  it('should handle logout without access token', async () => {
    mockCookieStore.get.mockImplementation((name: string) => {
      if (name === 'accessToken') return undefined;
      if (name === 'refreshToken') return { value: 'valid-refresh-token' };
      return undefined;
    });

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Đăng xuất thành công');
    expect(data.backendLogoutSuccess).toBe(false);
    expect(data.backendError).toBeNull();

    // Should not call fetch if no access token
    expect(fetch).not.toHaveBeenCalled();

    // Should still delete cookies
    expect(mockCookieStore.delete).toHaveBeenCalledWith('accessToken');
    expect(mockCookieStore.delete).toHaveBeenCalledWith('refreshToken');
  });

  it('should handle backend logout failure', async () => {
    const mockErrorResponse = {
      message: 'Invalid token',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve(mockErrorResponse),
    });

    mockCookieStore.get.mockImplementation((name: string) => {
      if (name === 'accessToken') return { value: 'invalid-access-token' };
      if (name === 'refreshToken') return { value: 'valid-refresh-token' };
      return undefined;
    });

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Đăng xuất thành công');
    expect(data.backendLogoutSuccess).toBe(false);
    expect(data.backendError).toBe('Invalid token');

    // Should still delete cookies even if backend fails
    expect(mockCookieStore.delete).toHaveBeenCalledWith('accessToken');
    expect(mockCookieStore.delete).toHaveBeenCalledWith('refreshToken');
  });

  it('should handle network error during backend logout', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    mockCookieStore.get.mockImplementation((name: string) => {
      if (name === 'accessToken') return { value: 'valid-access-token' };
      if (name === 'refreshToken') return { value: 'valid-refresh-token' };
      return undefined;
    });

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Đăng xuất thành công');
    expect(data.backendLogoutSuccess).toBe(false);
    expect(data.backendError).toBe('Network error');

    // Should still delete cookies even if network fails
    expect(mockCookieStore.delete).toHaveBeenCalledWith('accessToken');
    expect(mockCookieStore.delete).toHaveBeenCalledWith('refreshToken');
  });

  it('should delete all auth-related cookies', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Logout successful' }),
    });

    mockCookieStore.get.mockImplementation((name: string) => {
      if (name === 'accessToken') return { value: 'valid-access-token' };
      if (name === 'refreshToken') return { value: 'valid-refresh-token' };
      return undefined;
    });

    // Mock additional auth-related cookies
    mockCookieStore.getAll.mockReturnValue([
      { name: 'accessToken', value: 'token' },
      { name: 'refreshToken', value: 'refresh' },
      { name: 'authToken', value: 'auth' },
      { name: 'userToken', value: 'user' },
      { name: 'sessionId', value: 'session' },
      { name: 'otherCookie', value: 'other' }, // Should not be deleted
    ]);

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);

    expect(response.status).toBe(200);

    // Check if auth-related cookies were deleted
    expect(mockCookieStore.delete).toHaveBeenCalledWith('accessToken');
    expect(mockCookieStore.delete).toHaveBeenCalledWith('refreshToken');
    expect(mockCookieStore.delete).toHaveBeenCalledWith('authToken');
    expect(mockCookieStore.delete).toHaveBeenCalledWith('userToken');
    expect(mockCookieStore.delete).toHaveBeenCalledWith('sessionId');
    
    // Non-auth cookie should not be deleted
    expect(mockCookieStore.delete).not.toHaveBeenCalledWith('otherCookie');
  });

  it('should handle cookie deletion errors', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Logout successful' }),
    });

    mockCookieStore.get.mockImplementation((name: string) => {
      if (name === 'accessToken') return { value: 'valid-access-token' };
      if (name === 'refreshToken') return { value: 'valid-refresh-token' };
      return undefined;
    });

    // Mock cookie deletion error
    mockCookieStore.delete.mockImplementation(() => {
      throw new Error('Cookie deletion failed');
    });

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Đăng xuất thành công (có lỗi khi xóa cookie)');
    expect(data.backendLogoutSuccess).toBe(true);
    expect(data.cookieError).toBe('Cookie deletion failed');
  });

  it('should handle backend error without message', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({}), // No message property
    });

    mockCookieStore.get.mockImplementation((name: string) => {
      if (name === 'accessToken') return { value: 'valid-access-token' };
      if (name === 'refreshToken') return { value: 'valid-refresh-token' };
      return undefined;
    });

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Đăng xuất thành công');
    expect(data.backendLogoutSuccess).toBe(false);
    expect(data.backendError).toBe('Backend logout failed');
  });

  it('should handle non-Error object during network error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce('String error');

    mockCookieStore.get.mockImplementation((name: string) => {
      if (name === 'accessToken') return { value: 'valid-access-token' };
      if (name === 'refreshToken') return { value: 'valid-refresh-token' };
      return undefined;
    });

    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Đăng xuất thành công');
    expect(data.backendLogoutSuccess).toBe(false);
    expect(data.backendError).toBe('String error');
  });
});