import { computed, reactive } from "vue";

// じぶん機能のお気に入り管理。お気に入りした項目だけをホームに出す。
// スペースごとに別管理（spaceId キー）。
//
// 【モック】localStorage に永続化。状態はモジュールスコープで共有するため、
// ホームとじぶんタブで同じインスタンスを見る（トグルが即時反映される）。
// API 紐付け時は load/persist をサーバー保存に差し替える。
const store = reactive<Record<string, string[]>>({});

function storageKey(spaceId: string) {
  return `tete:favorites:${spaceId}`;
}

// 初回アクセス時に localStorage から読み込み、以降はメモリ上の配列を共有する。
function load(spaceId: string): string[] {
  if (!store[spaceId]) {
    let initial: string[] = [];
    try {
      const raw = localStorage.getItem(storageKey(spaceId));
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        // JSON.parse はオブジェクトや文字列でも成功するため、
        // string[] であることを検証してから採用する（不正値は空配列扱い）。
        if (Array.isArray(parsed) && parsed.every((v) => typeof v === "string")) {
          initial = parsed;
        }
      }
    } catch {
      initial = [];
    }
    store[spaceId] = initial;
  }
  return store[spaceId];
}

function persist(spaceId: string) {
  try {
    localStorage.setItem(storageKey(spaceId), JSON.stringify(store[spaceId]));
  } catch {
    // 保存に失敗してもメモリ上の状態は維持する（プライベートモード等）
  }
}

export function useFavorites(spaceId: string) {
  const favorites = computed(() => load(spaceId));

  function isFavorite(key: string) {
    return load(spaceId).includes(key);
  }

  function toggle(key: string) {
    const list = load(spaceId);
    const i = list.indexOf(key);
    if (i >= 0) list.splice(i, 1);
    else list.push(key);
    persist(spaceId);
  }

  return { favorites, isFavorite, toggle };
}
