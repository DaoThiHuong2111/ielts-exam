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

    const response = await axios.get(`${BACKEND_API_URL}/v1/quiz-sessions/${id}`, {
      headers: {
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
    });
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.message || error.message || 'Failed to fetch quiz session' },
      { status: error.response?.status || 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const cookieHeader = request.headers.get('cookie');

    const response = await axios.put(`${BACKEND_API_URL}/v1/quiz-sessions/${id}`, body, {
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
    });
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.message || error.message || 'Failed to update quiz session' },
      { status: error.response?.status || 500 }
    );
  }
}