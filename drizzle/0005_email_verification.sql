ALTER TYPE "public"."user_token_purpose" ADD VALUE 'email_verification';--> statement-breakpoint
UPDATE "users" SET "email_verified" = now() WHERE "email_verified" IS NULL AND "email" IN ('estudiante.demo@adhorarium.app', 'admin.demo@adhorarium.app');--> statement-breakpoint
UPDATE "users" SET "email_verified" = now() WHERE "email_verified" IS NULL AND "id" IN (SELECT "user_id" FROM "accounts" WHERE "provider" = 'google');
