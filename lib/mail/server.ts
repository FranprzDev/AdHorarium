import { getDb } from "@/db/client"
import { storeOutboxMail } from "@/db/queries/mail"
import { deliverMail, resolveMailProvider } from "@/lib/mail/config"
import type { MailDeliveryResult, MailMessage, MailProvider } from "@/lib/mail/types"

let provider: MailProvider | null = null

function getMailProvider(): MailProvider {
  if (!provider) provider = resolveMailProvider(process.env, { storeMail: (message) => storeOutboxMail(getDb(), message) })
  return provider
}

export async function sendMail(message: MailMessage): Promise<MailDeliveryResult> {
  return deliverMail(getMailProvider(), message)
}
