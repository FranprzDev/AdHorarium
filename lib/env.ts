import { EnvVar } from "@/types/enums"

export type EnvSource = Readonly<Record<string, string | undefined>>

export class MissingEnvError extends Error {
  constructor(readonly variable: EnvVar) {
    super(`Missing required environment variable ${variable}`)
    this.name = "MissingEnvError"
  }
}

export function readRequiredEnv(variable: EnvVar, source: EnvSource = process.env): string {
  const value = source[variable]?.trim()
  if (!value) throw new MissingEnvError(variable)
  return value
}

export function parseEmailList(raw: string): string[] {
  const emails = new Set<string>()
  for (const part of raw.split(",")) {
    const email = part.trim().toLowerCase()
    if (email) emails.add(email)
  }
  return [...emails]
}

export function getDatabaseUrl(source: EnvSource = process.env): string {
  return readRequiredEnv(EnvVar.DatabaseUrl, source)
}

export function getAdminEmails(source: EnvSource = process.env): string[] {
  return parseEmailList(readRequiredEnv(EnvVar.AdminEmails, source))
}

/** Vercel AI Gateway model id for the schedule assistant. Required: there is no default model. */
export function getScheduleAssistantModelId(source: EnvSource = process.env): string {
  return readRequiredEnv(EnvVar.ScheduleAssistantModel, source)
}
