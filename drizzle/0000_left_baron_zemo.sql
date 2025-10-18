CREATE TYPE "public"."api_key_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."device_type" AS ENUM('SEQUESTER');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('PENDING', 'CONFIRMED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('MINT', 'BURN');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'DEVELOPER', 'ADMIN');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"name" text NOT NULL,
	"status" "api_key_status" DEFAULT 'ACTIVE' NOT NULL,
	"permissions" json DEFAULT '["read:devices","write:devices"]'::json NOT NULL,
	"last_used" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" text PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"website" text,
	"status" "application_status" DEFAULT 'ACTIVE' NOT NULL,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carbon_credit_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"transaction_type" "transaction_type" NOT NULL,
	"amount" numeric(18, 8) NOT NULL,
	"blockchain_tx_hash" text,
	"status" "transaction_status" DEFAULT 'PENDING' NOT NULL,
	"data" json,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_data" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"co2_value" numeric(10, 2) NOT NULL,
	"energy_value" numeric(10, 2) NOT NULL,
	"temperature" numeric(5, 2) NOT NULL,
	"humidity" numeric(5, 2) NOT NULL,
	"data_hash" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iot_devices" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"wallet_address" text NOT NULL,
	"device_type" "device_type" NOT NULL,
	"location" text NOT NULL,
	"project_name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_seen" timestamp,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "iot_devices_device_id_unique" UNIQUE("device_id")
);
--> statement-breakpoint
CREATE TABLE "user_carbon_credits" (
	"id" text PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
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
	"wallet_address" text NOT NULL,
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
CREATE TABLE "users" (
	"wallet_address" text PRIMARY KEY NOT NULL,
	"username" text,
	"email" text,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"profile_data" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
