export interface Course {
  code: string
  name: string
  level: number // Year level (1-5)
  regularesParaCursar: string[] // Course codes required as "regular" to take this course
  aprobadasParaCursar: string[] // Course codes required as "approved" to take this course
  aprobadasParaRendir: string[] // Course codes required as "approved" to take the final exam
  hours: number
  semester?: 1 | 2 // 1 for first semester, 2 for second semester
  isElective?: boolean // Flag for elective courses
}
