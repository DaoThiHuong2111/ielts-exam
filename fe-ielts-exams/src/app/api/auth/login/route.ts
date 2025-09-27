// app/api/auth/login/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { appConfig } from '@/config/app.config';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(`${appConfig.api.baseUrl}/v1/auth/signIn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData?.message || 'Lỗi đăng nhập');
    }

    const resData = await response.json();
    const { access_token, refresh_token } = resData?.data?.auth;

    // Lưu cookie (HTTP-only)
    const cookieStore = await cookies();
    cookieStore.set('accessToken', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour instead of 15 minutes for testing
    });
    cookieStore.set('refreshToken', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ message: 'Đăng nhập thành công' });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Lỗi đăng nhập' }, { status: 400 });
  }
}