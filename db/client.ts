import { neon } from "@neondatabase/serverless"
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http"
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core"
import * as schema from "@/db/schema"
import { getDatabaseUrl } from "@/lib/env"

export type AppSchema = typeof schema
export type AppDatabase = PgDatabase<PgQueryResultHKT, AppSchema>

let database: AppDatabase | null = null

export function createNeonDatabase(connectionString: string): NeonHttpDatabase<AppSchema> {
  return drizzle({ client: neon(connectionString), schema })
}

export function getDb(): AppDatabase {
  if (!database) database = createNeonDatabase(getDatabaseUrl())
  return database
}
