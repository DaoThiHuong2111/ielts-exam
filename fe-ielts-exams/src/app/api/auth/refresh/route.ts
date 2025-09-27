// app/api/auth/refresh/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { appConfig } from '@/config/app.config';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;
    
    if (!refreshToken) {
      return NextResponse.json({
        message: 'Không có refresh token',
        error: 'NO_REFRESH_TOKEN'
      }, { status: 401 });
    }
    
    const response = await fetch(`${appConfig.api.baseUrl}/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      // Xóa token nếu refresh thất bại
      cookieStore.delete('refreshToken');
      cookieStore.delete('accessToken');
      
      const errorData = await response.json();
      
      // Xử lý các loại lỗi cụ thể
      if (response.status === 401) {
        return NextResponse.json({
          message: 'Refresh token không hợp lệ hoặc đã hết hạn',
          error: 'INVALID_REFRESH_TOKEN'
        }, { status: 401 });
      }
      
      if (response.status === 403) {
        return NextResponse.json({
          message: 'Không có quyền truy cập',
          error: 'FORBIDDEN'
        }, { status: 403 });
      }
      
      if (response.status === 404) {
        return NextResponse.json({
          message: 'Người dùng không tồn tại',
          error: 'USER_NOT_FOUND'
        }, { status: 404 });
      }
      
      throw new Error(errorData?.message || 'Refresh thất bại');
    }

    const resData = await response.json();
    const { access_token, refresh_token } = resData?.data;

    if (!access_token) {
      return NextResponse.json({
        message: 'Không nhận được access token mới',
        error: 'NO_ACCESS_TOKEN'
      }, { status: 500 });
    }

    // Thiết lập cookie với các tùy chọn bảo mật tốt hơn
    const isProduction = process.env.NODE_ENV === 'production';
    
    cookieStore.set('accessToken', access_token, {
      httpOnly: true, // Bảo mật: không cho phép JavaScript truy cập
      secure: isProduction, // Chỉ gửi qua HTTPS trong production
      path: '/',
      maxAge: 60 * 15, // 15 phút
      sameSite: 'lax', // Bảo vệ chống CSRF
    });
    
    // Chỉ cập nhật refresh token nếu có token mới
    if (refresh_token) {
      cookieStore.set('refreshToken', refresh_token, {
        httpOnly: true, // Bảo mật: không cho phép JavaScript truy cập
        secure: isProduction, // Chỉ gửi qua HTTPS trong production
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 ngày
        sameSite: 'lax', // Bảo vệ chống CSRF
      });
    }
    
    return NextResponse.json({
      message: 'Token đã được làm mới thành công',
      accessToken: access_token,
      expiresIn: 60 * 15 // 15 phút
    });
  } catch (err: any) {
    // Xóa token nếu có lỗi
    const cookieStore = await cookies();
    cookieStore.delete('refreshToken');
    cookieStore.delete('accessToken');
    
    return NextResponse.json({
      message: err.message || 'Refresh token thất bại',
      error: 'REFRESH_FAILED'
    }, { status: 401 });
  }
}