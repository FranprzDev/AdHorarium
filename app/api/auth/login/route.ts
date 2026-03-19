import { NextRequest, NextResponse } from 'next/server'
import { getSql } from '@/lib/neon'
import { createSession, SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data
    const sql = getSql()

    const users = await sql`
      SELECT id, email, full_name, avatar_url, password_hash, provider, role
      FROM users
      WHERE email = ${email.toLowerCase().trim()}
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Email o contraseña incorrectos' },
        { status: 401 }
      )
    }

    const user = users[0]

    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'Esta cuenta no tiene contraseña configurada' },
        { status: 401 }
      )
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash)
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Email o contraseña incorrectos' },
        { status: 401 }
      )
    }

    const sessionId = await createSession(user.id)

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        provider: user.provider,
        role: user.role,
      },
    })

    response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_SECONDS,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
