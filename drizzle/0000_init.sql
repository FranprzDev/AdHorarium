CREATE TYPE "public"."correlative_purpose" AS ENUM('cursar', 'rendir');--> statement-breakpoint
CREATE TYPE "public"."correlative_requirement" AS ENUM('regulares', 'aprobadas');--> statement-breakpoint
CREATE TYPE "public"."exam_table_name" AS ENUM('Mesa I', 'Mesa II', 'Mesa III');--> statement-breakpoint
CREATE TYPE "public"."subject_status" AS ENUM('promocionada', 'regular', 'cursando', 'no_cursada');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('student', 'admin');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "careers" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(16) NOT NULL,
	"name" varchar(160) NOT NULL,
	"plan" varchar(16) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "careers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "exam_tables" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" "exam_table_name" NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exam_tables_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject_correlatives" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_id" integer NOT NULL,
	"required_subject_id" integer NOT NULL,
	"purpose" "correlative_purpose" NOT NULL,
	"requirement_type" "correlative_requirement" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subject_correlatives_unique" UNIQUE("subject_id","required_subject_id","purpose"),
	CONSTRAINT "subject_correlatives_not_self" CHECK ("subject_correlatives"."subject_id" <> "subject_correlatives"."required_subject_id")
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"career_id" integer NOT NULL,
	"number" smallint NOT NULL,
	"name" varchar(200) NOT NULL,
	"level" smallint NOT NULL,
	"hours" smallint,
	"is_elective" boolean DEFAULT false NOT NULL,
	"is_basic_science" boolean DEFAULT false NOT NULL,
	"exam_table_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subjects_career_number_unique" UNIQUE("career_id","number"),
	CONSTRAINT "subjects_level_range" CHECK ("subjects"."level" between 1 and 6),
	CONSTRAINT "subjects_number_positive" CHECK ("subjects"."number" > 0),
	CONSTRAINT "subjects_hours_positive" CHECK ("subjects"."hours" is null or "subjects"."hours" > 0)
);
--> statement-breakpoint
CREATE TABLE "user_subject_states" (
	"user_id" text NOT NULL,
	"subject_id" integer NOT NULL,
	"status" "subject_status" NOT NULL,
	"grade" numeric(4, 2),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_subject_states_user_id_subject_id_pk" PRIMARY KEY("user_id","subject_id"),
	CONSTRAINT "user_subject_states_grade_range" CHECK ("user_subject_states"."grade" is null or ("user_subject_states"."grade" >= 1 and "user_subject_states"."grade" <= 10)),
	CONSTRAINT "user_subject_states_grade_requires_promotion" CHECK ("user_subject_states"."grade" is null or "user_subject_states"."status" = 'promocionada')
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"image" text,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"career_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_correlatives" ADD CONSTRAINT "subject_correlatives_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_correlatives" ADD CONSTRAINT "subject_correlatives_required_subject_id_subjects_id_fk" FOREIGN KEY ("required_subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_career_id_careers_id_fk" FOREIGN KEY ("career_id") REFERENCES "public"."careers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_exam_table_id_exam_tables_id_fk" FOREIGN KEY ("exam_table_id") REFERENCES "public"."exam_tables"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subject_states" ADD CONSTRAINT "user_subject_states_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subject_states" ADD CONSTRAINT "user_subject_states_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_career_id_careers_id_fk" FOREIGN KEY ("career_id") REFERENCES "public"."careers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subject_correlatives_subject_idx" ON "subject_correlatives" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "subject_correlatives_required_idx" ON "subject_correlatives" USING btree ("required_subject_id");