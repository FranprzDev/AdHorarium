import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const result = await sql`
      SELECT up.id, up.career_id, up.bio,
             c.code as career_code, c.name as career_name,
             u.full_name, u.email, u.avatar_url
      FROM user_profiles up
      JOIN users u ON u.id = up.id
      LEFT JOIN careers c ON up.career_id = c.id
      WHERE up.id = ${session.user.id}
      LIMIT 1
    `

    return NextResponse.json({ profile: result[0] ?? null })
  } catch (error) {
    console.error('[api/profile] GET error:', error)
    return NextResponse.json({ error: 'Error al obtener el perfil' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { career_id, bio } = body

    await sql`
      INSERT INTO user_profiles (id, career_id, bio, updated_at)
      VALUES (${session.user.id}, ${career_id ?? null}, ${bio ?? null}, NOW())
      ON CONFLICT (id) DO UPDATE
        SET career_id  = COALESCE(${career_id ?? null}, user_profiles.career_id),
            bio        = COALESCE(${bio ?? null}, user_profiles.bio),
            updated_at = NOW()
    `

    const result = await sql`
      SELECT up.id, up.career_id, up.bio,
             c.code as career_code, c.name as career_name,
             u.full_name, u.email, u.avatar_url
      FROM user_profiles up
      JOIN users u ON u.id = up.id
      LEFT JOIN careers c ON up.career_id = c.id
      WHERE up.id = ${session.user.id}
      LIMIT 1
    `

    return NextResponse.json({ profile: result[0] ?? null })
  } catch (error) {
    console.error('[api/profile] PATCH error:', error)
    return NextResponse.json({ error: 'Error al actualizar el perfil' }, { status: 500 })
  }
}
