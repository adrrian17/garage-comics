CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_message_payload_gin" ON "orders" USING gin ("message_payload");