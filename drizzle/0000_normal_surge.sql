CREATE TYPE "public"."api_key_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."device_type" AS ENUM('SEQUESTER');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('PENDING', 'CONFIRMED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('MINT', 'BURN');--> statement-breakpoint
CREATE TABLE "company" (
	"company_id" serial PRIMARY KEY NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"address" varchar(255),
	"website" varchar(255),
	"location" varchar(255),
	"wallet_address" varchar(255),
	CONSTRAINT "company_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE "company_credit" (
	"credit_id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"total_credit" numeric(10, 2) NOT NULL,
	"current_credit" numeric(10, 2) NOT NULL,
	"sold_credit" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"offer_price" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "credit_history" (
	"history_id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"sold_amount" numeric(10, 2) NOT NULL,
	"sold_price" numeric(10, 2) NOT NULL,
	"buyer_info" varchar(255),
	"sale_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "device" (
	"device_id" serial PRIMARY KEY NOT NULL,
	"key_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"sequestered_carbon_credits" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_credit_history" (
	"history_id" serial PRIMARY KEY NOT NULL,
	"device_id" integer NOT NULL,
	"sequestered_credits" numeric(10, 2) NOT NULL,
	"time_interval_start" timestamp NOT NULL,
	"time_interval_end" timestamp
);
--> statement-breakpoint
CREATE TABLE "iot_keys" (
	"key_id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"key_value" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usertable" (
	"wallet_address" varchar(255) PRIMARY KEY NOT NULL
);
