import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import type { SpaceKind } from "@tete/shared";

// ── 共通ヘルパ ──────────────────────────────────────────────
// 全テーブルのIDはUUIDで統一（URLに出ても総当たりされない）
const uuidPk = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () =>
  text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`);

// ── 認証（Better Auth コアスキーマ） ──────────────────────────
// Better Auth が直接読み書きする4テーブル（user / session / account / verification）。
// Better Auth は値を JS の Date で渡すため、日付列は `integer({ mode: "timestamp" })`
// にする（既存の text + CURRENT_TIMESTAMP では Date を保存できず壊れる）。
// 列の TS プロパティ名は Better Auth のフィールド名（camelCase）に厳密一致させる
// ＝ server/auth.ts のアダプタが名前でマッピングするため。
const authCreatedAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date());
const authUpdatedAt = () =>
  integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date());

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // Better Auth が採番
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  createdAt: authCreatedAt(),
  updatedAt: authUpdatedAt(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: authCreatedAt(),
  updatedAt: authUpdatedAt(),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(), // プロバイダ側のユーザーID
  providerId: text("provider_id").notNull(), // 'google' 等
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"), // メール/パスワード認証用（本プロジェクトでは未使用）
  createdAt: authCreatedAt(),
  updatedAt: authUpdatedAt(),
});

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: authCreatedAt(),
  updatedAt: authUpdatedAt(),
});

// ── 中核：スペース / 所属 / 招待 ───────────────────────────────
// スペース = 1つの関係＝全データの箱
export const spaces = sqliteTable("spaces", {
  id: uuidPk(),
  startedOn: text("started_on"), // 付き合った日（日数表示の基準）
  kind: text("kind").$type<SpaceKind>().notNull().default("couple"), // 'couple' | 'solo'
  displayName: text("display_name"), // 相手の表示名（案A：ソロ時に使用）
  createdAt: createdAt(),
  deletedAt: text("deleted_at"), // 論理削除（別れ→アーカイブ）
});

// 所属 = 多対多の中間テーブル（誰がどの箱にいるか）
export const spaceMembers = sqliteTable(
  "space_members",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    joinedAt: createdAt(),
    leftAt: text("left_at"), // 退出（論理削除）＝ペア解除のクールダウン判定に使う
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.spaceId] }), // 複合キー＝索引＆二重所属防止
    index("idx_space_members_space").on(t.spaceId),
  ],
);

// 招待 = どのスペースへの招待か
export const spaceInvitations = sqliteTable("space_invitations", {
  id: uuidPk(), // 招待リンクのトークン
  spaceId: text("space_id")
    .notNull()
    .references(() => spaces.id, { onDelete: "cascade" }),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => users.id),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: createdAt(),
});

// ── 型A：共有固定（space_id のみ） ─────────────────────────────
export const anniversaries = sqliteTable(
  "anniversaries",
  {
    id: uuidPk(),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    eventDate: text("event_date").notNull(), // 基準日（繰り返しは展開保存しない）
    recurrence: text("recurrence").notNull().default("yearly"),
    createdAt: createdAt(),
  },
  (t) => [index("idx_anniversaries_space").on(t.spaceId)],
);

export const bucketItems = sqliteTable(
  "bucket_items",
  {
    id: uuidPk(),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    status: text("status").notNull().default("open"), // open | scheduled | done
    createdAt: createdAt(),
  },
  (t) => [index("idx_bucket_items_space").on(t.spaceId)],
);

// ── 型D：共有エンティティ＋個人メモ（デート記録・予定） ──────────
export const dateEvents = sqliteTable(
  "date_events",
  {
    id: uuidPk(),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    eventDate: text("event_date").notNull(), // 予定日 or 行った日
    location: text("location"),
    status: text("status").notNull().default("planned"), // planned | done
    sourceBucketId: text("source_bucket_id"), // バケツリスト由来なら紐付け
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [index("idx_date_events_space").on(t.spaceId)],
);

// 各自の個人メモ（本人だけ見える）= 予定×ユーザーの複合キー
export const dateEventNotes = sqliteTable(
  "date_event_notes",
  {
    eventId: text("event_id")
      .notNull()
      .references(() => dateEvents.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    note: text("note"),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.userId] })],
);

// ── 型B：個人固定（space_id + owner_user_id） ──────────────────
// 共通形：owner_user_id を持つ＝本人だけ。索引は (space_id, owner_user_id)。
export const skincareLogs = sqliteTable(
  "skincare_logs",
  {
    id: uuidPk(),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => users.id),
    condition: integer("condition"), // 1〜5
    items: text("items"), // JSON文字列（使用アイテム）
    loggedOn: text("logged_on").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("idx_skincare_owner").on(t.spaceId, t.ownerUserId)],
);

export const outfitLogs = sqliteTable(
  "outfit_logs",
  {
    id: uuidPk(),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => users.id),
    description: text("description"),
    photoKey: text("photo_key"), // R2のキー
    wornOn: text("worn_on"),
    createdAt: createdAt(),
  },
  (t) => [index("idx_outfit_owner").on(t.spaceId, t.ownerUserId)],
);

export const preDateNotes = sqliteTable(
  "pre_date_notes",
  {
    id: uuidPk(),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => users.id),
    content: text("content").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("idx_predate_owner").on(t.spaceId, t.ownerUserId)],
);

export const giftLogs = sqliteTable(
  "gift_logs",
  {
    id: uuidPk(),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => users.id),
    direction: text("direction").notNull(), // given | received
    item: text("item").notNull(),
    occasion: text("occasion"),
    date: text("date"),
    createdAt: createdAt(),
  },
  (t) => [index("idx_gift_owner").on(t.spaceId, t.ownerUserId)],
);

export const partnerNotes = sqliteTable(
  "partner_notes",
  {
    id: uuidPk(),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => users.id),
    category: text("category").notNull(), // like|dislike|allergy|landmine|other
    content: text("content").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("idx_partner_owner").on(t.spaceId, t.ownerUserId)],
);

// ── 課金（エンタイトルメント判定用・本人に紐づく） ────────────────
export const subscriptions = sqliteTable("subscriptions", {
  id: uuidPk(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  plan: text("plan").notNull(), // free | solo | couple
  status: text("status").notNull(), // active | canceled | past_due ...
  currentPeriodEnd: text("current_period_end"),
  createdAt: createdAt(),
});
