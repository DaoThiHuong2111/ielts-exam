// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://backend:8228';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(`${BACKEND_API_URL}/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        {
          message: errorData?.message || 'Lỗi đăng ký',
          statusCode: response.status,
          error: errorData?.error || 'REGISTRATION_ERROR'
        },
        { status: response.status || 400 }
      );
    }

    const data = await response.json();
    const { access_token, refresh_token } = data?.data?.auth;
    
    // Set cookies using Next.js cookies API
    const cookieStore = await cookies();
    cookieStore.set('accessToken', access_token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 15, // 15 minutes
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    cookieStore.set('refreshToken', refresh_token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return NextResponse.json({
      message: 'Đăng ký thành công',
      user: data.data.user,
      auth: data.data.auth
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        message: err.message || 'Lỗi đăng ký',
        error: 'NETWORK_ERROR'
      },
      { status: 500 }
    );
  }
}
