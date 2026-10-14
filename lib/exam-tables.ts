import { ExamTable } from "@/types/enums"

/** Exam table names in display order. */
export const EXAM_TABLES: ExamTable[] = [ExamTable.MesaI, ExamTable.MesaII, ExamTable.MesaIII]

export type SubjectsByExamTable = Record<ExamTable, string[]>

export function createEmptyExamTableMap(): SubjectsByExamTable {
  return {
    [ExamTable.MesaI]: [],
    [ExamTable.MesaII]: [],
    [ExamTable.MesaIII]: [],
  }
}
