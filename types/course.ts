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
