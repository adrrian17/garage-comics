ALTER TABLE "orders" ADD COLUMN "processed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "confirmed" boolean DEFAULT false NOT NULL;