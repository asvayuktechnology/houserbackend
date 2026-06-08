CREATE TABLE "banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255),
	"image" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
