import { z } from "zod";
import {
  BUCKET_STATUS,
  GIFT_DIRECTION,
  PARTNER_NOTE_CATEGORY,
  RECURRENCE,
  SPACE_KIND,
} from "./enums";

// API入力のバリデーション＝そのまま型にもなる。
// 例として共有系（デート予定・バケツ・記念日）と個人系（スキンケア）を定義。

// 日付・日時はいずれも文字列。min(1) のみで「形式は検証していない」点に注意
// （厳密な .datetime() を入れると下記 createdAt の不一致で parse が壊れるため）。
const isoDate = z.string().min(1); // 期待フォーマット: "YYYY-MM-DD"
// 期待フォーマット: ISO8601 の "YYYY-MM-DDTHH:MM:SS"（T 区切り。終日は当日0時）。
// フロント/モックはこの形（例 "2026-06-17T13:00:00"）。DB の start_at もこれに揃える。
// ⚠ 例外: createdAt 等の DB 既定値は SQLite CURRENT_TIMESTAMP = "YYYY-MM-DD HH:MM:SS"
//   （T も Z も無く UTC）を返すため、現状この型は ISO8601 を保証しない。
//   API レスポンス層を実装する際に ISO8601 へ正規化する想定（未実装）。
const isoDateTime = z.string().min(1);

// --- デート記録・予定（型D：共有エンティティ） ---
// カレンダーは Googleカレンダー型：終日 or 時刻指定を持つ。
// - allDay=true：startAt の日付だけ使う（記念日的な終日予定）
// - allDay=false：startAt〜endAt の時刻で時間軸に並ぶ
export const createDateEventSchema = z.object({
  title: z.string().min(1).max(100),
  allDay: z.boolean().default(false),
  startAt: isoDateTime,
  endAt: isoDateTime.nullable().optional(),
  location: z.string().max(200).optional(),
  memo: z.string().max(2000).optional(), // 共有メモ（2人で見る）
  sourceBucketId: z.string().uuid().optional(),
});
export type CreateDateEvent = z.infer<typeof createDateEventSchema>;

// デート予定/記録のAPIレスポンス契約（フロントの表示で使う形）。
// personalNote は date_event_notes 由来＝「自分の」個人メモだけを載せる
// （相手のメモは取りに行かない＝strategy.md の秘匿原則）。
export const dateEventSchema = z.object({
  id: z.string(),
  spaceId: z.string(),
  title: z.string(),
  allDay: z.boolean(),
  startAt: isoDateTime,
  endAt: isoDateTime.nullable(),
  location: z.string().nullable(),
  memo: z.string().nullable(), // 共有メモ
  personalNote: z.string().nullable(), // 自分の個人メモ
  createdBy: z.string(),
  createdAt: isoDateTime,
});
export type DateEvent = z.infer<typeof dateEventSchema>;

// 予定に紐づく「個人メモ」（本人だけ見える）
export const upsertDateEventNoteSchema = z.object({
  note: z.string().max(2000),
});
export type UpsertDateEventNote = z.infer<typeof upsertDateEventNoteSchema>;

// --- 記念日（型A） ---
export const createAnniversarySchema = z.object({
  title: z.string().min(1).max(100),
  eventDate: isoDate,
  recurrence: z.enum(RECURRENCE).default("yearly"),
});
export type CreateAnniversary = z.infer<typeof createAnniversarySchema>;

// 記念日のAPIレスポンス契約。繰り返し（毎年/毎月）は展開せず基準日＋ルールを返し、
// 表示する月の発生日はフロント側で計算する（strategy.md の方針）。
export const anniversarySchema = z.object({
  id: z.string(),
  spaceId: z.string(),
  title: z.string(),
  eventDate: isoDate, // 基準日 YYYY-MM-DD
  recurrence: z.enum(RECURRENCE),
  createdAt: isoDateTime,
});
export type Anniversary = z.infer<typeof anniversarySchema>;

// --- バケツリスト（型A） ---
export const createBucketItemSchema = z.object({
  title: z.string().min(1).max(200),
  status: z.enum(BUCKET_STATUS).default("open"),
});
export type CreateBucketItem = z.infer<typeof createBucketItemSchema>;

// バケツリスト項目のAPIレスポンス契約。共有エンティティ＝2人で見る。
// 雑記ボード（やりたいこと・行きたい場所・おすすめ等）として使う想定で、
// 投稿者（createdBy）を持ち、UIでは自分/相手を左右に振り分ける。
export const bucketItemSchema = z.object({
  id: z.string(),
  spaceId: z.string(),
  title: z.string().min(1).max(200),
  status: z.enum(BUCKET_STATUS),
  createdBy: z.string(),
  createdAt: isoDateTime,
});
export type BucketItem = z.infer<typeof bucketItemSchema>;

// --- スキンケアログ（型B：個人） ---
export const createSkincareLogSchema = z.object({
  condition: z.number().int().min(1).max(5).optional(),
  items: z.array(z.string().max(100)).max(50).optional(),
  loggedOn: isoDate,
});
export type CreateSkincareLog = z.infer<typeof createSkincareLogSchema>;

// --- プレゼント記録（型B：個人） ---
export const createGiftLogSchema = z.object({
  direction: z.enum(GIFT_DIRECTION),
  item: z.string().min(1).max(200),
  occasion: z.string().max(100).optional(),
  date: isoDate.optional(),
});
export type CreateGiftLog = z.infer<typeof createGiftLogSchema>;

// --- 地雷・好み図鑑（型B：個人） ---
export const createPartnerNoteSchema = z.object({
  category: z.enum(PARTNER_NOTE_CATEGORY),
  content: z.string().min(1).max(500),
});
export type CreatePartnerNote = z.infer<typeof createPartnerNoteSchema>;

// --- スペース ---
export const createSpaceSchema = z.object({
  startedOn: isoDate.optional(), // 付き合った日
  displayName: z.string().max(50).optional(), // 相手の表示名（案A）
});
export type CreateSpace = z.infer<typeof createSpaceSchema>;

// スペースのAPIレスポンス契約（一覧・単体取得で共通）。
// フロントとAPIで同じ型を使うための単一ソース。
export const spaceSchema = z.object({
  id: z.string(),
  kind: z.enum(SPACE_KIND),
  displayName: z.string().nullable(),
  startedOn: isoDate.nullable(),
  createdAt: isoDateTime,
  joinedAt: isoDateTime, // 自分がこの箱に参加した日時（space_members より）
});
export type Space = z.infer<typeof spaceSchema>;
