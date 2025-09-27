import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { appConfig } from '@/config/app.config';

/**
 * POST /api/user/change-password - Change user password
 */
export async function POST(request: NextRequest) {
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
    const { currentPassword, newPassword, confirmPassword } = body;

    // Basic validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Vui lòng điền đầy đủ thông tin'
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Mật khẩu xác nhận không khớp'
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Mật khẩu mới phải có ít nhất 8 ký tự'
        },
        { status: 400 }
      );
    }

    // First, get current user info to get user ID
    const userResponse = await fetch(`${BACKEND_API_URL}/v1/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.json();
      throw new Error(errorData?.message || 'Failed to get user info');
    }

    const userData = await userResponse.json();
    const userId = userData.data?.id;

    if (!userId) {
      throw new Error('User ID not found');
    }

    // Call backend API to change password
    const response = await fetch(`${BACKEND_API_URL}/v1/users/changePassword/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData?.message || 'Failed to change password');
    }

    return NextResponse.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Đổi mật khẩu thất bại'
      },
      { status: 500 }
    );
  }
}
