// ドメインの「取りうる値」を1か所に定義（DBのCHECK相当・UIの選択肢にも使う）

export const SPACE_KIND = ["couple", "solo"] as const;
export type SpaceKind = (typeof SPACE_KIND)[number];

// デート予定/記録の状態：予定 → 実施済み
export const DATE_EVENT_STATUS = ["planned", "done"] as const;
export type DateEventStatus = (typeof DATE_EVENT_STATUS)[number];

// バケツリスト項目：未定 → 予定入れた → 達成
export const BUCKET_STATUS = ["open", "scheduled", "done"] as const;
export type BucketStatus = (typeof BUCKET_STATUS)[number];

// 記念日の繰り返し
export const RECURRENCE = ["none", "monthly", "yearly"] as const;
export type Recurrence = (typeof RECURRENCE)[number];

// プレゼントの方向
export const GIFT_DIRECTION = ["given", "received"] as const;
export type GiftDirection = (typeof GIFT_DIRECTION)[number];

// 好み図鑑・地雷メモの分類
export const PARTNER_NOTE_CATEGORY = [
  "like",
  "dislike",
  "allergy",
  "landmine",
  "other",
] as const;
export type PartnerNoteCategory = (typeof PARTNER_NOTE_CATEGORY)[number];

// 課金プラン
export const PLAN = ["free", "solo", "couple"] as const;
export type Plan = (typeof PLAN)[number];
