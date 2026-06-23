import dayjs from "dayjs";
import "dayjs/locale/ja";
import { computed, reactive } from "vue";

dayjs.locale("ja");
import type { Anniversary } from "@tete/shared";
import {
  addAnniversary,
  anniversaries,
  type NewAnniversaryInput,
  removeAnniversary,
  updateAnniversary,
} from "../lib/mock-calendar";

// 記念日に「次回発生日」と「あと◯日」を付けた表示用の形。
export type AnniversaryView = Anniversary & {
  nextDate: string; // 次に来る発生日 YYYY-MM-DD
  daysUntil: number; // 今日から次回発生日までの日数（0=今日）
};

// 記念日の次回発生日（今日以降で最も近い発生日）を求める。
// 繰り返しを展開保存しない方針（useCalendar の anniversaryOccurrence と同じ考え方）。
function nextOccurrence(a: Anniversary, today: dayjs.Dayjs): string {
  const base = dayjs(a.eventDate);

  if (a.recurrence === "none") {
    // 一度きり。過去でも基準日をそのまま返す（一覧では「過ぎた」と分かる）。
    return base.format("YYYY-MM-DD");
  }

  if (a.recurrence === "yearly") {
    // 今年の同月日。過ぎていれば翌年。閏日などは月末で丸める。
    let cand = clampToMonth(today.year(), base.month(), base.date());
    if (cand.isBefore(today, "day")) {
      cand = clampToMonth(today.year() + 1, base.month(), base.date());
    }
    return cand.format("YYYY-MM-DD");
  }

  // monthly：今月の同日。過ぎていれば翌月（月末で丸める）。
  let cand = clampToMonth(today.year(), today.month(), base.date());
  if (cand.isBefore(today, "day")) {
    const nm = today.add(1, "month");
    cand = clampToMonth(nm.year(), nm.month(), base.date());
  }
  return cand.format("YYYY-MM-DD");
}

// 指定年月の「day日」を返す。存在しない日（31日等）はその月の末日に丸める。
function clampToMonth(year: number, month: number, day: number): dayjs.Dayjs {
  const first = dayjs().year(year).month(month).date(1);
  return first.date(Math.min(day, first.daysInMonth()));
}

// ── ピン留め（ホームに出す1件）。スペースごとに記念日IDを1つ保持。 ──
// 【モック】localStorage に永続化（お気に入りと同じ作法）。
const pinStore = reactive<Record<string, string | null>>({});

function pinKey(spaceId: string) {
  return `tete:pinned-anniversary:${spaceId}`;
}

function loadPin(spaceId: string): string | null {
  if (!(spaceId in pinStore)) {
    try {
      pinStore[spaceId] = localStorage.getItem(pinKey(spaceId));
    } catch {
      pinStore[spaceId] = null;
    }
  }
  return pinStore[spaceId];
}

function persistPin(spaceId: string) {
  try {
    const v = pinStore[spaceId];
    if (v) localStorage.setItem(pinKey(spaceId), v);
    else localStorage.removeItem(pinKey(spaceId));
  } catch {
    // 保存失敗時もメモリ上の状態は維持
  }
}

export function useAnniversaries(spaceId: string) {
  // このスペースの記念日に次回発生日を付与し、近い順に並べる。
  const list = computed<AnniversaryView[]>(() => {
    const today = dayjs().startOf("day");
    return anniversaries.value
      .filter((a) => a.spaceId === spaceId)
      .map((a) => {
        const nextDate = nextOccurrence(a, today);
        return {
          ...a,
          nextDate,
          daysUntil: dayjs(nextDate).startOf("day").diff(today, "day"),
        };
      })
      .sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  });

  const pinnedId = computed(() => loadPin(spaceId));
  // ピン留め中の記念日（無効なIDなら null）。
  const pinned = computed<AnniversaryView | null>(
    () => list.value.find((a) => a.id === pinnedId.value) ?? null,
  );

  function isPinned(id: string) {
    return loadPin(spaceId) === id;
  }

  // 同じものを押したら解除、違うものを押したら付け替え（常に1件）。
  function togglePin(id: string) {
    pinStore[spaceId] = loadPin(spaceId) === id ? null : id;
    persistPin(spaceId);
  }

  function add(input: NewAnniversaryInput) {
    return addAnniversary(spaceId, input);
  }

  function update(id: string, patch: Partial<NewAnniversaryInput>) {
    updateAnniversary(id, patch);
  }

  function remove(id: string) {
    // 削除した記念日がピン留め中なら、ピンも外す。
    if (loadPin(spaceId) === id) {
      pinStore[spaceId] = null;
      persistPin(spaceId);
    }
    removeAnniversary(id);
  }

  return { list, pinned, pinnedId, isPinned, togglePin, add, update, remove };
}

// 「あと◯日」を日本語ラベルに（今日・過ぎた・あとN日）。
export function countdownLabel(v: AnniversaryView): string {
  if (v.daysUntil === 0) return "今日";
  if (v.daysUntil < 0) return `${-v.daysUntil}日前`;
  return `あと${v.daysUntil}日`;
}
