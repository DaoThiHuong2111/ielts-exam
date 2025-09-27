import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://backend:8228';

// GET user quiz access
export async function GET(
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

    const { userId } = params

    // Get all quizzes and check each one for user access
    const quizzesResponse = await fetch(`${BACKEND_URL}/v1/quizzes?limit=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!quizzesResponse.ok) {
      const errorData = await quizzesResponse.json().catch(() => ({}))
      return NextResponse.json(
        {
          success: false,
          message: errorData.message || `Backend error: ${quizzesResponse.status}`
        },
        { status: quizzesResponse.status }
      )
    }

    const quizzesData = await quizzesResponse.json()
    const quizzes = quizzesData.data?.data || quizzesData.data || []

    // Check each quiz for user access
    const userQuizAccess: any[] = []
    for (const quiz of quizzes) {
      try {
        const accessResponse = await fetch(`${BACKEND_URL}/v1/quizzes/${quiz.id}/users`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        })

        if (accessResponse.ok) {
          const accessData = await accessResponse.json()
          const userAccesses = accessData.data || []
          const userAccess = userAccesses.find((access: any) => access.userId === userId)

          if (userAccess) {
            userQuizAccess.push({
              ...userAccess,
              quiz: {
                id: quiz.id,
                title: quiz.title,
                testType: quiz.testType,
                isPublished: quiz.isPublished,
                isPublic: quiz.isPublic
              }
            })
          }
        }
      } catch (error) {
        // Skip this quiz if there's an error
        continue
      }
    }

    return NextResponse.json({
      success: true,
      data: userQuizAccess,
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST grant quiz access
export async function POST(
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

    const { userId } = params
    const body = await request.json()
    const { quizId, expiresAt } = body

    if (!quizId) {
      return NextResponse.json(
        { success: false, message: 'Quiz ID is required' },
        { status: 400 }
      )
    }

    // Grant quiz access via backend
    const response = await fetch(`${BACKEND_URL}/v1/quizzes/${quizId}/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userIds: [userId],
        expiresAt: expiresAt || null,
      }),
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
      message: 'Đã cấp quyền truy cập thành công',
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
