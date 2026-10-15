import { simulateReadableStream } from "ai"
import { MockLanguageModelV4 } from "ai/test"
import { describe, expect, it } from "vitest"
import type { AssistantContext } from "@/lib/assistant/context"
import { handleAssistantRequest, type AssistantHandlerDeps } from "@/lib/assistant/handler"
import { SlidingWindowRateLimiter } from "@/lib/assistant/rate-limit"
import { AssistantErrorCode, AssistantMessageRole, SubjectStatus } from "@/types/enums"

const CONTEXT: AssistantContext = {
  careerName: "Ingeniería Civil",
  careerPlan: "2023",
  subjects: [
    {
      number: 1,
      name: "Análisis Matemático I",
      level: 1,
      status: SubjectStatus.NoCursada,
      isElective: false,
      examTable: null,
      regularToTake: [],
      approvedToTake: [],
      approvedToSit: [],
      missingRegularToTake: [],
      missingApprovedToTake: [],
      missingApprovedToSit: [],
      canTake: true,
      canSitFinal: false,
    },
  ],
}

function createModel(): MockLanguageModelV4 {
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: "text-start", id: "t1" },
          { type: "text-delta", id: "t1", delta: "Podés cursar " },
          { type: "text-delta", id: "t1", delta: "Análisis Matemático I." },
          { type: "text-end", id: "t1" },
          {
            type: "finish",
            finishReason: { unified: "stop", raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 6, text: 6, reasoning: undefined },
            },
          },
        ],
      }),
    }),
  })
}

function createDeps(overrides: Partial<AssistantHandlerDeps> = {}): AssistantHandlerDeps & { model: MockLanguageModelV4 } {
  const model = createModel()
  return {
    model,
    getUserId: async () => "student-1",
    loadContext: async () => CONTEXT,
    rateLimiter: new SlidingWindowRateLimiter([{ limit: 5, windowMs: 60_000 }]),
    getModel: () => model,
    ...overrides,
  }
}

function chatRequest(text: string): Request {
  return new Request("http://localhost/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ id: "m1", role: AssistantMessageRole.User, parts: [{ type: "text", text }] }] }),
  })
}

describe("handleAssistantRequest", () => {
  it("rejects anonymous requests without calling the model", async () => {
    const deps = createDeps({ getUserId: async () => null })
    const response = await handleAssistantRequest(chatRequest("Hola"), deps)
    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({ code: AssistantErrorCode.Unauthorized })
    expect(deps.model.doStreamCalls).toHaveLength(0)
  })

  it("rejects invalid bodies", async () => {
    const response = await handleAssistantRequest(chatRequest(""), createDeps())
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ code: AssistantErrorCode.InvalidRequest })
  })

  it("asks the student to pick a career first", async () => {
    const response = await handleAssistantRequest(chatRequest("Hola"), createDeps({ loadContext: async () => null }))
    expect(response.status).toBe(409)
  })

  it("rate limits each student", async () => {
    const deps = createDeps({ rateLimiter: new SlidingWindowRateLimiter([{ limit: 1, windowMs: 60_000 }]) })
    expect((await handleAssistantRequest(chatRequest("Hola"), deps)).status).toBe(200)
    const limited = await handleAssistantRequest(chatRequest("Hola de nuevo"), deps)
    expect(limited.status).toBe(429)
    expect(limited.headers.get("Retry-After")).toBe("60")
  })

  it("returns 503 when the model is not configured", async () => {
    const deps = createDeps({
      getModel: () => {
        throw new Error("Missing required environment variable SCHEDULE_ASSISTANT_MODEL")
      },
    })
    const response = await handleAssistantRequest(chatRequest("Hola"), deps)
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ code: AssistantErrorCode.Unavailable })
  })

  it("streams the answer with the student's data as system instructions and no tools", async () => {
    const deps = createDeps()
    const response = await handleAssistantRequest(chatRequest("¿Qué puedo cursar?"), deps)
    expect(response.status).toBe(200)
    const body = await response.text()
    expect(body).toContain("Podés cursar ")
    expect(body).toContain("Análisis Matemático I.")

    expect(deps.model.doStreamCalls).toHaveLength(1)
    const call = deps.model.doStreamCalls[0]
    expect(call.tools ?? []).toHaveLength(0)
    const [system, user] = call.prompt
    expect(system.role).toBe("system")
    expect(JSON.stringify(system.content)).toContain("Ingeniería Civil")
    expect(user.role).toBe("user")
    expect(JSON.stringify(user.content)).toContain("¿Qué puedo cursar?")
  })
})
