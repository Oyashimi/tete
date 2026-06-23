-- date_events を最終スキーマへ再構築する。
-- 目的：
--   1) event_date(YYYY-MM-DD) を start_at(ISO8601 日時) へ移送し、過去のデート予定/記録の日時情報を保全する。
--      終日前提のため当日0時（'T00:00:00'）を付与。既に start_at がある行はそれを優先。
--   2) start_at を DB 上でも NOT NULL に確定する（SQLite は既存列への後付け NOT NULL を ALTER で付けられないため再構築が必要）。
--   3) event_date 列を除去する。
-- DROP TABLE 時の暗黙 DELETE が date_event_notes へカスケードしないよう、foreign_keys を一時的に無効化する。
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_date_events` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`title` text NOT NULL,
	`all_day` integer DEFAULT false NOT NULL,
	`start_at` text NOT NULL,
	`end_at` text,
	`location` text,
	`memo` text,
	`source_bucket_id` text,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_date_events`(`id`, `space_id`, `title`, `all_day`, `start_at`, `end_at`, `location`, `memo`, `source_bucket_id`, `created_by`, `created_at`)
SELECT `id`, `space_id`, `title`, `all_day`, COALESCE(NULLIF(`start_at`, ''), `event_date` || 'T00:00:00'), `end_at`, `location`, `memo`, `source_bucket_id`, `created_by`, `created_at` FROM `date_events`;--> statement-breakpoint
DROP TABLE `date_events`;--> statement-breakpoint
ALTER TABLE `__new_date_events` RENAME TO `date_events`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_date_events_space` ON `date_events` (`space_id`);
