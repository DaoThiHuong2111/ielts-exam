import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://backend:8228';

const getAccessToken = async () => {
  const cookieStore = await cookies()
  return cookieStore.get('accessToken')?.value
}

const requireAccessToken = async () => {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    return {
      errorResponse: NextResponse.json(
        { success: false, message: 'Unauthorized - No access token' },
        { status: 401 }
      ),
      accessToken: null,
    }
  }

  return { accessToken }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string; accessId: string } }
) {
  const tokenResult = await requireAccessToken()
  if (!tokenResult.accessToken) {
    return tokenResult.errorResponse
  }

  try {
    const { userId } = params
    const body = await request.json().catch(() => null)

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Dữ liệu không hợp lệ' },
        { status: 400 }
      )
    }

    const { quizId, expiresAt } = body as { quizId?: string; expiresAt?: string | null }

    if (!quizId) {
      return NextResponse.json(
        { success: false, message: 'Quiz ID is required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${BACKEND_URL}/v1/quizzes/${quizId}/users/${userId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${tokenResult.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expiresAt: expiresAt ?? null,
        isActive: true,
      }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || `Backend error: ${response.status}`,
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Đã cập nhật thời hạn truy cập',
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE revoke quiz access
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string; accessId: string } }
) {
  try {
    const tokenResult = await requireAccessToken()
    if (!tokenResult.accessToken) {
      return tokenResult.errorResponse
    }

    const { userId } = params
    const body = await request.json()
    const { quizId } = body

    if (!quizId) {
      return NextResponse.json(
        { success: false, message: 'Quiz ID is required' },
        { status: 400 }
      )
    }

    // Revoke quiz access via backend
    const response = await fetch(`${BACKEND_URL}/v1/quizzes/${quizId}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${tokenResult.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || `Backend error: ${response.status}` 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      data: data.data || data,
      message: 'Đã thu hồi quyền truy cập thành công',
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
