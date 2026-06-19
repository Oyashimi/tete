CREATE TABLE `anniversaries` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`title` text NOT NULL,
	`event_date` text NOT NULL,
	`recurrence` text DEFAULT 'yearly' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_anniversaries_space` ON `anniversaries` (`space_id`);--> statement-breakpoint
CREATE TABLE `bucket_items` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_bucket_items_space` ON `bucket_items` (`space_id`);--> statement-breakpoint
CREATE TABLE `date_event_notes` (
	`event_id` text NOT NULL,
	`user_id` text NOT NULL,
	`note` text,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	PRIMARY KEY(`event_id`, `user_id`),
	FOREIGN KEY (`event_id`) REFERENCES `date_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `date_events` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`title` text NOT NULL,
	`event_date` text NOT NULL,
	`location` text,
	`status` text DEFAULT 'planned' NOT NULL,
	`source_bucket_id` text,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_date_events_space` ON `date_events` (`space_id`);--> statement-breakpoint
CREATE TABLE `gift_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`owner_user_id` text NOT NULL,
	`direction` text NOT NULL,
	`item` text NOT NULL,
	`occasion` text,
	`date` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_gift_owner` ON `gift_logs` (`space_id`,`owner_user_id`);--> statement-breakpoint
CREATE TABLE `outfit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`owner_user_id` text NOT NULL,
	`description` text,
	`photo_key` text,
	`worn_on` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_outfit_owner` ON `outfit_logs` (`space_id`,`owner_user_id`);--> statement-breakpoint
CREATE TABLE `partner_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`owner_user_id` text NOT NULL,
	`category` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_partner_owner` ON `partner_notes` (`space_id`,`owner_user_id`);--> statement-breakpoint
CREATE TABLE `pre_date_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`owner_user_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_predate_owner` ON `pre_date_notes` (`space_id`,`owner_user_id`);--> statement-breakpoint
CREATE TABLE `skincare_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`owner_user_id` text NOT NULL,
	`condition` integer,
	`items` text,
	`logged_on` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_skincare_owner` ON `skincare_logs` (`space_id`,`owner_user_id`);--> statement-breakpoint
CREATE TABLE `space_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`inviter_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inviter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `space_members` (
	`user_id` text NOT NULL,
	`space_id` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`left_at` text,
	PRIMARY KEY(`user_id`, `space_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_space_members_space` ON `space_members` (`space_id`);--> statement-breakpoint
CREATE TABLE `spaces` (
	`id` text PRIMARY KEY NOT NULL,
	`started_on` text,
	`kind` text DEFAULT 'couple' NOT NULL,
	`display_name` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan` text NOT NULL,
	`status` text NOT NULL,
	`current_period_end` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);