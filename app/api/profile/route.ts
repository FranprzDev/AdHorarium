import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
  }

  try {
    const result = await sql`
      SELECT up.id, up.career_id, c.code as career_code, c.name as career_name
      FROM user_profiles up
      LEFT JOIN careers c ON up.career_id = c.id
      WHERE up.id = ${userId}
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({ profile: null })
    }

    return NextResponse.json({ profile: result[0] })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Error al obtener el perfil' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, career_id } = await request.json()

    if (!userId || !career_id) {
      return NextResponse.json({ error: 'userId y career_id requeridos' }, { status: 400 })
    }

    await sql`
      INSERT INTO user_profiles (id, career_id, updated_at)
      VALUES (${userId}, ${career_id}, NOW())
      ON CONFLICT (id) DO UPDATE SET career_id = ${career_id}, updated_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Error al actualizar el perfil' }, { status: 500 })
  }
}
