import { NextResponse } from 'next/server'
import { getSql } from '@/lib/neon'

export async function GET() {
  try {
    const sql = getSql()
    const careers = await sql`
      SELECT id, name, code FROM careers ORDER BY name ASC
    `
    return NextResponse.json({ careers })
  } catch (error) {
    console.error('Error fetching careers:', error)
    return NextResponse.json(
      { error: 'Error al obtener las carreras' },
      { status: 500 }
    )
  }
}
