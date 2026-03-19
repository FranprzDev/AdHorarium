import { NextRequest, NextResponse } from 'next/server'
import { getSql } from '@/lib/neon'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const careerId = searchParams.get('careerId')

    const sql = getSql()
    let query

    if (careerId) {
      query = await sql`
        SELECT s.id, s.name, s.career_id, s.exam_table_id, c.code as career_code, c.name as career_name,
               et.name as exam_table_name
        FROM subjects s
        LEFT JOIN careers c ON s.career_id = c.id
        LEFT JOIN exam_tables et ON s.exam_table_id = et.id
        WHERE s.career_id = ${parseInt(careerId)}
        ORDER BY s.id
      `
    } else {
      query = await sql`
        SELECT s.id, s.name, s.career_id, s.exam_table_id, c.code as career_code, c.name as career_name,
               et.name as exam_table_name
        FROM subjects s
        LEFT JOIN careers c ON s.career_id = c.id
        LEFT JOIN exam_tables et ON s.exam_table_id = et.id
        ORDER BY c.name, s.name
      `
    }

    return NextResponse.json({ subjects: query })
  } catch (error) {
    console.error('Error fetching subjects:', error)
    return NextResponse.json({ error: 'Error al obtener materias' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { name, career_id, exam_table_id } = await request.json()

    if (!name || !career_id) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const sql = getSql()
    const result = await sql`
      INSERT INTO subjects (name, career_id, exam_table_id)
      VALUES (${name}, ${career_id}, ${exam_table_id ?? null})
      RETURNING id, name, career_id, exam_table_id
    `

    return NextResponse.json({ subject: result[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating subject:', error)
    return NextResponse.json({ error: 'Error al crear materia' }, { status: 500 })
  }
}
