import { AssistantErrorCode } from "@/types/enums"

/** JSON body returned by the assistant API when a request is rejected before streaming. */
export type AssistantErrorBody = {
  code: AssistantErrorCode
  message: string
}

export const ASSISTANT_ERROR_MESSAGES: Record<AssistantErrorCode, string> = {
  [AssistantErrorCode.Unauthorized]: "Necesitás iniciar sesión para usar el asistente.",
  [AssistantErrorCode.CareerRequired]: "Elegí tu carrera para que el asistente conozca tu plan de estudios.",
  [AssistantErrorCode.InvalidRequest]: "No pudimos procesar tu pregunta.",
  [AssistantErrorCode.RateLimited]: "Hiciste muchas preguntas seguidas. Esperá un momento y volvé a intentar.",
  [AssistantErrorCode.Unavailable]: "El asistente no está disponible en este momento. Probá de nuevo más tarde.",
}

const ERROR_CODES = new Set<string>(Object.values(AssistantErrorCode))

function isAssistantErrorBody(value: unknown): value is AssistantErrorBody {
  if (typeof value !== "object" || value === null) return false
  if (!("code" in value) || !("message" in value)) return false
  return typeof value.code === "string" && ERROR_CODES.has(value.code) && typeof value.message === "string"
}

/**
 * Message to show for an error raised by the chat transport. HTTP errors carry the JSON body as
 * their message; anything else falls back to the generic "unavailable" text.
 */
export function getAssistantErrorMessage(error: Error): string {
  try {
    const parsed: unknown = JSON.parse(error.message)
    if (isAssistantErrorBody(parsed)) return parsed.message
  } catch {
    // Not a JSON body (network error, aborted stream): use the generic message below.
  }
  return ASSISTANT_ERROR_MESSAGES[AssistantErrorCode.Unavailable]
}
