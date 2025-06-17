export interface Course {
  code: string
  name: string
  level: number 
  regularesParaCursar: string[] 
  aprobadasParaCursar: string[] 
  aprobadasParaRendir: string[]
  hours: number
  semester?: 1 | 2 
  isElective?: boolean 
}

export type SubjectStatus = 'NO_CURSANDO' | 'CURSANDO' | 'REGULAR' | 'PROMOCIONADO'

export interface Subject {
  id: number
  name: string
  career_id: number
  exam_table_id: number | null
  created_at: string
  career_name?: string
  typical_system_engineer: boolean
  typical_year: number
  typical_semester: number
  credits: number
  subject_number?: number
}

export interface UserSubject {
  id: number
  user_id: string
  subject_id: number
  status: SubjectStatus
  grade?: number
  created_at: string
  updated_at: string
}

export interface SubjectWithStatus extends Subject {
  status: SubjectStatus
  grade?: number
}
