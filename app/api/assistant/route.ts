import { gateway } from "ai"
import { auth } from "@/auth"
import { getDb } from "@/db/client"
import { listPlanSubjects } from "@/db/queries/catalog"
import { listCareerCommissions, listScheduleEntries } from "@/db/queries/schedule"
import { getUserCareer, listUserSubjectStates } from "@/db/queries/student"
import { buildAssistantContext, type AssistantContext } from "@/lib/assistant/context"
import { handleAssistantRequest } from "@/lib/assistant/handler"
import { ASSISTANT_RATE_LIMITS } from "@/lib/assistant/rate-limit"
import { SlidingWindowRateLimiter } from "@/lib/rate-limit"
import { getScheduleAssistantModelId } from "@/lib/env"

export const maxDuration = 30

const rateLimiter = new SlidingWindowRateLimiter(ASSISTANT_RATE_LIMITS)

async function getUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

async function loadContext(userId: string): Promise<AssistantContext | null> {
  const db = getDb()
  const career = await getUserCareer(db, userId)
  if (!career) return null
  const [subjects, states, commissions, timetable] = await Promise.all([
    listPlanSubjects(db, career.id),
    listUserSubjectStates(db, userId, career.id),
    listCareerCommissions(db, career.id),
    listScheduleEntries(db, userId, career.id),
  ])
  return buildAssistantContext({ career, subjects, states, commissions, timetable })
}

export async function POST(request: Request): Promise<Response> {
  return handleAssistantRequest(request, {
    getUserId,
    loadContext,
    rateLimiter,
    getModel: () => gateway(getScheduleAssistantModelId()),
  })
}
