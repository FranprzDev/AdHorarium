import type { MailDeliveryStatus, MailKind, MailProviderKind } from "@/types/enums"

export type Mailbox = {
  email: string
  name: string | null
}

export type MailMessage = {
  to: string
  kind: MailKind
  subject: string
  text: string
  html: string
}

export type MailDeliveryResult = {
  status: MailDeliveryStatus
  provider: MailProviderKind
}

export interface MailProvider {
  readonly kind: MailProviderKind
  send(message: MailMessage): Promise<MailDeliveryResult>
}
