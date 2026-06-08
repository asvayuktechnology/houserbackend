CREATE TABLE "dealers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" varchar(100) NOT NULL,
	"email" varchar(100),
	"contact" varchar(20) NOT NULL,
	"address" text,
	"area" varchar(100),
	"location" varchar(100),
	"logo" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"owner_id" integer NOT NULL,
	"user_id" integer,
	"type" varchar(20),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_by" integer,
	"creator_role" varchar(10),
	"city" varchar(100) NOT NULL,
	"sector" varchar(50),
	"plot_number" varchar(50),
	"category" varchar(50),
	"plot_size" varchar(50),
	"property_status" varchar(10),
	"owner_name" varchar(100),
	"owner_phone" varchar(20),
	"permanent_address" text,
	"comments" text,
	"created_at" timestamp DEFAULT now()
);
