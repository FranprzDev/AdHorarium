import { SubjectStatus } from "@/types/enums"

export type ImpactSubject = {
  number: number
  name: string
  level: number
  status: SubjectStatus
  regularToTake: ReadonlyArray<number>
  approvedToTake: ReadonlyArray<number>
  approvedToSit: ReadonlyArray<number>
}

export type ImpactEntry = { name: string; level: number; status: SubjectStatus }

export type RegularityLossImpact = {
  subject: { name: string; level: number; status: SubjectStatus }
  loses: {
    finalOfSubject: boolean
    directToTake: ImpactEntry[]
    laterInChain: ImpactEntry[]
  }
  alreadyRequiredApproval: ImpactEntry[]
  finalsNeedingApproval: ImpactEntry[]
}

function byLevelAndNumber(a: ImpactSubject, b: ImpactSubject): number {
  return a.level - b.level || a.number - b.number
}

function toEntry(subject: ImpactSubject): ImpactEntry {
  return { name: subject.name, level: subject.level, status: subject.status }
}

function requiresToTake(subject: ImpactSubject, number: number): boolean {
  return subject.regularToTake.includes(number) || subject.approvedToTake.includes(number)
}

function collectChain(seeds: ReadonlyArray<ImpactSubject>, subjects: ReadonlyArray<ImpactSubject>): ImpactSubject[] {
  const reached = new Set<number>(seeds.map((subject) => subject.number))
  const chain: ImpactSubject[] = []
  const queue: ImpactSubject[] = [...seeds]
  while (queue.length > 0) {
    const current = queue.shift() as ImpactSubject
    for (const candidate of subjects) {
      if (reached.has(candidate.number) || !requiresToTake(candidate, current.number)) continue
      reached.add(candidate.number)
      queue.push(candidate)
      chain.push(candidate)
    }
  }
  return chain.sort(byLevelAndNumber)
}

export function computeRegularityLossImpact(root: ImpactSubject, subjects: ReadonlyArray<ImpactSubject>): RegularityLossImpact {
  const others = subjects.filter((subject) => subject.number !== root.number)
  const direct = others.filter((subject) => subject.regularToTake.includes(root.number)).sort(byLevelAndNumber)
  const approvalOnly = others
    .filter((subject) => subject.approvedToTake.includes(root.number) && !subject.regularToTake.includes(root.number))
    .sort(byLevelAndNumber)
  const laterInChain = collectChain(direct, others).filter((subject) => subject.number !== root.number)
  const finals = others.filter((subject) => subject.approvedToSit.includes(root.number)).sort(byLevelAndNumber)

  return {
    subject: { name: root.name, level: root.level, status: root.status },
    loses: {
      finalOfSubject: root.status === SubjectStatus.Regular,
      directToTake: direct.map(toEntry),
      laterInChain: laterInChain.map(toEntry),
    },
    alreadyRequiredApproval: approvalOnly.map(toEntry),
    finalsNeedingApproval: finals.map(toEntry),
  }
}
