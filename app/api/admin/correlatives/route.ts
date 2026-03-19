import { NextRequest, NextResponse } from 'next/server'
import { getSql } from '@/lib/neon'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')

    const session = await getSession()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const sql = getSql()
    const correlatives = await sql`
      SELECT sc.id, sc.subject_id, sc.correlative_id, sc.correlation_type,
             s1.name as subject_name,
             s2.name as correlative_name,
             c2.code as correlative_career_code
      FROM subject_correlatives sc
      JOIN subjects s1 ON sc.subject_id = s1.id
      JOIN subjects s2 ON sc.correlative_id = s2.id
      JOIN careers c2 ON s2.career_id = c2.id
      ${subjectId ? `WHERE sc.subject_id = ${parseInt(subjectId)}` : ''}
      ORDER BY sc.created_at DESC
    `

    return NextResponse.json({ correlatives })
  } catch (error) {
    console.error('[api/admin/correlatives] GET error:', error)
    return NextResponse.json({ error: 'Error al obtener correlativas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { subject_id, correlative_id, correlation_type } = await request.json()

    if (!subject_id || !correlative_id || !correlation_type) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    if (!['must_approve', 'must_take', 'enables'].includes(correlation_type)) {
      return NextResponse.json({ error: 'Tipo de correlativa inválido' }, { status: 400 })
    }

    const sql = getSql()

    const result = await sql`
      INSERT INTO subject_correlatives (subject_id, correlative_id, correlation_type)
      VALUES (${subject_id}, ${correlative_id}, ${correlation_type})
      RETURNING id, subject_id, correlative_id, correlation_type
    `

    return NextResponse.json({ correlative: result[0] }, { status: 201 })
  } catch (error) {
    console.error('[api/admin/correlatives] POST error:', error)
    if ((error as any)?.message?.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Esta correlativa ya existe' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear correlativa' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const correlativeId = searchParams.get('correlativeId')

    if (!correlativeId) {
      return NextResponse.json({ error: 'ID de correlativa requerido' }, { status: 400 })
    }

    const sql = getSql()
    await sql`DELETE FROM subject_correlatives WHERE id = ${parseInt(correlativeId)}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[api/admin/correlatives] DELETE error:', error)
    return NextResponse.json({ error: 'Error al eliminar correlativa' }, { status: 500 })
  }
}
