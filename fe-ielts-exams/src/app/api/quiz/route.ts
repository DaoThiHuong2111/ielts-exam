import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { appConfig } from '@/config/app.config';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.toString();

    // Get access token from httpOnly cookie
    const accessToken = request.cookies.get('accessToken')?.value;

    // Prepare headers for backend request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Bearer token if available
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    // Forward all relevant headers to backend
    const forwardHeaders = {
      ...headers,
      'User-Agent': request.headers.get('user-agent') || '',
      'Accept': request.headers.get('accept') || '',
      'Accept-Language': request.headers.get('accept-language') || '',
    };

    // Call backend API with user authentication
    const response = await axios.get(`${appConfig.api.baseUrl}/v1/quizzes${query ? `?${query}` : ''}`, {
      headers: forwardHeaders,
      withCredentials: true,
      timeout: appConfig.api.timeout,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Failed to fetch quizzes:', error);

    // If backend is unavailable, return appropriate error
    // Don't fallback to mock data for security reasons
    return NextResponse.json({
      success: false,
      data: [],
      message: 'Không thể kết nối đến server. Vui lòng thử lại sau.'
    }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get access token from httpOnly cookie
    const accessToken = request.cookies.get('accessToken')?.value;

    console.log('Creating quiz with body:', body);
    console.log('Access token available:', !!accessToken);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Bearer token if available
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    // Forward all relevant headers
    const forwardHeaders = {
      ...headers,
      'User-Agent': request.headers.get('user-agent') || '',
      'Accept': request.headers.get('accept') || '',
      'Accept-Language': request.headers.get('accept-language') || '',
    };

    console.log('Forwarding headers to backend:', forwardHeaders);

    const response = await axios.post(`${appConfig.api.baseUrl}/v1/quizzes`, body, {
      headers: forwardHeaders,
      withCredentials: true,
      timeout: appConfig.api.timeout,
    });

    console.log('Quiz creation response:', response.data);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Create quiz error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    console.error('Error config:', error.config);

    return NextResponse.json(
      { error: error.response?.data?.message || error.message || 'Failed to create quiz' },
      { status: error.response?.status || 500 }
    );
  }
}