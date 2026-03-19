import { NextRequest, NextResponse } from 'next/server'
import { getSql } from '@/lib/neon'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const updateUserSchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
  role: z.enum(['user', 'admin'], { message: 'Role debe ser user o admin' }),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo administradores pueden cambiar roles
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo administradores pueden modificar roles' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = updateUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { userId, role } = parsed.data
    const sql = getSql()

    // Prevent removing admin status from the only admin
    if (role === 'user') {
      const adminCount = await sql`
        SELECT COUNT(*) as count FROM users WHERE role = 'admin'
      `

      if (adminCount[0].count <= 1) {
        return NextResponse.json(
          { error: 'No se puede remover el rol de admin del único administrador' },
          { status: 400 }
        )
      }
    }

    const result = await sql`
      UPDATE users
      SET role = ${role}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, email, full_name, role
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ user: result[0] })
  } catch (error) {
    console.error('[api/users/role] PATCH error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el rol' },
      { status: 500 }
    )
  }
}
