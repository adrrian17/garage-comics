CREATE TYPE "public"."submission_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"correo" varchar(254) NOT NULL,
	"portafolio" text NOT NULL,
	"pitch" text NOT NULL,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "email_idx" ON "submissions" USING btree ("correo");--> statement-breakpoint
CREATE INDEX "status_idx" ON "submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "created_at_idx" ON "submissions" USING btree ("created_at");