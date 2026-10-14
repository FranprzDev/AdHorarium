/**
 * Finite domains used across the app.
 *
 * String values are part of the persisted contract (Supabase rows, URL/query
 * values, Radix `value` props), so they must not be renamed.
 */

/** Academic state of a subject for a student, stored in `user_subject_states.status`. */
export enum SubjectStatus {
  Promocionada = "promocionada",
  Regular = "regular",
  Cursando = "cursando",
  NoCursada = "no_cursada",
}

/** Visual variants supported by the shared `Badge` component. */
export enum BadgeVariant {
  Default = "default",
  Secondary = "secondary",
  Destructive = "destructive",
  Outline = "outline",
  Promocionado = "promocionado",
  Aprobado = "aprobado",
  Regular = "regular",
  Cursando = "cursando",
  NoCursando = "no_cursando",
}

/** UTN exam tables ("mesas") a subject can be examined in. */
export enum ExamTable {
  MesaI = "Mesa I",
  MesaII = "Mesa II",
  MesaIII = "Mesa III",
}

/** Subject group filter on the subjects manager page. */
export enum SubjectFilter {
  All = "all",
  Basic = "basic",
  Career = "career",
}

/** What a correlative requirement is for: taking the course or sitting its final exam. */
export enum CorrelativePurpose {
  Cursar = "cursar",
  Rendir = "rendir",
}

/** Which kind of prerequisite is shown when the purpose is taking the course. */
export enum CorrelativeType {
  Regulares = "regulares",
  Aprobadas = "aprobadas",
}

/** Curriculum plan years available in the app. */
export enum StudyPlan {
  Plan2008 = "2008",
  Plan2023 = "2023",
}

/** Layout of the exam table search results. */
export enum ExamViewMode {
  List = "list",
  Table = "table",
}

/** OAuth providers enabled for sign in. */
export enum AuthProvider {
  Google = "google",
}
