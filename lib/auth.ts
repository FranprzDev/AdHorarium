import { cookies } from 'next/headers'
import { sql } from '@/lib/neon'

export interface AuthUser {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  provider: string
}

export interface SessionData {
  sessionId: string
  user: AuthUser
}

const SESSION_COOKIE = 'adhorarium_session'
const SESSION_DURATION_DAYS = 30

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)

  const result = await sql`
    INSERT INTO sessions (user_id, expires_at)
    VALUES (${userId}, ${expiresAt.toISOString()})
    RETURNING id
  `
  return result[0].id
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value

  if (!sessionId) return null

  const result = await sql`
    SELECT s.id as session_id, u.id, u.email, u.full_name, u.avatar_url, u.provider
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ${sessionId}
      AND s.expires_at > NOW()
    LIMIT 1
  `

  if (result.length === 0) return null

  const row = result[0]
  return {
    sessionId: row.session_id,
    user: {
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      avatar_url: row.avatar_url,
      provider: row.provider,
    },
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  await sql`DELETE FROM sessions WHERE id = ${sessionId}`
}

export function setSessionCookie(sessionId: string): void {
  // Called from API routes — we return the Set-Cookie header manually
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE
export const SESSION_DURATION_SECONDS = SESSION_DURATION_DAYS * 24 * 60 * 60
