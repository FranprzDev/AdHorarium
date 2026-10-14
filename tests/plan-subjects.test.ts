import { describe, expect, it } from "vitest"
import { buildPlanSubjects, groupByLevel } from "@/lib/plan-subjects"
import { CorrelativePurpose, CorrelativeType, ExamTable } from "@/types/enums"

const row = (id: number, level: number, number = id) => ({
  id,
  careerId: 1,
  number,
  name: `S${id}`,
  level,
  hours: null,
  isElective: false,
  isBasicScience: false,
  examTable: ExamTable.MesaI,
})

describe("buildPlanSubjects", () => {
  const subjects = buildPlanSubjects(
    [row(3, 2), row(1, 1), row(2, 1)],
    [
      { subjectId: 3, requiredSubjectId: 1, purpose: CorrelativePurpose.Cursar, requirementType: CorrelativeType.Regulares },
      { subjectId: 3, requiredSubjectId: 2, purpose: CorrelativePurpose.Cursar, requirementType: CorrelativeType.Aprobadas },
      { subjectId: 3, requiredSubjectId: 2, purpose: CorrelativePurpose.Rendir, requirementType: CorrelativeType.Aprobadas },
      { subjectId: 3, requiredSubjectId: 99, purpose: CorrelativePurpose.Cursar, requirementType: CorrelativeType.Regulares },
    ],
  )

  it("sorts by level and number", () => {
    expect(subjects.map((s) => s.id)).toEqual([1, 2, 3])
  })

  it("splits correlatives by purpose and requirement type and ignores unknown subjects", () => {
    const third = subjects[2]
    expect(third.regularToTakeIds).toEqual([1])
    expect(third.approvedToTakeIds).toEqual([2])
    expect(third.approvedToSitIds).toEqual([2])
  })

  it("derives the subjects each one enables for taking", () => {
    expect(subjects[0].enablesIds).toEqual([3])
    expect(subjects[1].enablesIds).toEqual([3])
    expect(subjects[2].enablesIds).toEqual([])
  })

  it("groups subjects by level in ascending order", () => {
    const groups = groupByLevel(subjects)
    expect([...groups.keys()]).toEqual([1, 2])
    expect(groups.get(1)?.map((s) => s.id)).toEqual([1, 2])
  })
})
