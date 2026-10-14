import type { Course } from "@/types/types"
import type { RegimenCorrelatividades } from "@/docs/2023/interfaces/regimen"

/** Minimal correlative graph shared by the 2008 (`Course`) and 2023 (`RegimenCorrelatividades`) plan formats. */
export type PlanNode = {
  code: string
  name: string
  level: number
  /** Every code this node depends on, for any purpose. */
  requires: string[]
}

export type MissingReference = { code: string; missing: string }

const ROMAN_LEVELS: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 }

/** Numeric level for a 2023 plan `nivel` ("I".."VI" or a number). Unknown labels map to NaN. */
export function parseLevel(nivel: number | string): number {
  if (typeof nivel === "number") return nivel
  return ROMAN_LEVELS[nivel.trim()] ?? Number.NaN
}

export function nodesFromCourses(courses: ReadonlyArray<Course>): PlanNode[] {
  return courses.map((course) => ({
    code: course.code,
    name: course.name,
    level: course.level,
    requires: [...new Set([...course.regularesParaCursar, ...course.aprobadasParaCursar, ...course.aprobadasParaRendir])],
  }))
}

export function nodesFromRegimen(regimen: RegimenCorrelatividades): PlanNode[] {
  const nodes: PlanNode[] = []
  for (const level of regimen.regimen_correlatividades) {
    for (const subject of level.asignaturas) {
      nodes.push({
        code: String(subject.numero),
        name: subject.nombre,
        level: parseLevel(level.nivel),
        requires: [...new Set([...subject.para_cursar_aprobar, ...subject.para_cursar_cursar].map(String))],
      })
    }
  }
  return nodes
}

/** Codes that appear more than once in the plan. */
export function findDuplicateCodes(nodes: ReadonlyArray<PlanNode>): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const node of nodes) {
    if (seen.has(node.code)) duplicates.add(node.code)
    seen.add(node.code)
  }
  return [...duplicates]
}

/** Correlatives that point to a code that does not exist in the same plan. */
export function findMissingReferences(nodes: ReadonlyArray<PlanNode>): MissingReference[] {
  const codes = new Set(nodes.map((node) => node.code))
  const missing: MissingReference[] = []
  for (const node of nodes) {
    for (const required of node.requires) {
      if (!codes.has(required)) missing.push({ code: node.code, missing: required })
    }
  }
  return missing
}

/** Returns one cycle (as a code path that starts and ends on the same code) or null when the graph is acyclic. */
export function findCycle(nodes: ReadonlyArray<PlanNode>): string[] | null {
  const byCode = new Map(nodes.map((node) => [node.code, node]))
  const visiting = new Set<string>()
  const done = new Set<string>()
  const path: string[] = []

  const visit = (code: string): string[] | null => {
    if (done.has(code)) return null
    if (visiting.has(code)) return [...path.slice(path.indexOf(code)), code]
    const node = byCode.get(code)
    if (!node) return null
    visiting.add(code)
    path.push(code)
    for (const required of node.requires) {
      const cycle = visit(required)
      if (cycle) return cycle
    }
    path.pop()
    visiting.delete(code)
    done.add(code)
    return null
  }

  for (const node of nodes) {
    const cycle = visit(node.code)
    if (cycle) return cycle
  }
  return null
}

/** Correlatives that require a subject from a higher level than the subject itself. */
export function findForwardLevelReferences(nodes: ReadonlyArray<PlanNode>): MissingReference[] {
  const byCode = new Map(nodes.map((node) => [node.code, node]))
  const forward: MissingReference[] = []
  for (const node of nodes) {
    for (const required of node.requires) {
      const requiredNode = byCode.get(required)
      if (requiredNode && requiredNode.level > node.level) forward.push({ code: node.code, missing: required })
    }
  }
  return forward
}
