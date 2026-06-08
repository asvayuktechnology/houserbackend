ALTER TABLE "dealers" ALTER COLUMN "location" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "dealers" ADD COLUMN "lat" varchar(50) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "dealers" ADD COLUMN "lng" varchar(50) DEFAULT '0';