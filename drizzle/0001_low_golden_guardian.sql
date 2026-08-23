CREATE TYPE "public"."product_gender" AS ENUM('homme', 'femme', 'enfant');--> statement-breakpoint
ALTER TYPE "public"."product_category" ADD VALUE 'accessoires';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "gender" "product_gender";--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "brand" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_code" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "color_hex" text;--> statement-breakpoint
CREATE INDEX "products_gender_idx" ON "products" USING btree ("gender");