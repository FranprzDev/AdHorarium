import { NextRequest, NextResponse } from 'next/server'
import { getSql } from '@/lib/neon'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')

    const sql = getSql()
    const correlatives = await sql`
      SELECT sc.id, sc.subject_id, sc.correlative_id, sc.correlation_type,
             s.name as subject_name, c.name as correlative_name
      FROM subject_correlatives sc
      JOIN subjects s ON sc.subject_id = s.id
      JOIN subjects c ON sc.correlative_id = c.id
      ${subjectId ? `WHERE sc.subject_id = ${parseInt(subjectId)}` : ''}
      ORDER BY sc.subject_id
    `

    return NextResponse.json({ correlatives })
  } catch (error) {
    console.error('Error fetching correlatives:', error)
    return NextResponse.json({ error: 'Error al obtener correlativas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { subject_id, correlative_id, correlation_type } = await request.json()

    if (!subject_id || !correlative_id || !['must_approve', 'must_take', 'enables'].includes(correlation_type)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    if (subject_id === correlative_id) {
      return NextResponse.json({ error: 'Una materia no puede ser su propia correlativa' }, { status: 400 })
    }

    const sql = getSql()
    const result = await sql`
      INSERT INTO subject_correlatives (subject_id, correlative_id, correlation_type)
      VALUES (${subject_id}, ${correlative_id}, ${correlation_type})
      RETURNING id, subject_id, correlative_id, correlation_type
    `

    return NextResponse.json({ correlative: result[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating correlative:', error)
    if (error.message.includes('unique')) {
      return NextResponse.json({ error: 'Esta correlativa ya existe' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear correlativa' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const correlativeId = searchParams.get('id')

    if (!correlativeId) {
      return NextResponse.json({ error: 'ID de correlativa requerido' }, { status: 400 })
    }

    const sql = getSql()
    await sql`DELETE FROM subject_correlatives WHERE id = ${parseInt(correlativeId)}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting correlative:', error)
    return NextResponse.json({ error: 'Error al eliminar correlativa' }, { status: 500 })
  }
}
