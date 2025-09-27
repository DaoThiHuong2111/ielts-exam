import { NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://backend:8228';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(`${BACKEND_API_URL}/v1/auth/forgot-password`, {
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
          message: errorData?.message || 'Gửi yêu cầu đặt lại mật khẩu thất bại',
          statusCode: response.status,
          error: errorData?.error || 'FORGOT_PASSWORD_ERROR'
        }, 
        { status: response.status || 400 }
      );
    }

    const data = await response.json();

    return NextResponse.json(
      { 
        message: 'Email đặt lại mật khẩu đã được gửi thành công',
        data
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { 
        message: err.message || 'Gửi yêu cầu đặt lại mật khẩu thất bại',
        error: 'NETWORK_ERROR'
      }, 
      { status: 500 }
    );
  }
}