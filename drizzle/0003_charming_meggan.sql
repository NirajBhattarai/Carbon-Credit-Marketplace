CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"key_hash" text NOT NULL,
	"status" "api_key_status" DEFAULT 'ACTIVE' NOT NULL,
	"expires_at" timestamp,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "user_carbon_credits" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"credits" numeric(18, 8) DEFAULT '0' NOT NULL,
	"co2_reduced" numeric(10, 2) DEFAULT '0' NOT NULL,
	"energy_saved" numeric(10, 2) DEFAULT '0' NOT NULL,
	"temperature_impact" numeric(5, 2) DEFAULT '0' NOT NULL,
	"humidity_impact" numeric(5, 2) DEFAULT '0' NOT NULL,
	"is_online" boolean DEFAULT false NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_credit_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"credits_earned" numeric(18, 8) NOT NULL,
	"co2_reduced" numeric(10, 2) NOT NULL,
	"energy_saved" numeric(10, 2) NOT NULL,
	"temperature_impact" numeric(5, 2) NOT NULL,
	"humidity_impact" numeric(5, 2) NOT NULL,
	"source" text NOT NULL,
	"source_id" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT "applications_api_key_hash_unique";--> statement-breakpoint
ALTER TABLE "iot_devices" ALTER COLUMN "device_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."device_type";--> statement-breakpoint
CREATE TYPE "public"."device_type" AS ENUM('SEQUESTER', 'EMITTER');--> statement-breakpoint
ALTER TABLE "iot_devices" ALTER COLUMN "device_type" SET DATA TYPE "public"."device_type" USING "device_type"::"public"."device_type";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "api_key_hash";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "api_key_prefix";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "api_key_name";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "api_key_status";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "api_key_last_used";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "api_key_expires_at";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "api_key_permissions";