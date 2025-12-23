CREATE TABLE "otps" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text,
	"otp" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"username" text,
	"password_hash" text,
	"profile_url" text,
	"isActive" integer DEFAULT 0,
	"reset_token" text,
	"reset_token_expires" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
