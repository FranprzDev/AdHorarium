import type { EnvSource } from "@/lib/env"
import { BrevoMailProvider } from "@/lib/mail/brevo"
import { LogMailProvider, type MailLogger } from "@/lib/mail/log"
import { InvalidMailboxError, parseMailbox } from "@/lib/mail/mailbox"
import { OutboxMailProvider, type StoreMail } from "@/lib/mail/outbox"
import type { MailDeliveryResult, MailMessage, MailProvider } from "@/lib/mail/types"
import { EnvVar, MailDeliveryStatus } from "@/types/enums"

const OUTBOX_ENABLED_VALUE = "1"
const PRODUCTION = "production"

export type MailProviderDependencies = {
  storeMail: StoreMail
  fetch?: typeof fetch
  logger?: MailLogger
}

function readEnv(source: EnvSource, variable: EnvVar): string | null {
  const value = source[variable]?.trim()
  return value ? value : null
}

export function isOutboxEnabled(source: EnvSource): boolean {
  return readEnv(source, EnvVar.MailOutbox) === OUTBOX_ENABLED_VALUE && readEnv(source, EnvVar.VercelEnv) !== PRODUCTION
}

export function resolveMailProvider(source: EnvSource, dependencies: MailProviderDependencies): MailProvider {
  if (isOutboxEnabled(source)) return new OutboxMailProvider(dependencies.storeMail)

  const includeBody = source.NODE_ENV !== PRODUCTION
  const notConfigured = (reason: string) => new LogMailProvider({ reason, includeBody, logger: dependencies.logger })

  const apiKey = readEnv(source, EnvVar.BrevoApiKey)
  if (!apiKey) return notConfigured(`${EnvVar.BrevoApiKey} no está definida`)
  const from = readEnv(source, EnvVar.MailFrom)
  if (!from) return notConfigured(`${EnvVar.MailFrom} no está definida`)

  try {
    return new BrevoMailProvider({ apiKey, sender: parseMailbox(from), fetch: dependencies.fetch })
  } catch (error) {
    if (error instanceof InvalidMailboxError) return notConfigured(`${EnvVar.MailFrom} no es una dirección válida`)
    throw error
  }
}

export async function deliverMail(provider: MailProvider, message: MailMessage): Promise<MailDeliveryResult> {
  try {
    return await provider.send(message)
  } catch (error) {
    console.error("Email delivery failed", message.kind, error instanceof Error ? error.name : typeof error)
    return { status: MailDeliveryStatus.Failed, provider: provider.kind }
  }
}
