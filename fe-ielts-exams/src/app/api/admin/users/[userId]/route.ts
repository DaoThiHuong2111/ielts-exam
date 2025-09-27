import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://backend:8228';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No access token' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => null)
    const active = (body as { active?: unknown } | null)?.active

    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Trạng thái active không hợp lệ' },
        { status: 400 }
      )
    }

    const response = await fetch(`${BACKEND_URL}/v1/users/${params.userId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ active }),
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
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
