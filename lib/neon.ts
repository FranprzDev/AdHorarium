import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL

export const sql = DATABASE_URL ? neon(DATABASE_URL) : null

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set. Please configure Neon integration in v0 settings.')
  }
  return neon(process.env.DATABASE_URL)
}
