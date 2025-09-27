import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { appConfig } from '@/config/app.config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieHeader = request.headers.get('cookie');

    const response = await axios.get(`${appConfig.api.baseUrl}/v1/quizzes/${id}`, {
      headers: {
        'Authorization': `Bearer ${cookieHeader?.split('accessToken=')[1]?.split(';')[0]}`,
        'Content-Type': 'application/json',
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
    });
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Failed to fetch quiz:', error);
    return NextResponse.json(
      { error: error.response?.data?.message || error.message || 'Failed to fetch quiz' },
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

    const response = await axios.patch(`${appConfig.api.baseUrl}/v1/quizzes/${id}`, body, {
      headers: {
        'Authorization': `Bearer ${cookieHeader?.split('accessToken=')[1]?.split(';')[0]}`,
        'Content-Type': 'application/json',
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
    });
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.message || error.message || 'Failed to update quiz' },
      { status: error.response?.status || 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const cookieHeader = request.headers.get('cookie');

    const response = await axios.patch(`${appConfig.api.baseUrl}/v1/quizzes/${id}`, body, {
      headers: {
        'Authorization': `Bearer ${cookieHeader?.split('accessToken=')[1]?.split(';')[0]}`,
        'Content-Type': 'application/json',
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
    });
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.message || error.message || 'Failed to update quiz' },
      { status: error.response?.status || 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieHeader = request.headers.get('cookie');

    await axios.delete(`${appConfig.api.baseUrl}/v1/quizzes/${id}`, {
      headers: {
        'Authorization': `Bearer ${cookieHeader?.split('accessToken=')[1]?.split(';')[0]}`,
        'Content-Type': 'application/json',
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.message || error.message || 'Failed to delete quiz' },
      { status: error.response?.status || 500 }
    );
  }
}