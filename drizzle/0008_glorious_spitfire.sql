ALTER TABLE "banners" ADD COLUMN "images" text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "banners" DROP COLUMN "image";