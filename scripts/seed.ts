import { createNeonDatabase } from "@/db/client"
import { buildSeedPlan } from "@/db/seed/plan-data"
import { seedDatabase } from "@/db/seed/seed-database"
import { getDatabaseUrl } from "@/lib/env"

async function main(): Promise<void> {
  const plan = buildSeedPlan()
  const db = createNeonDatabase(getDatabaseUrl())
  const counts = await seedDatabase(db, plan)
  console.log("Seed completed", counts)
  for (const entry of plan.unmatchedExamEntries) {
    console.log(`Exam table entry without a matching plan subject: ${entry.careerCode} ${entry.examTable} ${entry.subjectName}`)
  }
}

async function run(): Promise<void> {
  try {
    await main()
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  }
}

void run()
