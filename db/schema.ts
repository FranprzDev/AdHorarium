import { relations, sql } from "drizzle-orm"
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core"
import { MAX_SUBJECT_LEVEL, MIN_SUBJECT_LEVEL } from "@/lib/subject-levels"
import type { ClassSlot, SharedEntry } from "@/lib/schedule/types"
import {
  CommissionPeriod,
  CommissionShift,
  CorrelativePurpose,
  CorrelativeType,
  ExamTable,
  type MailKind,
  ScheduleEntryKind,
  SubjectStatus,
  UserRole,
  UserTokenPurpose,
} from "@/types/enums"

export { MAX_SUBJECT_LEVEL, MIN_SUBJECT_LEVEL }

export const userRoleEnum = pgEnum("user_role", UserRole)
export const subjectStatusEnum = pgEnum("subject_status", SubjectStatus)
export const examTableNameEnum = pgEnum("exam_table_name", ExamTable)
export const correlativePurposeEnum = pgEnum("correlative_purpose", CorrelativePurpose)
export const correlativeRequirementEnum = pgEnum("correlative_requirement", CorrelativeType)
export const commissionShiftEnum = pgEnum("commission_shift", CommissionShift)
export const commissionPeriodEnum = pgEnum("commission_period", CommissionPeriod)
export const scheduleEntryKindEnum = pgEnum("schedule_entry_kind", ScheduleEntryKind)
export const userTokenPurposeEnum = pgEnum("user_token_purpose", UserTokenPurpose)

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

export const careers = pgTable("careers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 16 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  plan: varchar("plan", { length: 16 }).notNull(),
  ...timestamps,
})

export const examTables = pgTable("exam_tables", {
  id: serial("id").primaryKey(),
  name: examTableNameEnum("name").notNull().unique(),
  description: text("description"),
  ...timestamps,
})

export const subjects = pgTable(
  "subjects",
  {
    id: serial("id").primaryKey(),
    careerId: integer("career_id")
      .notNull()
      .references(() => careers.id, { onDelete: "cascade" }),
    number: smallint("number").notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    level: smallint("level").notNull(),
    hours: smallint("hours"),
    isElective: boolean("is_elective").notNull().default(false),
    isBasicScience: boolean("is_basic_science").notNull().default(false),
    examTableId: integer("exam_table_id").references(() => examTables.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    unique("subjects_career_number_unique").on(table.careerId, table.number),
    check("subjects_level_range", sql`${table.level} between ${sql.raw(String(MIN_SUBJECT_LEVEL))} and ${sql.raw(String(MAX_SUBJECT_LEVEL))}`),
    check("subjects_number_positive", sql`${table.number} > 0`),
    check("subjects_hours_positive", sql`${table.hours} is null or ${table.hours} > 0`),
  ],
)

export const subjectCorrelatives = pgTable(
  "subject_correlatives",
  {
    id: serial("id").primaryKey(),
    subjectId: integer("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    requiredSubjectId: integer("required_subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    purpose: correlativePurposeEnum("purpose").notNull(),
    requirementType: correlativeRequirementEnum("requirement_type").notNull(),
    createdAt: timestamps.createdAt,
  },
  (table) => [
    unique("subject_correlatives_unique").on(table.subjectId, table.requiredSubjectId, table.purpose),
    index("subject_correlatives_subject_idx").on(table.subjectId),
    index("subject_correlatives_required_idx").on(table.requiredSubjectId),
    check("subject_correlatives_not_self", sql`${table.subjectId} <> ${table.requiredSubjectId}`),
  ],
)

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true, mode: "date" }),
  image: text("image"),
  /** bcrypt hash for email + password sign in; null for accounts that only use Google. Never select it outside auth code. */
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").notNull().default(UserRole.Student),
  careerId: integer("career_id").references(() => careers.id, { onDelete: "set null" }),
  ...timestamps,
})

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] }), index("accounts_user_idx").on(table.userId)],
)

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
)

export const userSubjectStates = pgTable(
  "user_subject_states",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subjectId: integer("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    status: subjectStatusEnum("status").notNull(),
    grade: numeric("grade", { precision: 4, scale: 2, mode: "number" }),
    updatedAt: timestamps.updatedAt,
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.subjectId] }),
    check("user_subject_states_grade_range", sql`${table.grade} is null or (${table.grade} >= 1 and ${table.grade} <= 10)`),
    check(
      "user_subject_states_grade_requires_promotion",
      sql`${table.grade} is null or ${table.status} = ${sql.raw(`'${SubjectStatus.Promocionada}'`)}`,
    ),
  ],
)

/** Commissions ("comisiones") of a subject with their weekly slots, managed by admins. */
export const commissions = pgTable(
  "commissions",
  {
    id: serial("id").primaryKey(),
    subjectId: integer("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 40 }).notNull(),
    shift: commissionShiftEnum("shift").notNull(),
    period: commissionPeriodEnum("period").notNull(),
    /** Validated with `classSlotsSchema`; stored as JSON so slots change atomically with the commission. */
    slots: jsonb("slots").$type<ClassSlot[]>().notNull(),
    /** Academic term the timetable belongs to, e.g. "2.º cuatrimestre 2026". Null for commissions loaded by hand. */
    term: varchar("term", { length: 60 }),
    /** Who published the timetable, shown to students next to the commission. */
    source: varchar("source", { length: 120 }),
    sourceUrl: varchar("source_url", { length: 300 }),
    /** When the commission was last loaded from its source by an import. */
    sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    unique("commissions_subject_name_period_unique").on(table.subjectId, table.name, table.period),
    index("commissions_subject_idx").on(table.subjectId),
  ],
)

/** One subject of a student's timetable: a catalog commission (by reference) or custom slots. */
export const scheduleEntries = pgTable(
  "schedule_entries",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subjectId: integer("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    kind: scheduleEntryKindEnum("kind").notNull(),
    commissionId: integer("commission_id").references(() => commissions.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 40 }),
    slots: jsonb("slots").$type<ClassSlot[]>(),
    ...timestamps,
  },
  (table) => [
    unique("schedule_entries_user_subject_unique").on(table.userId, table.subjectId),
    index("schedule_entries_commission_idx").on(table.commissionId),
    check(
      "schedule_entries_kind_shape",
      sql`(${table.kind} = ${sql.raw(`'${ScheduleEntryKind.Commission}'`)} and ${table.commissionId} is not null and ${table.label} is null and ${table.slots} is null) or (${table.kind} = ${sql.raw(`'${ScheduleEntryKind.Custom}'`)} and ${table.commissionId} is null and ${table.label} is not null and ${table.slots} is not null)`,
    ),
  ],
)

/** Read-only snapshot of a timetable shared by link. The id is the unguessable token in the URL. */
export const scheduleShares = pgTable(
  "schedule_shares",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    careerId: integer("career_id")
      .notNull()
      .references(() => careers.id, { onDelete: "cascade" }),
    displayName: varchar("display_name", { length: 60 }),
    entries: jsonb("entries").$type<SharedEntry[]>().notNull(),
    createdAt: timestamps.createdAt,
  },
  (table) => [index("schedule_shares_user_idx").on(table.userId)],
)

/** Single-use tokens emailed to a user (password reset links). Only the SHA-256 of the token is stored. */
export const userTokens = pgTable(
  "user_tokens",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: userTokenPurposeEnum("purpose").notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamps.createdAt,
  },
  (table) => [index("user_tokens_user_purpose_idx").on(table.userId, table.purpose)],
)

/** Emails captured instead of sent when `MAIL_OUTBOX=1` (local runs and the e2e suite). Empty in production. */
export const mailOutbox = pgTable(
  "mail_outbox",
  {
    id: serial("id").primaryKey(),
    recipient: text("recipient").notNull(),
    kind: varchar("kind", { length: 40 }).$type<MailKind>().notNull(),
    subject: text("subject").notNull(),
    textBody: text("text_body").notNull(),
    htmlBody: text("html_body").notNull(),
    createdAt: timestamps.createdAt,
  },
  (table) => [index("mail_outbox_recipient_idx").on(table.recipient)],
)

export const careersRelations = relations(careers, ({ many }) => ({
  subjects: many(subjects),
  users: many(users),
}))

export const examTablesRelations = relations(examTables, ({ many }) => ({
  subjects: many(subjects),
}))

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  career: one(careers, { fields: [subjects.careerId], references: [careers.id] }),
  examTable: one(examTables, { fields: [subjects.examTableId], references: [examTables.id] }),
  correlatives: many(subjectCorrelatives, { relationName: "subject" }),
  enables: many(subjectCorrelatives, { relationName: "requiredSubject" }),
  userStates: many(userSubjectStates),
}))

export const subjectCorrelativesRelations = relations(subjectCorrelatives, ({ one }) => ({
  subject: one(subjects, { fields: [subjectCorrelatives.subjectId], references: [subjects.id], relationName: "subject" }),
  requiredSubject: one(subjects, {
    fields: [subjectCorrelatives.requiredSubjectId],
    references: [subjects.id],
    relationName: "requiredSubject",
  }),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  career: one(careers, { fields: [users.careerId], references: [careers.id] }),
  accounts: many(accounts),
  subjectStates: many(userSubjectStates),
}))

export const userSubjectStatesRelations = relations(userSubjectStates, ({ one }) => ({
  user: one(users, { fields: [userSubjectStates.userId], references: [users.id] }),
  subject: one(subjects, { fields: [userSubjectStates.subjectId], references: [subjects.id] }),
}))

export type CareerRow = typeof careers.$inferSelect
export type SubjectRow = typeof subjects.$inferSelect
export type NewSubjectRow = typeof subjects.$inferInsert
export type SubjectCorrelativeRow = typeof subjectCorrelatives.$inferSelect
export type UserRow = typeof users.$inferSelect
export type UserSubjectStateRow = typeof userSubjectStates.$inferSelect
export type CommissionRow = typeof commissions.$inferSelect
export type ScheduleEntryRow = typeof scheduleEntries.$inferSelect
