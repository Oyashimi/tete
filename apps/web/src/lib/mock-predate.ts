import { ref } from "vue";
import type { PreDateItem, PreDateSection } from "@tete/shared";

// 【モック】会う前メモ（個人）のダミーデータ。
// 「セクション（見出し）＋項目」の2階層。owner_user_id で本人だけが見える。
// API 紐付け時は composable の中身を fetch に差し替えるだけにする
// （events / anniversaries / bucket と同じ作法）。
const PAIRED_SPACE_ID = "11111111-1111-4111-8111-111111111111";
const ME = "mock-user-1"; // 自分（はなこ）

// よく使う見出しを初期表示（ユーザーは自由に削除・追加できる）。
const INITIAL_SECTIONS: PreDateSection[] = [
  { id: "ps1", spaceId: PAIRED_SPACE_ID, ownerUserId: ME, title: "話したいこと", createdAt: "2026-06-20T09:00:00.000Z" },
  { id: "ps2", spaceId: PAIRED_SPACE_ID, ownerUserId: ME, title: "注意すること", createdAt: "2026-06-20T09:01:00.000Z" },
  { id: "ps3", spaceId: PAIRED_SPACE_ID, ownerUserId: ME, title: "持ち物", createdAt: "2026-06-20T09:02:00.000Z" },
];

const INITIAL_ITEMS: PreDateItem[] = [
  { id: "pi1", sectionId: "ps1", content: "新しくできたカフェの話をする☕️", createdAt: "2026-06-20T09:10:00.000Z" },
  { id: "pi2", sectionId: "ps1", content: "週末みた映画の感想", createdAt: "2026-06-20T09:11:00.000Z" },
  { id: "pi3", sectionId: "ps2", content: "声の大きさ", createdAt: "2026-06-20T09:12:00.000Z" },
  { id: "pi4", sectionId: "ps2", content: "歩く速さ", createdAt: "2026-06-20T09:13:00.000Z" },
  { id: "pi5", sectionId: "ps3", content: "ハンカチ", createdAt: "2026-06-20T09:14:00.000Z" },
];

// リアクティブストア（モック）。ここを書き換えるだけで画面の computed に即反映。
export const preDateSections = ref<PreDateSection[]>(INITIAL_SECTIONS);
export const preDateItems = ref<PreDateItem[]>(INITIAL_ITEMS);

function newId(): string {
  return crypto.randomUUID();
}

// ── セクション ──
export function addPreDateSection(
  spaceId: string,
  ownerUserId: string,
  title: string,
): PreDateSection {
  const section: PreDateSection = {
    id: newId(),
    spaceId,
    ownerUserId,
    title,
    createdAt: new Date().toISOString(),
  };
  preDateSections.value = [...preDateSections.value, section];
  return section;
}

export function updatePreDateSection(id: string, title: string): void {
  preDateSections.value = preDateSections.value.map((s) =>
    s.id === id ? { ...s, title } : s,
  );
}

// セクション削除時は配下の項目も併せて削除する。
export function removePreDateSection(id: string): void {
  preDateSections.value = preDateSections.value.filter((s) => s.id !== id);
  preDateItems.value = preDateItems.value.filter((i) => i.sectionId !== id);
}

// ── 項目 ──
export function addPreDateItem(sectionId: string, content: string): PreDateItem {
  const item: PreDateItem = {
    id: newId(),
    sectionId,
    content,
    createdAt: new Date().toISOString(),
  };
  preDateItems.value = [...preDateItems.value, item];
  return item;
}

export function updatePreDateItem(id: string, content: string): void {
  preDateItems.value = preDateItems.value.map((i) =>
    i.id === id ? { ...i, content } : i,
  );
}

export function removePreDateItem(id: string): void {
  preDateItems.value = preDateItems.value.filter((i) => i.id !== id);
}
