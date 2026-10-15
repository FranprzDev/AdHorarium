import { z } from "zod"
import { AssistantMessageRole } from "@/types/enums"

/** Longest message a student can type in the chat. */
export const MAX_USER_MESSAGE_LENGTH = 1000
/** Most messages (user and assistant) sent to the model per request; older ones are dropped. */
export const MAX_HISTORY_MESSAGES = 12
/** Upper bound for the conversation text forwarded to the model. */
export const MAX_CONVERSATION_LENGTH = 16000
/** Most messages accepted in a request body before trimming. */
export const MAX_REQUEST_MESSAGES = 60

const TEXT_PART_TYPE = "text"

const partSchema = z.object({ type: z.string().max(64), text: z.string().optional() })

const messageSchema = z.object({
  role: z.nativeEnum(AssistantMessageRole),
  parts: z.array(partSchema).max(32),
})

export const assistantRequestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(MAX_REQUEST_MESSAGES),
})

type AssistantRequestPart = z.infer<typeof partSchema>

/** Text-only message forwarded to the model. */
export type AssistantChatMessage = {
  role: AssistantMessageRole
  content: string
}

export class AssistantRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AssistantRequestError"
  }
}

function extractText(parts: ReadonlyArray<AssistantRequestPart>): string {
  const texts: string[] = []
  for (const part of parts) {
    if (part.type === TEXT_PART_TYPE && part.text) texts.push(part.text)
  }
  return texts.join("\n").trim()
}

/**
 * Validates the chat history sent by `useChat` and reduces it to text messages.
 * Only text parts are kept; the last message must come from the student and fit the length limit.
 */
export function parseAssistantRequest(body: unknown): AssistantChatMessage[] {
  const parsed = assistantRequestSchema.safeParse(body)
  if (!parsed.success) throw new AssistantRequestError("La conversación enviada no es válida.")

  const messages: AssistantChatMessage[] = []
  for (const message of parsed.data.messages.slice(-MAX_HISTORY_MESSAGES)) {
    const content = extractText(message.parts)
    if (content) messages.push({ role: message.role, content })
  }

  const last = messages.at(-1)
  if (!last || last.role !== AssistantMessageRole.User) throw new AssistantRequestError("Escribí una pregunta para el asistente.")
  if (last.content.length > MAX_USER_MESSAGE_LENGTH) {
    throw new AssistantRequestError(`La pregunta no puede superar los ${MAX_USER_MESSAGE_LENGTH} caracteres.`)
  }

  let total = 0
  for (const message of messages) total += message.content.length
  if (total > MAX_CONVERSATION_LENGTH) {
    throw new AssistantRequestError("La conversación es demasiado larga. Empezá una nueva para seguir.")
  }
  return messages
}
