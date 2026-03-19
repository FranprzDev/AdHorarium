import { NextRequest, NextResponse } from 'next/server'
import { getSql } from '@/lib/neon'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const sql = getSql()
    const users = await sql`
      SELECT u.id, u.email, u.full_name, u.role, u.created_at,
             up.career_id, up.bio, c.name as career_name
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.id
      LEFT JOIN careers c ON up.career_id = c.id
      WHERE u.id = ${params.id}
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ user: users[0] })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { full_name, role, career_id, bio } = body
    const sql = getSql()

    if (role && !['user', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
    }

    // Prevent removing the only admin
    if (role === 'user') {
      const admins = await sql`
        SELECT COUNT(*) as count FROM users WHERE role = 'admin'
      `
      if (admins[0].count === 1) {
        const checkUser = await sql`
          SELECT role FROM users WHERE id = ${params.id}
        `
        if (checkUser[0].role === 'admin') {
          return NextResponse.json(
            { error: 'No se puede eliminar el último administrador' },
            { status: 400 }
          )
        }
      }
    }

    const updates: string[] = []
    const values: any[] = []

    if (full_name !== undefined) {
      updates.push('full_name = $' + (values.length + 1))
      values.push(full_name)
    }
    if (role !== undefined) {
      updates.push('role = $' + (values.length + 1))
      values.push(role)
    }

    if (updates.length > 0) {
      await sql`
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = ${params.id}
      `
    }

    if (career_id !== undefined || bio !== undefined) {
      await sql`
        INSERT INTO user_profiles (id, career_id, bio)
        VALUES (${params.id}, ${career_id ?? null}, ${bio ?? null})
        ON CONFLICT (id) DO UPDATE
          SET career_id = COALESCE(${career_id ?? null}, user_profiles.career_id),
              bio = COALESCE(${bio ?? null}, user_profiles.bio)
      `
    }

    const result = await sql`
      SELECT u.id, u.email, u.full_name, u.role, u.created_at
      FROM users u
      WHERE u.id = ${params.id}
      LIMIT 1
    `

    return NextResponse.json({ user: result[0] })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (params.id === session.user.id) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 })
    }

    const sql = getSql()
    await sql`DELETE FROM users WHERE id = ${params.id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 })
  }
}
