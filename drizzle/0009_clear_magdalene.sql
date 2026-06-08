ALTER TABLE "banners" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "banners" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "banners" ADD COLUMN "image_url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "banners" DROP COLUMN "images";