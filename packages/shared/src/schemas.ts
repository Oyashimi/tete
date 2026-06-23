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

const isoDate = z.string().min(1); // YYYY-MM-DD 想定
const isoDateTime = z.string().min(1); // ISO8601 日時想定（終日のときは日付の0時）

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
  startAt: z.string(),
  endAt: z.string().nullable(),
  location: z.string().nullable(),
  memo: z.string().nullable(), // 共有メモ
  personalNote: z.string().nullable(), // 自分の個人メモ
  createdBy: z.string(),
  createdAt: z.string(),
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
  eventDate: z.string(), // 基準日 YYYY-MM-DD
  recurrence: z.enum(RECURRENCE),
  createdAt: z.string(),
});
export type Anniversary = z.infer<typeof anniversarySchema>;

// --- バケツリスト（型A） ---
export const createBucketItemSchema = z.object({
  title: z.string().min(1).max(200),
  status: z.enum(BUCKET_STATUS).default("open"),
});
export type CreateBucketItem = z.infer<typeof createBucketItemSchema>;

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
  startedOn: z.string().nullable(),
  createdAt: z.string(),
  joinedAt: z.string(), // 自分がこの箱に参加した日時（space_members より）
});
export type Space = z.infer<typeof spaceSchema>;
