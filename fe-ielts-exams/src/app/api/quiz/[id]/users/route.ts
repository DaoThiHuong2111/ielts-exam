import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://backend:8228';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieHeader = request.headers.get('cookie');

    const response = await axios.get(`${BACKEND_API_URL}/v1/quizzes/${id}/users`, {
      headers: {
        'Authorization': `Bearer ${cookieHeader?.split('accessToken=')[1]?.split(';')[0]}`,
        'Content-Type': 'application/json',
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
    });
    return NextResponse.json(response.data.data || response.data);
  } catch (error: any) {
    console.error('Failed to fetch quiz users:', error);
    return NextResponse.json(
      { error: error.response?.data?.message || error.message || 'Failed to fetch quiz users' },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const cookieHeader = request.headers.get('cookie');

    const response = await axios.post(`${BACKEND_API_URL}/v1/quizzes/${id}/users`, body, {
      headers: {
        'Authorization': `Bearer ${cookieHeader?.split('accessToken=')[1]?.split(';')[0]}`,
        'Content-Type': 'application/json',
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
    });
    return NextResponse.json(response.data.data || response.data);
  } catch (error: any) {
    console.error('Failed to grant quiz access:', error);
    return NextResponse.json(
      { error: error.response?.data?.message || error.message || 'Failed to grant quiz access' },
      { status: error.response?.status || 500 }
    );
  }
}