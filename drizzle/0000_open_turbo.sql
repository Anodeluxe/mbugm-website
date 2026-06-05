CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"day_label" text NOT NULL,
	"session_no" integer NOT NULL,
	"quota" integer NOT NULL
);
