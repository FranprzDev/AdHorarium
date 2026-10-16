/**
 * Run-scoped settings for the end-to-end suite.
 *
 * Every account and catalog row the suite creates is derived from `E2E_RUN_ID`, so a run can be split into several
 * `e2e run` invocations (same id) and everything it leaves behind can be found and removed by `pnpm test:e2e:cleanup`.
 */

export const PRODUCTION_URL = "https://adhorarium.vercel.app"

/** Domain of every account the suite registers; the cleanup script deletes `e2e+%@` users of this domain. */
export const E2E_EMAIL_DOMAIN = "adhorarium.app"
export const E2E_EMAIL_PREFIX = "e2e+"
/** Prefix of every subject the suite creates in the admin panel; the cleanup script deletes subjects named like it. */
export const E2E_SUBJECT_PREFIX = "E2E "

export enum E2eEnv {
  BaseUrl = "E2E_BASE_URL",
  RunId = "E2E_RUN_ID",
  DatabaseUrl = "E2E_DATABASE_URL",
  AdminEmail = "E2E_ADMIN_EMAIL",
  AdminPassword = "E2E_ADMIN_PASSWORD",
  Assistant = "E2E_ASSISTANT",
  StateDir = "E2E_STATE_DIR",
  /** "1" when the target app runs with MAIL_OUTBOX=1, so emails can be read from the `mail_outbox` table. */
  MailOutbox = "E2E_MAIL_OUTBOX",
}

export enum Persona {
  /** Main student: plan, subjects, schedule, export, share. */
  StudentA = "studentA",
  /** Second student: imports the schedule student A shares. */
  StudentB = "studentB",
  /** Registered in the auth tests; also used for sign in, sign out and redirects. */
  Registration = "registration",
  /** Admin: catalog CRUD. Needs database access to be promoted, or an existing admin account. */
  Admin = "admin",
}

export type Account = { email: string; password: string; name: string }

function readEnv(name: E2eEnv): string | undefined {
  const value = process.env[name]?.trim()
  return value ? value : undefined
}

function resolveRunId(): string {
  const existing = readEnv(E2eEnv.RunId)
  if (existing) return existing
  const generated = Date.now().toString(36)
  // Worker processes inherit the variable, so every file of one invocation shares the id.
  process.env[E2eEnv.RunId] = generated
  return generated
}

export const runId = resolveRunId()
export const baseUrl = readEnv(E2eEnv.BaseUrl) ?? PRODUCTION_URL
export const databaseUrl = readEnv(E2eEnv.DatabaseUrl)
export const isProduction = new URL(baseUrl).origin === PRODUCTION_URL

/** The assistant calls a paid model behind a 6/min limit, so it runs against production or when asked explicitly. */
export const assistantEnabled = isProduction || readEnv(E2eEnv.Assistant) === "1"

/** Flows that need an emailed link run only against a non-production app that stores emails in the outbox. */
export const mailOutboxAvailable = !isProduction && Boolean(databaseUrl) && readEnv(E2eEnv.MailOutbox) === "1"

const PASSWORD = `E2e-${runId}-pass9`

export function accountFor(persona: Persona): Account {
  if (persona === Persona.Admin) {
    const email = readEnv(E2eEnv.AdminEmail)
    const password = readEnv(E2eEnv.AdminPassword)
    if (email && password) return { email, password, name: "E2E Admin" }
  }
  return {
    email: `${E2E_EMAIL_PREFIX}${runId}-${persona.toLowerCase()}@${E2E_EMAIL_DOMAIN}`,
    password: PASSWORD,
    name: `E2E ${persona} ${runId}`,
  }
}

/** True when the admin persona can exist: a database to promote it, or credentials of an existing admin. */
export const adminAvailable = Boolean(databaseUrl) || Boolean(readEnv(E2eEnv.AdminEmail) && readEnv(E2eEnv.AdminPassword))

/** Directory where tests hand values to later tests of the same run (a share link). */
export const stateDir = readEnv(E2eEnv.StateDir) ?? ".e2e/state"

/** Subject number for the rows the suite creates: unique per career and at most 999; real plans stop below 50. */
export const runNumber = 900 + 2 * (Number.parseInt(runId.slice(-4), 36) % 49)
