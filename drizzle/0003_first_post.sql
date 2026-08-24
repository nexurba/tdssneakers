ALTER TABLE "orders" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "address_line1" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "address_line2" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "province" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "postal_code" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "country" text DEFAULT 'CA';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "latitude" numeric(9, 6);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "longitude" numeric(9, 6);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "address_validated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "address_source" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "square_payment_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "square_order_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_square_payment_idx" ON "orders" USING btree ("square_payment_id");