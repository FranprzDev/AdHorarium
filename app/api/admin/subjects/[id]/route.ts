import { NextRequest, NextResponse } from 'next/server'
import { getSql } from '@/lib/neon'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const sql = getSql()
    const subjects = await sql`
      SELECT s.id, s.name, s.career_id, s.exam_table_id, c.code as career_code, c.name as career_name,
             et.name as exam_table_name
      FROM subjects s
      LEFT JOIN careers c ON s.career_id = c.id
      LEFT JOIN exam_tables et ON s.exam_table_id = et.id
      WHERE s.id = ${parseInt(params.id)}
      LIMIT 1
    `

    if (subjects.length === 0) {
      return NextResponse.json({ error: 'Materia no encontrada' }, { status: 404 })
    }

    // Get correlatives
    const correlatives = await sql`
      SELECT sc.id, sc.correlative_id, sc.correlation_type,
             s.name as correlative_name, c.code as correlative_career_code
      FROM subject_correlatives sc
      JOIN subjects s ON sc.correlative_id = s.id
      JOIN careers c ON s.career_id = c.id
      WHERE sc.subject_id = ${parseInt(params.id)}
    `

    return NextResponse.json({
      subject: subjects[0],
      correlatives,
    })
  } catch (error) {
    console.error('Error fetching subject:', error)
    return NextResponse.json({ error: 'Error al obtener materia' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { name, exam_table_id } = await request.json()
    const sql = getSql()

    await sql`
      UPDATE subjects
      SET name = COALESCE(${name}, name),
          exam_table_id = ${exam_table_id ?? null},
          updated_at = NOW()
      WHERE id = ${parseInt(params.id)}
    `

    const result = await sql`
      SELECT s.id, s.name, s.career_id, s.exam_table_id, c.code as career_code, c.name as career_name,
             et.name as exam_table_name
      FROM subjects s
      LEFT JOIN careers c ON s.career_id = c.id
      LEFT JOIN exam_tables et ON s.exam_table_id = et.id
      WHERE s.id = ${parseInt(params.id)}
      LIMIT 1
    `

    return NextResponse.json({ subject: result[0] })
  } catch (error) {
    console.error('Error updating subject:', error)
    return NextResponse.json({ error: 'Error al actualizar materia' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const sql = getSql()
    await sql`DELETE FROM subjects WHERE id = ${parseInt(params.id)}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subject:', error)
    return NextResponse.json({ error: 'Error al eliminar materia' }, { status: 500 })
  }
}
