ALTER TABLE "users" ALTER COLUMN "phone" SET DATA TYPE varchar(15);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE varchar(10);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true;