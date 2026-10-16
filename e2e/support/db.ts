import { databaseUrl, E2E_EMAIL_DOMAIN, E2E_EMAIL_PREFIX, E2E_SUBJECT_PREFIX } from "./env"

/**
 * Minimal client for Neon's HTTP SQL endpoint (`POST https://<host>/sql`), the same transport the app's
 * `@neondatabase/serverless` driver uses. The suite only needs it for what the UI cannot do: promote the admin
 * persona and remove the accounts it registered.
 */

type SqlParam = string | number | boolean | null

type SqlResponse<Row> = { rows: Row[]; rowCount: number | null }

type SqlErrorResponse = { message: string }

function isErrorResponse(value: unknown): value is SqlErrorResponse {
  return typeof value === "object" && value !== null && "message" in value && !("rows" in value)
}

export class DatabaseUnavailableError extends Error {
  constructor() {
    super("E2E_DATABASE_URL is not set: admin promotion and cleanup need the database connection string")
  }
}

export async function sql<Row>(query: string, params: SqlParam[] = []): Promise<SqlResponse<Row>> {
  if (!databaseUrl) throw new DatabaseUnavailableError()
  const host = new URL(databaseUrl).hostname
  const response = await fetch(`https://${host}/sql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Neon-Connection-String": databaseUrl },
    body: JSON.stringify({ query, params }),
  })
  const body: unknown = await response.json()
  if (!response.ok || isErrorResponse(body)) {
    const message = isErrorResponse(body) ? body.message : `HTTP ${response.status}`
    throw new Error(`SQL failed: ${message}`)
  }
  return body as SqlResponse<Row>
}

/** Gives an account the admin role; it takes effect on the account's next sign in. */
export async function promoteToAdmin(email: string): Promise<void> {
  const result = await sql("update users set role = 'admin' where email = $1", [email])
  if (result.rowCount !== 1) throw new Error(`Could not promote ${email}: user not found`)
}

export const E2E_EMAIL_PATTERN = `${E2E_EMAIL_PREFIX}%@${E2E_EMAIL_DOMAIN}`
export const E2E_SUBJECT_PATTERN = `${E2E_SUBJECT_PREFIX}%`

/** Prefix of every commission the suite imports into real subjects; the cleanup script deletes commissions named like it. */
export const E2E_COMMISSION_PATTERN = "E2E-%"

export type CleanupResult = { users: number; subjects: number; commissions: number }

/**
 * Deletes every account, subject and imported commission any run of the suite created. Foreign keys cascade to subject
 * states, schedule entries, shares, sessions, correlatives and commissions.
 */
export async function cleanupE2eData(): Promise<CleanupResult> {
  const commissions = await sql("delete from commissions where name like $1", [E2E_COMMISSION_PATTERN])
  const subjects = await sql("delete from subjects where name like $1", [E2E_SUBJECT_PATTERN])
  const users = await sql("delete from users where email like $1", [E2E_EMAIL_PATTERN])
  return { users: users.rowCount ?? 0, subjects: subjects.rowCount ?? 0, commissions: commissions.rowCount ?? 0 }
}
