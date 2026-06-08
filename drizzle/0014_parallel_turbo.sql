CREATE TABLE "fixedproperties" (
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
	"images" json,
	"created_at" timestamp DEFAULT now()
);
