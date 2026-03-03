import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'
import { createSession, SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password, full_name } = parsed.data
    const normalizedEmail = email.toLowerCase().trim()

    const existing = await sql`
      SELECT id FROM users WHERE email = ${normalizedEmail} LIMIT 1
    `

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con ese email' },
        { status: 409 }
      )
    }

    const password_hash = await bcrypt.hash(password, 12)

    const result = await sql`
      INSERT INTO users (email, password_hash, full_name, provider)
      VALUES (${normalizedEmail}, ${password_hash}, ${full_name}, 'email')
      RETURNING id, email, full_name, avatar_url, provider
    `

    const newUser = result[0]

    await sql`
      INSERT INTO user_profiles (id) VALUES (${newUser.id})
    `

    const sessionId = await createSession(newUser.id)

    const response = NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        avatar_url: newUser.avatar_url,
        provider: newUser.provider,
      },
    }, { status: 201 })

    response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_SECONDS,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
