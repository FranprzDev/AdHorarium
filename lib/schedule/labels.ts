import { ClassDay, CommissionPeriod, CommissionShift } from "@/types/enums"

/** Weekdays in timetable order. */
export const CLASS_DAYS: ReadonlyArray<ClassDay> = [
  ClassDay.Lunes,
  ClassDay.Martes,
  ClassDay.Miercoles,
  ClassDay.Jueves,
  ClassDay.Viernes,
  ClassDay.Sabado,
]

export const CLASS_DAY_LABELS: Record<ClassDay, string> = {
  [ClassDay.Lunes]: "Lunes",
  [ClassDay.Martes]: "Martes",
  [ClassDay.Miercoles]: "Miércoles",
  [ClassDay.Jueves]: "Jueves",
  [ClassDay.Viernes]: "Viernes",
  [ClassDay.Sabado]: "Sábado",
}

export const CLASS_DAY_SHORT_LABELS: Record<ClassDay, string> = {
  [ClassDay.Lunes]: "Lun",
  [ClassDay.Martes]: "Mar",
  [ClassDay.Miercoles]: "Mié",
  [ClassDay.Jueves]: "Jue",
  [ClassDay.Viernes]: "Vie",
  [ClassDay.Sabado]: "Sáb",
}

export const COMMISSION_SHIFT_LABELS: Record<CommissionShift, string> = {
  [CommissionShift.Manana]: "Mañana",
  [CommissionShift.Tarde]: "Tarde",
  [CommissionShift.Noche]: "Noche",
}

export const COMMISSION_PERIOD_LABELS: Record<CommissionPeriod, string> = {
  [CommissionPeriod.Anual]: "Anual",
  [CommissionPeriod.PrimerCuatrimestre]: "1.er cuatrimestre",
  [CommissionPeriod.SegundoCuatrimestre]: "2.º cuatrimestre",
}

/** Public route of a shared timetable: `${SHARED_SCHEDULE_PATH}/<shareId>`. */
export const SHARED_SCHEDULE_PATH = "/horarios/compartido"
