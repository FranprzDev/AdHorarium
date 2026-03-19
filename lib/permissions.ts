import { NextResponse } from 'next/server'
import { getSession } from './auth'

export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    return {
      error: true,
      response: NextResponse.json({ error: 'No autorizado' }, { status: 401 }),
    }
  }

  return { error: false, session }
}

export async function requireAdmin() {
  const session = await getSession()

  if (!session) {
    return {
      error: true,
      response: NextResponse.json({ error: 'No autorizado' }, { status: 401 }),
    }
  }

  if (session.user.role !== 'admin') {
    return {
      error: true,
      response: NextResponse.json(
        { error: 'Se requieren permisos de administrador' },
        { status: 403 }
      ),
    }
  }

  return { error: false, session }
}
