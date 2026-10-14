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

/** Maps the `exam_tables.id` foreign key to its exam table (1 → Mesa I, 2 → Mesa II, otherwise Mesa III). */
export function examTableFromId(examTableId: number): ExamTable {
  if (examTableId === 1) return ExamTable.MesaI
  if (examTableId === 2) return ExamTable.MesaII
  return ExamTable.MesaIII
}
