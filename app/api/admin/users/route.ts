import { NextRequest, NextResponse } from 'next/server'
import { getSql } from '@/lib/neon'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const sql = getSql()
    const users = await sql`
      SELECT u.id, u.email, u.full_name, u.role, u.created_at,
             COALESCE(up.career_id, 0) as career_id
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.id
      ORDER BY u.created_at DESC
    `

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { email, full_name, role } = await request.json()

    if (!email || !full_name || !['user', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const sql = getSql()

    const existing = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1
    `

    if (existing.length > 0) {
      return NextResponse.json({ error: 'El email ya existe' }, { status: 409 })
    }

    const result = await sql`
      INSERT INTO users (email, full_name, provider, role)
      VALUES (${email.toLowerCase().trim()}, ${full_name}, 'manual', ${role})
      RETURNING id, email, full_name, role, created_at
    `

    const newUser = result[0]

    await sql`INSERT INTO user_profiles (id) VALUES (${newUser.id})`

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}
