ALTER TABLE `date_events` ADD `all_day` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `date_events` ADD `start_at` text;--> statement-breakpoint
ALTER TABLE `date_events` ADD `end_at` text;--> statement-breakpoint
ALTER TABLE `date_events` ADD `memo` text;