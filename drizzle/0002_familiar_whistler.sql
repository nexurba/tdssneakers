CREATE TYPE "public"."size_scale" AS ENUM('men', 'women');--> statement-breakpoint
ALTER TYPE "public"."product_gender" ADD VALUE 'unisex';--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "stock" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "size_scale" "size_scale";