import { describe, expect, it } from "vitest"
import {
  findCycle,
  findDuplicateCodes,
  findForwardLevelReferences,
  findMissingReferences,
  nodesFromCourses,
  nodesFromRegimen,
  parseLevel,
  type PlanNode,
} from "@/lib/plan-integrity"
import { coursesData2008 } from "@/data/courses-2008"
import { MAX_SUBJECT_LEVEL } from "@/db/schema"
import { plan_ing_civil_2023 } from "@/docs/2023/IngCivil"
import { plan_ing_electrica_2023 } from "@/docs/2023/IngElectrica"
import { plan_ing_electronica_2023 } from "@/docs/2023/IngElectronica"
import { plan_ing_en_sistemas_2023 } from "@/docs/2023/IngEnSistemas"
import { plan_ing_mecanica_2023 } from "@/docs/2023/IngMecanica"

const PLANS: Array<[string, PlanNode[]]> = [
  ["Sistemas 2008", nodesFromCourses(coursesData2008)],
  ["Civil 2023", nodesFromRegimen(plan_ing_civil_2023)],
  ["Eléctrica 2023", nodesFromRegimen(plan_ing_electrica_2023)],
  ["Electrónica 2023", nodesFromRegimen(plan_ing_electronica_2023)],
  ["Sistemas 2023", nodesFromRegimen(plan_ing_en_sistemas_2023)],
  ["Mecánica 2023", nodesFromRegimen(plan_ing_mecanica_2023)],
]

describe.each(PLANS)("%s plan integrity", (_name, nodes) => {
  it("has subjects", () => {
    expect(nodes.length).toBeGreaterThan(30)
  })

  it("has unique subject codes", () => {
    expect(findDuplicateCodes(nodes)).toEqual([])
  })

  it("only references subjects that exist in the same plan", () => {
    expect(findMissingReferences(nodes)).toEqual([])
  })

  it("has no correlative cycles", () => {
    expect(findCycle(nodes)).toBeNull()
  })

  it("has no subject that requires itself", () => {
    expect(nodes.filter((node) => node.requires.includes(node.code))).toEqual([])
  })

  it("never requires a subject from a higher level", () => {
    expect(findForwardLevelReferences(nodes)).toEqual([])
  })

  it("uses levels 1 to 6 only", () => {
    for (const node of nodes) {
      expect(node.level).toBeGreaterThanOrEqual(1)
      expect(node.level).toBeLessThanOrEqual(MAX_SUBJECT_LEVEL)
    }
  })
})

describe("integrity helpers", () => {
  const node = (code: string, requires: string[], level = 1): PlanNode => ({ code, name: code, level, requires })

  it("parses roman and numeric levels", () => {
    expect(parseLevel("I")).toBe(1)
    expect(parseLevel(" V ")).toBe(5)
    expect(parseLevel(3)).toBe(3)
    expect(parseLevel("X")).toBeNaN()
  })

  it("detects a cycle and returns its path", () => {
    const cycle = findCycle([node("a", ["b"]), node("b", ["c"]), node("c", ["a"])])
    expect(cycle).not.toBeNull()
    expect(cycle?.[0]).toBe(cycle?.[cycle.length - 1])
  })

  it("reports missing references and duplicates", () => {
    expect(findMissingReferences([node("a", ["zz"])])).toEqual([{ code: "a", missing: "zz" }])
    expect(findDuplicateCodes([node("a", []), node("a", [])])).toEqual(["a"])
  })

  it("reports references to a higher level", () => {
    expect(findForwardLevelReferences([node("a", ["b"], 1), node("b", [], 2)])).toEqual([{ code: "a", missing: "b" }])
  })
})
