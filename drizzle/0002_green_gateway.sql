ALTER TABLE "api_keys" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "api_keys" CASCADE;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "api_key_hash" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "api_key_prefix" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "api_key_name" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "api_key_status" "api_key_status" DEFAULT 'ACTIVE';--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "api_key_last_used" timestamp;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "api_key_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "api_key_permissions" json;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_api_key_hash_unique" UNIQUE("api_key_hash");