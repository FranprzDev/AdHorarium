import type { MailDeliveryResult, MailMessage, MailProvider } from "@/lib/mail/types"
import { MailDeliveryStatus, MailProviderKind } from "@/types/enums"

export type StoreMail = (message: MailMessage) => Promise<void>

export class OutboxMailProvider implements MailProvider {
  readonly kind = MailProviderKind.Outbox

  constructor(private readonly store: StoreMail) {}

  async send(message: MailMessage): Promise<MailDeliveryResult> {
    await this.store(message)
    return { status: MailDeliveryStatus.Sent, provider: this.kind }
  }
}
