CREATE TABLE "post_properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_by" integer NOT NULL,
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
	"images" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "property_unlocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"property_id" integer NOT NULL,
	"payment_id" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "post_properties" ADD CONSTRAINT "post_properties_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;