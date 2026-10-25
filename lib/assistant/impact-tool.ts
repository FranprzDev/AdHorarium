import { tool } from "ai"
import { z } from "zod"
import type { AssistantContext } from "@/lib/assistant/context"
import { computeRegularityLossImpact, type ImpactSubject } from "@/lib/assistant/impact"
import { matchSubject } from "@/lib/assistant/subject-match"

function toImpactSubjects(context: AssistantContext): ImpactSubject[] {
  return context.subjects.map((subject) => ({
    number: subject.number,
    name: subject.name,
    level: subject.level,
    status: subject.status,
    regularToTake: subject.regularToTake,
    approvedToTake: subject.approvedToTake,
    approvedToSit: subject.approvedToSit,
  }))
}

export function resolveRegularityLossImpact(context: AssistantContext, query: string) {
  const subjects = toImpactSubjects(context)
  const match = matchSubject(query, subjects)
  if (match.kind === "ambiguous") {
    return { result: "ambiguous" as const, options: match.candidates.map(({ name, level }) => ({ name, level })) }
  }
  if (match.kind === "not_found") {
    return { result: "not_found" as const, closest: match.suggestions.map(({ name, level }) => ({ name, level })) }
  }
  return { result: "found" as const, impact: computeRegularityLossImpact(match.subject, subjects) }
}

export function buildAssistantTools(context: AssistantContext) {
  return {
    impacto_de_recursar_materia: tool({
      description:
        "Calcula qué materias del plan del estudiante deja de poder cursar si pierde la regularidad (recursa) una materia: las que se cortan directamente y las que se afectan después por la cadena de correlativas, ordenadas por nivel. Usala siempre que pregunte qué le corta o qué materias pierde por recursar una materia; no lo calcules vos. Si devuelve ambiguous, preguntale cuál de las opciones quiso decir y no elijas una. Si devuelve not_found, ofrecé las opciones cercanas. Cada materia trae el estado del estudiante para que puedas aclarar cuáles ya cursó o aprobó.",
      inputSchema: z.object({
        materia: z.string().min(1).max(120).describe('Nombre de la materia tal como lo escribió el estudiante, por ejemplo "Diseño de Sistemas" o "estructura de datos"'),
      }),
      execute: async ({ materia }) => resolveRegularityLossImpact(context, materia),
    }),
  }
}
