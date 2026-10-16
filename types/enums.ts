/**
 * Finite domains used across the app.
 *
 * String values are part of the persisted contract (Postgres enums in db/schema.ts,
 * URL/query values, Radix `value` props), so they must not be renamed.
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

/** Layout of the exam table search results. */
export enum ExamViewMode {
  List = "list",
  Table = "table",
}

/** Role of an application user, stored in `users.role`. */
export enum UserRole {
  Student = "student",
  Admin = "admin",
}

/** Codes of the careers seeded from the official UTN plans, stored in `careers.code`. */
export enum CareerCode {
  Sistemas = "ISI",
  Electronica = "IE",
  Civil = "IC",
  Mecanica = "IM",
  EnergiaElectrica = "IEE",
}

/** Environment variables the server reads explicitly. */
export enum EnvVar {
  DatabaseUrl = "DATABASE_URL",
  AdminEmails = "ADMIN_EMAILS",
  AuthGoogleId = "AUTH_GOOGLE_ID",
  AuthGoogleSecret = "AUTH_GOOGLE_SECRET",
  /** Vercel AI Gateway model id used by the schedule assistant, e.g. "openai/gpt-4.1-mini". */
  ScheduleAssistantModel = "SCHEDULE_ASSISTANT_MODEL",
}

/** Auth.js providers enabled for sign in (provider ids). */
export enum AuthProvider {
  Google = "google",
  Credentials = "credentials",
}

/**
 * Codes returned to the client when an email + password sign in fails.
 * They are deliberately coarse so the UI never reveals whether an email is registered.
 */
export enum CredentialsErrorCode {
  InvalidCredentials = "invalid_credentials",
  RateLimited = "rate_limited",
}

/** Outcome of a student registration attempt. */
export enum RegistrationErrorCode {
  InvalidInput = "invalid_input",
  Unavailable = "unavailable",
  RateLimited = "rate_limited",
}

/** Color treatment of the brand logo depending on the surface it sits on. */
export enum LogoTone {
  /** Ink wordmark for light surfaces (adapts to the dark theme). */
  Default = "default",
  /** Light wordmark for the ink navy sidebar. */
  Inverted = "inverted",
}

/** Color scheme choices offered by the theme toggle (next-themes values). */
export enum ThemeMode {
  Light = "light",
  Dark = "dark",
}

/** Roles of the chat messages the schedule assistant accepts from the client. */
export enum AssistantMessageRole {
  User = "user",
  Assistant = "assistant",
}

/** Error codes returned by the schedule assistant API, shown to the student as Spanish messages. */
export enum AssistantErrorCode {
  Unauthorized = "unauthorized",
  CareerRequired = "career_required",
  InvalidRequest = "invalid_request",
  RateLimited = "rate_limited",
  Unavailable = "unavailable",
}

/** Request lifecycle of the chat panel (mirrors the AI SDK `ChatStatus` values). */
export enum AssistantChatStatus {
  Submitted = "submitted",
  Streaming = "streaming",
  Ready = "ready",
  Error = "error",
}

/** Weekday a class slot happens on, stored inside commission and timetable slots. */
export enum ClassDay {
  Lunes = "lunes",
  Martes = "martes",
  Miercoles = "miercoles",
  Jueves = "jueves",
  Viernes = "viernes",
  Sabado = "sabado",
}

/** Shift ("turno") of a commission, stored in `commissions.shift`. */
export enum CommissionShift {
  Manana = "manana",
  Tarde = "tarde",
  Noche = "noche",
}

/** Teaching period of a commission, stored in `commissions.period`. */
export enum CommissionPeriod {
  Anual = "anual",
  PrimerCuatrimestre = "primer_cuatrimestre",
  SegundoCuatrimestre = "segundo_cuatrimestre",
}

/** Origin of a timetable entry, stored in `schedule_entries.kind`. */
export enum ScheduleEntryKind {
  /** References a commission of the admin catalog: its slots are always read live. */
  Commission = "commission",
  /** Slots typed by the student for a subject that has no commission loaded. */
  Custom = "custom",
}

/** How a shared timetable is imported into the student's own timetable. */
export enum ScheduleImportMode {
  /** Adds only the subjects the student does not have yet. */
  Merge = "merge",
  /** Deletes the current timetable and copies the shared one. */
  Replace = "replace",
}

/** File formats the timetable can be exported to. */
export enum ScheduleExportFormat {
  Pdf = "pdf",
  Png = "png",
}

/** Severity of a structured server log line (one JSON object per line in Vercel Runtime Logs). */
export enum LogLevel {
  Error = "error",
}

/** What a structured server log line reports; filter Vercel Runtime Logs by it. */
export enum LogEvent {
  RequestError = "request_error",
}
