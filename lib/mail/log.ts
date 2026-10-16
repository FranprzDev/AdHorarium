import { maskEmail } from "@/lib/mail/mailbox"
import type { MailDeliveryResult, MailMessage, MailProvider } from "@/lib/mail/types"
import { MailDeliveryStatus, MailProviderKind } from "@/types/enums"

export const MAIL_NOT_CONFIGURED_MESSAGE = "Envío de email no configurado"

export type MailLogger = Pick<Console, "warn">

export type LogProviderOptions = {
  reason: string
  includeBody: boolean
  logger?: MailLogger
}

export class LogMailProvider implements MailProvider {
  readonly kind = MailProviderKind.Log

  constructor(private readonly options: LogProviderOptions) {}

  async send(message: MailMessage): Promise<MailDeliveryResult> {
    const logger = this.options.logger ?? console
    logger.warn(`${MAIL_NOT_CONFIGURED_MESSAGE} (${this.options.reason}): ${message.kind} para ${maskEmail(message.to)} no se envió`)
    if (this.options.includeBody) logger.warn(`${message.subject}\n${message.text}`)
    return { status: MailDeliveryStatus.NotConfigured, provider: this.kind }
  }
}
