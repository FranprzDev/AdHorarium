import type { EnvSource } from "@/lib/env"
import { SITE_URL } from "@/lib/site"
import { EnvVar } from "@/types/enums"

const PRODUCTION = "production"
const LOCAL_HOST = /^(localhost|127\.0\.0\.1)(:\d+)?$/

export function resolveAppOrigin(headers: Headers, source: EnvSource = process.env): string {
  if (source[EnvVar.VercelEnv] === PRODUCTION) return SITE_URL
  const host = headers.get("x-forwarded-host") ?? headers.get("host")
  if (!host) return SITE_URL
  const protocol = headers.get("x-forwarded-proto") ?? (LOCAL_HOST.test(host) ? "http" : "https")
  return `${protocol}://${host}`
}
