import type { Mailbox, MailDeliveryResult, MailMessage, MailProvider } from "@/lib/mail/types"
import { MailDeliveryStatus, MailProviderKind } from "@/types/enums"

export const BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email"

export type BrevoProviderOptions = {
  apiKey: string
  sender: Mailbox
  fetch?: typeof fetch
}

export class BrevoMailProvider implements MailProvider {
  readonly kind = MailProviderKind.Brevo
  private readonly fetchImpl: typeof fetch

  constructor(private readonly options: BrevoProviderOptions) {
    this.fetchImpl = options.fetch ?? fetch
  }

  async send(message: MailMessage): Promise<MailDeliveryResult> {
    const sender = this.options.sender.name
      ? { email: this.options.sender.email, name: this.options.sender.name }
      : { email: this.options.sender.email }
    const response = await this.fetchImpl(BREVO_SEND_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": this.options.apiKey,
      },
      body: JSON.stringify({
        sender,
        to: [{ email: message.to }],
        subject: message.subject,
        htmlContent: message.html,
        textContent: message.text,
        tags: [message.kind],
      }),
    })
    if (!response.ok) {
      console.error("Brevo rejected an email", message.kind, response.status)
      return { status: MailDeliveryStatus.Failed, provider: this.kind }
    }
    return { status: MailDeliveryStatus.Sent, provider: this.kind }
  }
}
