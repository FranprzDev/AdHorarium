ALTER TABLE "commissions" DROP CONSTRAINT "commissions_subject_name_unique";--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "term" varchar(60);--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "source" varchar(120);--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "source_url" varchar(300);--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "source_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_subject_name_period_unique" UNIQUE("subject_id","name","period");