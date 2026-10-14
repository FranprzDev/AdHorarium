import { migrate } from "drizzle-orm/neon-http/migrator"
import { createNeonDatabase } from "@/db/client"
import { getDatabaseUrl } from "@/lib/env"

async function main(): Promise<void> {
  const db = createNeonDatabase(getDatabaseUrl())
  await migrate(db, { migrationsFolder: "drizzle" })
  console.log("Migrations applied")
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
