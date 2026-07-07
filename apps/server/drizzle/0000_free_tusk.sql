CREATE TABLE `schemas` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`content` text NOT NULL,
	`rendered_output` text NOT NULL,
	`charset` text DEFAULT 'unicode' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`content` text NOT NULL,
	`rendered_output` text NOT NULL
);
