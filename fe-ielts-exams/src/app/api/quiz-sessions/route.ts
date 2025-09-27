import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://backend:8228';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cookieHeader = request.headers.get('cookie');

    const response = await axios.post(`${BACKEND_API_URL}/v1/quiz-sessions`, body, {
      headers: {
        'Authorization': `Bearer ${cookieHeader?.split('accessToken=')[1]?.split(';')[0]}`,
        'Content-Type': 'application/json',
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
    });
    return NextResponse.json(response.data.data || response.data);
  } catch (error: any) {
    console.error('Failed to create quiz session:', error);
    console.error('Error response data:', error.response?.data);
    const errorMessage = error.response?.data?.message ||
                        error.response?.data?.data?.message ||
                        error.response?.data?.error ||
                        error.message ||
                        'Failed to create quiz session';
    return NextResponse.json(
      { error: errorMessage },
      { status: error.response?.status || 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.toString();
    const cookieHeader = request.headers.get('cookie');

    const response = await axios.get(`${BACKEND_API_URL}/v1/quiz-sessions${query ? `?${query}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${cookieHeader?.split('accessToken=')[1]?.split(';')[0]}`,
        'Content-Type': 'application/json',
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
    });
    return NextResponse.json(response.data.data || response.data);
  } catch (error: any) {
    console.error('Failed to fetch quiz sessions:', error);
    const errorMessage = error.response?.data?.message ||
                        error.response?.data?.data?.message ||
                        error.response?.data?.error ||
                        error.message ||
                        'Failed to fetch quiz sessions';
    return NextResponse.json(
      { error: errorMessage },
      { status: error.response?.status || 500 }
    );
  }
}