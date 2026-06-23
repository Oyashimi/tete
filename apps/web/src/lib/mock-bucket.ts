import { ref } from "vue";
import type { BucketStatus } from "@tete/shared";
import type { BucketItem } from "@tete/shared";

// 【モック】ふたりの雑記ボード（バケツリスト）用のダミーデータ。
// 2人状態スペース（id=1111…）に紐づく。API 紐付け時は composable の中身を
// fetch に差し替えるだけにする（events / anniversaries と同じ作法）。
const PAIRED_SPACE_ID = "11111111-1111-4111-8111-111111111111";
const ME = "mock-user-1"; // 自分（はなこ）
const PARTNER = "mock-partner-1"; // 相手（たろう）

// 殴り書きの共有メモ群。createdBy で投稿者を分け、UIで左右に振り分ける。
const INITIAL_ITEMS: BucketItem[] = [
  {
    id: "b1",
    spaceId: PAIRED_SPACE_ID,
    title: "鎌倉行きたい🏖",
    status: "open",
    createdBy: ME,
    createdAt: "2026-06-01T09:00:00.000Z",
  },
  {
    id: "b2",
    spaceId: PAIRED_SPACE_ID,
    title: "葬送のフリーレン見たい📺",
    status: "open",
    createdBy: PARTNER,
    createdAt: "2026-06-01T09:05:00.000Z",
  },
  {
    id: "b3",
    spaceId: PAIRED_SPACE_ID,
    title: "MBTI診断いっしょにやろう",
    status: "open",
    createdBy: ME,
    createdAt: "2026-06-02T20:10:00.000Z",
  },
  {
    id: "b4",
    spaceId: PAIRED_SPACE_ID,
    title: "近所のラーメン屋、行ってきた！🍜",
    status: "done",
    createdBy: PARTNER,
    createdAt: "2026-06-03T12:30:00.000Z",
  },
];

// リアクティブストア（モック）。ここを書き換えるだけで画面の computed に即反映。
export const bucketItems = ref<BucketItem[]>(INITIAL_ITEMS);

function newId(): string {
  return crypto.randomUUID();
}

// メモを1件追加して、生成された BucketItem を返す。
export function addBucketItem(
  spaceId: string,
  createdBy: string,
  title: string,
): BucketItem {
  const item: BucketItem = {
    id: newId(),
    spaceId,
    title,
    status: "open",
    createdBy,
    createdAt: new Date().toISOString(),
  };
  bucketItems.value = [...bucketItems.value, item];
  return item;
}

// メモの本文を書き換える。
export function updateBucketItem(id: string, title: string): void {
  bucketItems.value = bucketItems.value.map((i) =>
    i.id === id ? { ...i, title } : i,
  );
}

// メモを削除する。
export function removeBucketItem(id: string): void {
  bucketItems.value = bucketItems.value.filter((i) => i.id !== id);
}

// 「できた！」印などステータスを切り替える。
export function setBucketStatus(id: string, status: BucketStatus): void {
  bucketItems.value = bucketItems.value.map((i) =>
    i.id === id ? { ...i, status } : i,
  );
}
