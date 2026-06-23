import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/ja";
import { computed, ref, type Ref } from "vue";

dayjs.locale("ja"); // 曜日・月表示を日本語に

// 曜日見出し（日曜始まり）
export const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;
import type { Anniversary, DateEvent } from "@tete/shared";
import { anniversaries, events } from "../lib/mock-calendar";

// カレンダー1マスに並べる「表示用」アイテム。予定（date_events）と記念日を統一して扱う。
export type CalendarItem = {
  key: string; // 一覧描画用のユニークキー（記念日は発生日込み）
  refId: string; // 元データのID（詳細遷移に使う）
  kind: "event" | "anniversary";
  title: string;
  date: string; // 発生日 YYYY-MM-DD
  allDay: boolean;
  startAt: string | null; // 時刻あり予定の開始ISO（終日/記念日は null）
  endAt: string | null;
  emoji: string | null; // 記念日マーク
};

function dateKey(d: Dayjs): string {
  return d.format("YYYY-MM-DD");
}

// 記念日が「指定した月」に発生する日付を返す（繰り返しは月単位で展開）。
// strategy.md：全発生日を保存せず、表示する月の分だけ計算する。
function anniversaryOccurrence(a: Anniversary, monthStart: Dayjs): string | null {
  const base = dayjs(a.eventDate);
  if (a.recurrence === "none") {
    return base.year() === monthStart.year() && base.month() === monthStart.month()
      ? dateKey(base)
      : null;
  }
  if (a.recurrence === "yearly") {
    if (base.month() !== monthStart.month()) return null;
    const day = Math.min(base.date(), monthStart.daysInMonth());
    return dateKey(monthStart.date(day));
  }
  // monthly：毎月その日（月末で丸める）
  const day = Math.min(base.date(), monthStart.daysInMonth());
  return dateKey(monthStart.date(day));
}

function eventItem(e: DateEvent): CalendarItem {
  return {
    key: e.id,
    refId: e.id,
    kind: "event",
    title: e.title,
    date: dateKey(dayjs(e.startAt)),
    allDay: e.allDay,
    startAt: e.allDay ? null : e.startAt,
    endAt: e.endAt,
    emoji: null,
  };
}

// 並び順：終日/記念日が先 → 時刻順。
function sortItems(items: CalendarItem[]): CalendarItem[] {
  return [...items].sort((a, b) => {
    if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
    return (a.startAt ?? "").localeCompare(b.startAt ?? "");
  });
}

// 1か月分のアイテムを日付ごとにまとめる（月グリッド・日画面で共用）。
function buildMonthMap(spaceId: string, monthStart: Dayjs): Map<string, CalendarItem[]> {
  const map = new Map<string, CalendarItem[]>();
  const push = (date: string, item: CalendarItem) => {
    const arr = map.get(date) ?? [];
    arr.push(item);
    map.set(date, arr);
  };

  for (const e of events.value) {
    if (e.spaceId !== spaceId) continue;
    const item = eventItem(e);
    push(item.date, item);
  }
  for (const a of anniversaries.value) {
    if (a.spaceId !== spaceId) continue;
    const occ = anniversaryOccurrence(a, monthStart);
    if (!occ) continue;
    push(occ, {
      key: `${a.id}-${occ}`,
      refId: a.id,
      kind: "anniversary",
      title: a.title,
      date: occ,
      allDay: true,
      startAt: null,
      endAt: null,
      emoji: "🎉",
    });
  }

  for (const [date, items] of map) map.set(date, sortItems(items));
  return map;
}

// 月表示（① 月グリッド）。
export function useCalendarMonth(spaceId: string) {
  const cursor = ref<Dayjs>(dayjs().startOf("month")); // 表示中の月の初日

  const monthLabel = computed(() => cursor.value.format("YYYY年M月"));
  const itemsByDate = computed(() => buildMonthMap(spaceId, cursor.value));

  // その月を覆う最小限の週グリッド（4〜6週）。週は日曜始まり。
  const weeks = computed(() => {
    const start = cursor.value.startOf("month");
    const gridStart = start.subtract(start.day(), "day"); // 直前の日曜まで戻す
    const end = start.endOf("month");
    const gridEnd = end.add(6 - end.day(), "day"); // 月末を含む週の土曜まで進める
    const cellCount = gridEnd.diff(gridStart, "day") + 1;
    const today = dateKey(dayjs());
    const cells = [];
    for (let i = 0; i < cellCount; i++) {
      const d = gridStart.add(i, "day");
      const date = dateKey(d);
      cells.push({
        date,
        day: d.date(),
        inMonth: d.month() === start.month(),
        isToday: date === today,
        items: itemsByDate.value.get(date) ?? [],
      });
    }
    // 7日ずつの行に分割
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  });

  const prevMonth = () => {
    cursor.value = cursor.value.subtract(1, "month").startOf("month");
  };
  const nextMonth = () => {
    cursor.value = cursor.value.add(1, "month").startOf("month");
  };
  const goToday = () => {
    cursor.value = dayjs().startOf("month");
  };

  return { cursor, monthLabel, weeks, prevMonth, nextMonth, goToday };
}

// 日表示（② 時間軸）。指定日の終日・時刻あり予定を分けて返す。
export function useCalendarDay(spaceId: string, date: Ref<string>) {
  const dayLabel = computed(() => dayjs(date.value).format("M月D日(ddd)"));

  const items = computed(() => {
    const monthStart = dayjs(date.value).startOf("month");
    return buildMonthMap(spaceId, monthStart).get(date.value) ?? [];
  });
  const allDayItems = computed(() => items.value.filter((i) => i.allDay));
  const timedItems = computed(() => items.value.filter((i) => !i.allDay));

  return { dayLabel, items, allDayItems, timedItems };
}

// 予定詳細（③）。指定IDの date_event を返す（記念日は対象外）。
// 下部パネルに重ねて表示するため、選択IDから都度引けるよう純関数で提供。
export function findDateEvent(spaceId: string, eventId: string) {
  return events.value.find((e) => e.id === eventId && e.spaceId === spaceId) ?? null;
}
