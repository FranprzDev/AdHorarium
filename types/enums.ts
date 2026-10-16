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
  /** Brevo transactional email API key. Without it emails are not sent (only logged on the server). */
  BrevoApiKey = "BREVO_API_KEY",
  /** Sender of every email, e.g. "AdHorarium <no-reply@adhorarium.app>". Must be a sender verified in Brevo. */
  MailFrom = "MAIL_FROM",
  /** "1" stores emails in the `mail_outbox` table instead of sending them (local runs and e2e only; ignored in production). */
  MailOutbox = "MAIL_OUTBOX",
  /** Set by Vercel: "production", "preview" or "development". */
  VercelEnv = "VERCEL_ENV",
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

/** Text formats accepted by the admin commission import. */
export enum CommissionImportFormat {
  Csv = "csv",
  Json = "json",
}

/** What an import does with one commission of the file, compared with the catalog. */
export enum CommissionImportStatus {
  Create = "create",
  Update = "update",
  Unchanged = "unchanged",
}

/** Errors block the import; warnings are shown in the preview but do not. */
export enum ImportIssueLevel {
  Error = "error",
  Warning = "warning",
}

/** Where outgoing emails go. */
export enum MailProviderKind {
  /** Brevo transactional email API. */
  Brevo = "brevo",
  /** Nothing is sent: the server logs that email delivery is not configured. */
  Log = "log",
  /** Stored in the `mail_outbox` table so local runs and the e2e suite can read them. */
  Outbox = "outbox",
}

/** Kind of transactional email, stored in `mail_outbox.kind` and sent to Brevo as a tag. */
export enum MailKind {
  PasswordReset = "password_reset",
  PasswordResetGoogleAccount = "password_reset_google_account",
  EmailVerification = "email_verification",
}

/** Outcome of handing an email to the configured provider. */
export enum MailDeliveryStatus {
  Sent = "sent",
  NotConfigured = "not_configured",
  Failed = "failed",
}

/** Purpose of a single-use token emailed to a user, stored in `user_tokens.purpose`. */
export enum UserTokenPurpose {
  PasswordReset = "password_reset",
  EmailVerification = "email_verification",
}

/** Outcome of a password reset request or of setting a new password with a reset token. */
export enum PasswordResetErrorCode {
  InvalidInput = "invalid_input",
  InvalidToken = "invalid_token",
  RateLimited = "rate_limited",
  Unavailable = "unavailable",
}

/** What a password reset request ended up emailing (logged server-side, never shown to the requester). */
export enum PasswordResetDelivery {
  NoAccount = "no_account",
  GoogleAccount = "google_account",
  ResetLink = "reset_link",
}

/** Outcome of confirming an email address or asking for a new confirmation link. */
export enum EmailVerificationErrorCode {
  InvalidToken = "invalid_token",
  AlreadyVerified = "already_verified",
  RateLimited = "rate_limited",
  Unavailable = "unavailable",
}
