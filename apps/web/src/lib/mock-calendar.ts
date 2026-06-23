import { ref } from "vue";
import type { Anniversary, DateEvent } from "@tete/shared";

// 【モック】カレンダー用のダミーデータ。2人状態スペース（id=1111…）に紐づく。
// API 紐付け時は composable の中身を fetch に差し替えるだけにする。
const PAIRED_SPACE_ID = "11111111-1111-4111-8111-111111111111";
const ME = "mock-user-1";
const NOW_ISO = "2026-06-01T00:00:00.000Z";

// デート予定・記録（型D）。allDay=false は時刻あり＝時間軸に並ぶ。
const INITIAL_EVENTS: DateEvent[] = [
  {
    id: "e1",
    spaceId: PAIRED_SPACE_ID,
    title: "ランチ",
    allDay: false,
    startAt: "2026-06-17T13:00:00",
    endAt: "2026-06-17T14:00:00",
    location: "近所のカフェ",
    memo: null,
    personalNote: null,
    createdBy: ME,
    createdAt: NOW_ISO,
  },
  {
    id: "e2",
    spaceId: PAIRED_SPACE_ID,
    title: "映画デート",
    allDay: false,
    startAt: "2026-06-17T18:00:00",
    endAt: "2026-06-17T21:00:00",
    location: "○○シネマ 新宿",
    memo: "チケットは前売りで購入済み。集合は17:45。",
    personalNote: "ネタバレ厳禁。感想は観たあとに言う。",
    createdBy: ME,
    createdAt: NOW_ISO,
  },
  {
    id: "e3",
    spaceId: PAIRED_SPACE_ID,
    title: "カフェ予約",
    allDay: false,
    startAt: "2026-06-20T15:00:00",
    endAt: "2026-06-20T16:30:00",
    location: "表参道",
    memo: null,
    personalNote: null,
    createdBy: ME,
    createdAt: NOW_ISO,
  },
  {
    id: "e4",
    spaceId: PAIRED_SPACE_ID,
    title: "水族館",
    allDay: false,
    startAt: "2026-06-25T11:00:00",
    endAt: "2026-06-25T13:00:00",
    location: "すみだ水族館",
    memo: null,
    personalNote: null,
    createdBy: ME,
    createdAt: NOW_ISO,
  },
  {
    id: "e5",
    spaceId: PAIRED_SPACE_ID,
    title: "ディナー",
    allDay: false,
    startAt: "2026-06-25T19:00:00",
    endAt: "2026-06-25T21:00:00",
    location: null,
    memo: null,
    personalNote: null,
    createdBy: ME,
    createdAt: NOW_ISO,
  },
  {
    id: "e6",
    spaceId: PAIRED_SPACE_ID,
    title: "記念日プレゼント探し",
    allDay: true,
    startAt: "2026-06-25T00:00:00",
    endAt: null,
    location: null,
    memo: null,
    personalNote: null,
    createdBy: ME,
    createdAt: NOW_ISO,
  },
];

// 予定のリアクティブストア（モック）。編集・追加・削除はここを書き換えるだけで
// useCalendar 側の computed に即反映される。API 紐付け時は fetch 結果で置き換える。
export const events = ref<DateEvent[]>(INITIAL_EVENTS);

// 新規予定の入力（id などサーバ採番ぶんは受け取らない）。
export type NewEventInput = Omit<
  DateEvent,
  "id" | "spaceId" | "createdBy" | "createdAt"
>;
// 編集で書き換え可能な項目。
export type EventPatch = Partial<NewEventInput>;

function newId(): string {
  // ブラウザ標準。モックの一意キー用途。
  return crypto.randomUUID();
}

// 予定を追加して、生成された DateEvent を返す。
export function addEvent(spaceId: string, input: NewEventInput): DateEvent {
  const e: DateEvent = {
    id: newId(),
    spaceId,
    createdBy: ME,
    createdAt: new Date().toISOString(),
    ...input,
  };
  events.value = [...events.value, e];
  return e;
}

// 既存予定の項目を部分更新する。
export function updateEvent(id: string, patch: EventPatch): void {
  events.value = events.value.map((e) => (e.id === id ? { ...e, ...patch } : e));
}

// 予定を削除する。
export function removeEvent(id: string): void {
  events.value = events.value.filter((e) => e.id !== id);
}

// 記念日（型A）。繰り返しは展開して保存しない＝基準日＋ルールのみ。
const INITIAL_ANNIVERSARIES: Anniversary[] = [
  {
    id: "a1",
    spaceId: PAIRED_SPACE_ID,
    title: "2人の記念日",
    eventDate: "2024-02-14",
    recurrence: "monthly", // 毎月14日
    createdAt: NOW_ISO,
  },
  {
    id: "a2",
    spaceId: PAIRED_SPACE_ID,
    title: "たろうの誕生日",
    eventDate: "2001-06-24",
    recurrence: "yearly", // 毎年6/24
    createdAt: NOW_ISO,
  },
];

// 記念日のリアクティブストア（モック）。events と同じく、ここを書き換えるだけで
// カレンダー表示・記念日画面の computed に即反映される。
export const anniversaries = ref<Anniversary[]>(INITIAL_ANNIVERSARIES);

// 新規記念日の入力（id などサーバ採番ぶんは受け取らない）。
export type NewAnniversaryInput = Omit<
  Anniversary,
  "id" | "spaceId" | "createdAt"
>;
// 編集で書き換え可能な項目。
export type AnniversaryPatch = Partial<NewAnniversaryInput>;

// 記念日を追加して、生成された Anniversary を返す。
export function addAnniversary(
  spaceId: string,
  input: NewAnniversaryInput,
): Anniversary {
  const a: Anniversary = {
    id: newId(),
    spaceId,
    createdAt: new Date().toISOString(),
    ...input,
  };
  anniversaries.value = [...anniversaries.value, a];
  return a;
}

// 既存記念日の項目を部分更新する。
export function updateAnniversary(id: string, patch: AnniversaryPatch): void {
  anniversaries.value = anniversaries.value.map((a) =>
    a.id === id ? { ...a, ...patch } : a,
  );
}

// 記念日を削除する。
export function removeAnniversary(id: string): void {
  anniversaries.value = anniversaries.value.filter((a) => a.id !== id);
}
