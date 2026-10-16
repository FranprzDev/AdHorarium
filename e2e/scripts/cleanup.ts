import { cleanupE2eData, E2E_COMMISSION_PATTERN, E2E_EMAIL_PATTERN, E2E_SUBJECT_PATTERN, sql } from "../support/db"

type CountRow = { users: number; subjects: number; commissions: number; correlatives: number; examTables: number }

/** Removes every account and subject the e2e suite created (any run id) and prints what the catalog holds after it. */
async function main(): Promise<void> {
  const removed = await cleanupE2eData()
  console.log(`Removed ${removed.users} e2e users, ${removed.subjects} e2e subjects and ${removed.commissions} e2e commissions`)
  const { rows } = await sql<CountRow>(
    `select (select count(*)::int from users where email like $1) as users,
            (select count(*)::int from subjects where name like $2) as "subjects",
            (select count(*)::int from commissions where name like $3) as "commissions",
            (select count(*)::int from subject_correlatives) as correlatives,
            (select count(*)::int from exam_tables) as "examTables"`,
    [E2E_EMAIL_PATTERN, E2E_SUBJECT_PATTERN, E2E_COMMISSION_PATTERN],
  )
  const [counts] = rows
  console.log(
    `Left: ${counts.users} e2e users, ${counts.subjects} e2e subjects, ${counts.commissions} e2e commissions; catalog has ${counts.correlatives} correlatives, ${counts.examTables} exam tables`,
  )
  if (counts.users > 0 || counts.subjects > 0 || counts.commissions > 0) process.exitCode = 1
}

async function run(): Promise<void> {
  try {
    await main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}

void run()
