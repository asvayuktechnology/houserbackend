CREATE TYPE "public"."banner_category" AS ENUM('homepage', 'properties', 'dealer');--> statement-breakpoint
ALTER TABLE "banners" ADD COLUMN "category" "banner_category" DEFAULT 'homepage' NOT NULL;