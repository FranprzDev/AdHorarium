import { NextResponse } from 'next/server'
import { getSession, deleteSession, SESSION_COOKIE_NAME } from '@/lib/auth'

export async function POST() {
  try {
    const session = await getSession()

    if (session) {
      await deleteSession(session.sessionId)
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
