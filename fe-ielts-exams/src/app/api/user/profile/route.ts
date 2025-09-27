import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { appConfig } from '@/config/app.config';

/**
 * GET /api/user/profile - Get user profile
 */
export async function GET(request: NextRequest) {
  try {
    // Get access token from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unauthorized - No access token'
        },
        { status: 401 }
      );
    }

    // Call backend API directly
    const response = await fetch(`${appConfig.api.baseUrl}/v1/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData?.message || 'Failed to fetch user profile');
    }

    const userData = await response.json();
    
    // Normalize backend data to match frontend expectations
    const normalizedData = {
      ...userData.data,
      phone: userData.data.phoneNumber, // Add phone field for backward compatibility
    };
    
    return NextResponse.json({
      success: true,
      data: normalizedData
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Lấy thông tin người dùng thất bại'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/profile - Update user profile
 */
export async function PUT(request: NextRequest) {
  try {
    // Get access token from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unauthorized - No access token'
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Transform frontend data to backend format
    const backendData = {
      name: body.fullName || undefined,
      phoneNumber: body.phone,
    };
    
    // Call backend API directly
    const response = await fetch(`${appConfig.api.baseUrl}/v1/users/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData?.message || 'Failed to update user profile');
    }

    const userData = await response.json();
    
    // Normalize backend data to match frontend expectations
    const normalizedData = {
      ...userData.data,
      phone: userData.data.phoneNumber, // Add phone field for backward compatibility
    };
    
    return NextResponse.json({
      success: true,
      data: normalizedData
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Cập nhật thông tin thất bại'
      },
      { status: 500 }
    );
  }
}
