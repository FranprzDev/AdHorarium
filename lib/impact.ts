import type { SubjectStatus } from "@/types/enums"

export type ImpactSubject = {
  number: number
  name: string
  level: number
  status: SubjectStatus
  regularToTake: ReadonlyArray<number>
  approvedToTake: ReadonlyArray<number>
  approvedToSit: ReadonlyArray<number>
}

export type RegularityLossSubjects<T extends ImpactSubject> = {
  direct: T[]
  laterInChain: T[]
  alreadyRequiredApproval: T[]
  finalsNeedingApproval: T[]
}

function byLevelAndNumber(a: ImpactSubject, b: ImpactSubject): number {
  return a.level - b.level || a.number - b.number
}

function requiresToTake(subject: ImpactSubject, number: number): boolean {
  return subject.regularToTake.includes(number) || subject.approvedToTake.includes(number)
}

function collectChain<T extends ImpactSubject>(seeds: ReadonlyArray<T>, subjects: ReadonlyArray<T>): T[] {
  const reached = new Set<number>(seeds.map((subject) => subject.number))
  const chain: T[] = []
  const queue: T[] = [...seeds]
  while (queue.length > 0) {
    const current = queue.shift() as T
    for (const candidate of subjects) {
      if (reached.has(candidate.number) || !requiresToTake(candidate, current.number)) continue
      reached.add(candidate.number)
      queue.push(candidate)
      chain.push(candidate)
    }
  }
  return chain.sort(byLevelAndNumber)
}

export function findRegularityLossSubjects<T extends ImpactSubject>(root: T, subjects: ReadonlyArray<T>): RegularityLossSubjects<T> {
  const others = subjects.filter((subject) => subject.number !== root.number)
  const direct = others.filter((subject) => subject.regularToTake.includes(root.number)).sort(byLevelAndNumber)
  const laterInChain = collectChain(direct, others)
  const affected = new Set<number>([...direct, ...laterInChain].map((subject) => subject.number))
  const alreadyRequiredApproval = others
    .filter((subject) => subject.approvedToTake.includes(root.number) && !affected.has(subject.number))
    .sort(byLevelAndNumber)
  const finalsNeedingApproval = others.filter((subject) => subject.approvedToSit.includes(root.number)).sort(byLevelAndNumber)
  return { direct, laterInChain, alreadyRequiredApproval, finalsNeedingApproval }
}
