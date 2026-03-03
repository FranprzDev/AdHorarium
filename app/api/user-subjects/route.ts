import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const career_code = searchParams.get('career_code')

  if (!userId || !career_code) {
    return NextResponse.json({ error: 'userId y career_code requeridos' }, { status: 400 })
  }

  try {
    const subjects = await sql`
      SELECT subject_number, status, grade
      FROM user_subject_states
      WHERE user_id = ${userId} AND career_code = ${career_code}
    `
    return NextResponse.json({ subjects })
  } catch (error) {
    console.error('Error fetching user subjects:', error)
    return NextResponse.json({ error: 'Error al obtener materias' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, career_code, subject_number, status, grade } = await request.json()

    if (!userId || !career_code || subject_number === undefined || !status) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 })
    }

    await sql`
      INSERT INTO user_subject_states (user_id, career_code, subject_number, status, grade)
      VALUES (${userId}, ${career_code}, ${subject_number}, ${status}, ${grade ?? null})
      ON CONFLICT (user_id, career_code, subject_number)
      DO UPDATE SET status = ${status}, grade = ${grade ?? null}, updated_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user subject:', error)
    return NextResponse.json({ error: 'Error al actualizar materia' }, { status: 500 })
  }
}
