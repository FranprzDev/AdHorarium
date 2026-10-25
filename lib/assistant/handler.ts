import { stepCountIs, streamText, type LanguageModel, type ModelMessage } from "ai"
import type { AssistantContext } from "@/lib/assistant/context"
import { ASSISTANT_ERROR_MESSAGES, type AssistantErrorBody } from "@/lib/assistant/errors"
import { buildAssistantTools } from "@/lib/assistant/impact-tool"
import { buildAssistantSystemPrompt } from "@/lib/assistant/prompt"
import type { SlidingWindowRateLimiter } from "@/lib/rate-limit"
import { AssistantRequestError, parseAssistantRequest, type AssistantChatMessage } from "@/lib/assistant/request"
import { AssistantErrorCode, AssistantMessageRole } from "@/types/enums"

/** Output cap per answer: enough for a subject list, small enough to keep costs predictable. */
export const ASSISTANT_MAX_OUTPUT_TOKENS = 900
const ASSISTANT_TEMPERATURE = 0.2

export type AssistantHandlerDeps = {
  /** Id of the signed-in user, or null for anonymous requests. */
  getUserId: () => Promise<string | null>
  /** Student data for the prompt, or null when the user has not selected a career. */
  loadContext: (userId: string) => Promise<AssistantContext | null>
  rateLimiter: SlidingWindowRateLimiter
  /** Resolves the model lazily so a missing configuration becomes a 503 instead of a crash. */
  getModel: () => LanguageModel
}

const HTTP_STATUS: Record<AssistantErrorCode, number> = {
  [AssistantErrorCode.Unauthorized]: 401,
  [AssistantErrorCode.CareerRequired]: 409,
  [AssistantErrorCode.InvalidRequest]: 400,
  [AssistantErrorCode.RateLimited]: 429,
  [AssistantErrorCode.Unavailable]: 503,
}

function errorResponse(code: AssistantErrorCode, message = ASSISTANT_ERROR_MESSAGES[code], headers?: HeadersInit): Response {
  const body: AssistantErrorBody = { code, message }
  const responseHeaders = new Headers(headers)
  responseHeaders.set("Content-Type", "application/json")
  return new Response(JSON.stringify(body), { status: HTTP_STATUS[code], headers: responseHeaders })
}

function toModelMessages(messages: ReadonlyArray<AssistantChatMessage>): ModelMessage[] {
  const modelMessages: ModelMessage[] = []
  for (const message of messages) {
    if (message.role === AssistantMessageRole.User) modelMessages.push({ role: "user", content: message.content })
    else modelMessages.push({ role: "assistant", content: message.content })
  }
  return modelMessages
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

/**
 * Query-only schedule assistant: authenticates the student, rate limits, grounds the system prompt
 * on their own plan and streams the model answer. Its only tool is a read-only impact calculator and it never writes data.
 */
export async function handleAssistantRequest(request: Request, deps: AssistantHandlerDeps): Promise<Response> {
  const userId = await deps.getUserId()
  if (!userId) return errorResponse(AssistantErrorCode.Unauthorized)

  let messages: AssistantChatMessage[]
  try {
    messages = parseAssistantRequest(await readJson(request))
  } catch (error) {
    if (error instanceof AssistantRequestError) return errorResponse(AssistantErrorCode.InvalidRequest, error.message)
    throw error
  }

  const decision = deps.rateLimiter.consume(userId)
  if (!decision.allowed) {
    return errorResponse(AssistantErrorCode.RateLimited, undefined, { "Retry-After": String(decision.retryAfterSeconds) })
  }

  const context = await deps.loadContext(userId)
  if (!context) return errorResponse(AssistantErrorCode.CareerRequired)

  let model: LanguageModel
  try {
    model = deps.getModel()
  } catch (error) {
    console.error("Schedule assistant model is not configured:", error)
    return errorResponse(AssistantErrorCode.Unavailable)
  }

  const result = streamText({
    model,
    instructions: buildAssistantSystemPrompt(context),
    messages: toModelMessages(messages),
    tools: buildAssistantTools(context),
    stopWhen: stepCountIs(3),
    maxOutputTokens: ASSISTANT_MAX_OUTPUT_TOKENS,
    temperature: ASSISTANT_TEMPERATURE,
    abortSignal: request.signal,
  })

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      console.error("Schedule assistant stream failed:", error)
      return ASSISTANT_ERROR_MESSAGES[AssistantErrorCode.Unavailable]
    },
  })
}
