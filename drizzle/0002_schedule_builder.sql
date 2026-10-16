CREATE TYPE "public"."commission_period" AS ENUM('anual', 'primer_cuatrimestre', 'segundo_cuatrimestre');--> statement-breakpoint
CREATE TYPE "public"."commission_shift" AS ENUM('manana', 'tarde', 'noche');--> statement-breakpoint
CREATE TYPE "public"."schedule_entry_kind" AS ENUM('commission', 'custom');--> statement-breakpoint
CREATE TABLE "commissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_id" integer NOT NULL,
	"name" varchar(40) NOT NULL,
	"shift" "commission_shift" NOT NULL,
	"period" "commission_period" NOT NULL,
	"slots" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commissions_subject_name_unique" UNIQUE("subject_id","name")
);
--> statement-breakpoint
CREATE TABLE "schedule_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subject_id" integer NOT NULL,
	"kind" "schedule_entry_kind" NOT NULL,
	"commission_id" integer,
	"label" varchar(40),
	"slots" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "schedule_entries_user_subject_unique" UNIQUE("user_id","subject_id"),
	CONSTRAINT "schedule_entries_kind_shape" CHECK (("schedule_entries"."kind" = 'commission' and "schedule_entries"."commission_id" is not null and "schedule_entries"."label" is null and "schedule_entries"."slots" is null) or ("schedule_entries"."kind" = 'custom' and "schedule_entries"."commission_id" is null and "schedule_entries"."label" is not null and "schedule_entries"."slots" is not null))
);
--> statement-breakpoint
CREATE TABLE "schedule_shares" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"career_id" integer NOT NULL,
	"display_name" varchar(60),
	"entries" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_entries" ADD CONSTRAINT "schedule_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_entries" ADD CONSTRAINT "schedule_entries_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_entries" ADD CONSTRAINT "schedule_entries_commission_id_commissions_id_fk" FOREIGN KEY ("commission_id") REFERENCES "public"."commissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_shares" ADD CONSTRAINT "schedule_shares_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_shares" ADD CONSTRAINT "schedule_shares_career_id_careers_id_fk" FOREIGN KEY ("career_id") REFERENCES "public"."careers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "commissions_subject_idx" ON "commissions" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "schedule_entries_commission_idx" ON "schedule_entries" USING btree ("commission_id");--> statement-breakpoint
CREATE INDEX "schedule_shares_user_idx" ON "schedule_shares" USING btree ("user_id");