import { z } from "zod"
import type { Mailbox } from "@/lib/mail/types"

const NAMED_MAILBOX = /^\s*"?([^"<>]*?)"?\s*<([^<>\s]+)>\s*$/
const mailboxEmailSchema = z.string().trim().email()

export class InvalidMailboxError extends Error {
  constructor() {
    super("MAIL_FROM must be an email address or 'Name <email>'")
    this.name = "InvalidMailboxError"
  }
}

export function parseMailbox(raw: string): Mailbox {
  const named = NAMED_MAILBOX.exec(raw)
  const email = mailboxEmailSchema.safeParse(named ? named[2] : raw)
  if (!email.success) throw new InvalidMailboxError()
  const name = named?.[1]?.trim()
  return { email: email.data, name: name ? name : null }
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (!domain) return "***"
  return `${local.slice(0, 1)}***@${domain}`
}
