CREATE TABLE "otps" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" varchar(20) NOT NULL,
	"otp" varchar(6) NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" varchar(20) NOT NULL,
	"role" varchar(20) DEFAULT 'user',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
