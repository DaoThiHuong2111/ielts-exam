// app/api/auth/logout/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://backend:8228';

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;

  let backendLogoutSuccess = false;
  let backendError = null;

  try {
    // Gọi backend logout để thu hồi tokens
    if (accessToken) {
      const response = await fetch(`${BACKEND_API_URL}/v1/auth/signOut`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        // Gửi cả refresh token để backend có thể thu hồi nó
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        backendLogoutSuccess = true;
      } else {
        const errorData = await response.json();
        backendError = errorData?.message || 'Backend logout failed';
        console.warn('Backend logout failed:', backendError);
      }
    }
  } catch (err) {
    backendError = err instanceof Error ? err.message : 'Network error during logout';
    console.warn('Gọi logout backend thất bại:', backendError);
  }

  try {
    // Xóa cookie token khỏi trình duyệt
    cookieStore.delete('accessToken');
    cookieStore.delete('refreshToken');

    // Xóa các cookie khác liên quan đến authentication nếu có
    const allCookies = cookieStore.getAll();
    allCookies.forEach(cookie => {
      if (cookie.name.includes('token') || cookie.name.includes('auth')) {
        cookieStore.delete(cookie.name);
      }
    });

    return NextResponse.json({
      message: 'Đăng xuất thành công',
      backendLogoutSuccess,
      backendError: backendError || null
    });
  } catch (cookieError) {
    console.error('Error clearing cookies:', cookieError);
    return NextResponse.json({
      message: 'Đăng xuất thành công (có lỗi khi xóa cookie)',
      backendLogoutSuccess,
      backendError: backendError || null,
      cookieError: cookieError instanceof Error ? cookieError.message : 'Unknown cookie error'
    });
  }
}
