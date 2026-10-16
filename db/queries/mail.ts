import type { AppDatabase } from "@/db/client"
import { mailOutbox } from "@/db/schema"
import type { MailMessage } from "@/lib/mail/types"

export async function storeOutboxMail(db: AppDatabase, message: MailMessage): Promise<void> {
  await db.insert(mailOutbox).values({
    recipient: message.to,
    kind: message.kind,
    subject: message.subject,
    textBody: message.text,
    htmlBody: message.html,
  })
}
