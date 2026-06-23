<script setup lang="ts">
import dayjs from "dayjs";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import {
  findDateEvent,
  useCalendarDay,
  useCalendarMonth,
  WEEKDAYS,
} from "../../composables/useCalendar";
import type { CalendarItem } from "../../composables/useCalendar";
import {
  addEvent,
  type NewEventInput,
  removeEvent,
  updateEvent,
} from "../../lib/mock-calendar";

// カレンダータブ：上＝月グリッド（常に固定表示）、下＝選択日の時間軸。
// 予定タップ時は、下部に予定詳細を「重ねて」表示する（月カレンダーは出たまま）。
const route = useRoute();
const spaceId = computed(() => String(route.params.id));

const { cursor, monthLabel, weeks, prevMonth, nextMonth, goToday } =
  useCalendarMonth(spaceId.value);

// クエリの date は不正値が混入しうるため dayjs で検証し、無効なら無視する
const rawQueryDate =
  typeof route.query.date === "string" ? route.query.date : null;
const queryDate =
  rawQueryDate && dayjs(rawQueryDate).isValid() ? rawQueryDate : null;
const selectedDate = ref(queryDate ?? dayjs().format("YYYY-MM-DD"));
if (queryDate) cursor.value = dayjs(queryDate).startOf("month");

const { dayLabel, allDayItems, timedItems } = useCalendarDay(
  spaceId.value,
  selectedDate,
);

// 下部に重ねる予定詳細（選択中の予定ID）。
const selectedEventId = ref<string | null>(null);
const selectedEvent = computed(() =>
  selectedEventId.value ? findDateEvent(spaceId.value, selectedEventId.value) : null,
);
function openEvent(item: CalendarItem) {
  if (item.kind !== "event") return; // 記念日は表示のみ
  selectedEventId.value = item.refId;
}
function closeDetail() {
  selectedEventId.value = null;
}

function prev() {
  prevMonth();
  selectedDate.value = cursor.value.format("YYYY-MM-DD");
  closeDetail();
}
function next() {
  nextMonth();
  selectedDate.value = cursor.value.format("YYYY-MM-DD");
  closeDetail();
}
function today() {
  goToday();
  selectedDate.value = dayjs().format("YYYY-MM-DD");
  closeDetail();
}
function selectDay(cell: { date: string; inMonth: boolean }) {
  selectedDate.value = cell.date;
  if (!cell.inMonth) cursor.value = dayjs(cell.date).startOf("month");
  closeDetail();
}

// 時間軸の表示範囲（予定の時刻から自動。無ければ 8〜20時）。
const hourRange = computed(() => {
  const hrs = timedItems.value.flatMap((i) => {
    const s = dayjs(i.startAt!).hour();
    const e = i.endAt ? dayjs(i.endAt).hour() : s + 1;
    return [s, e];
  });
  if (!hrs.length) return { from: 8, to: 20 };
  return {
    from: Math.max(0, Math.min(...hrs) - 1),
    to: Math.min(23, Math.max(...hrs) + 1),
  };
});
const hours = computed(() => {
  const arr: number[] = [];
  for (let h = hourRange.value.from; h <= hourRange.value.to; h++) arr.push(h);
  return arr;
});

// 1時間あたりの高さ(px)。予定はこの比率で開始位置・長さを表す。
const HOUR_H = 40;
// 予定を「開始〜終了の長さ」に比例した帯として時間軸に重ねるための位置・高さ。
function eventStyle(i: CalendarItem) {
  const from = hourRange.value.from;
  const start = dayjs(i.startAt!);
  const startMin = (start.hour() - from) * 60 + start.minute();
  const end = i.endAt ? dayjs(i.endAt) : start.add(1, "hour");
  const durMin = Math.max(20, end.diff(start, "minute")); // 短い予定でも最低限の高さを確保
  return {
    top: `${(startMin / 60) * HOUR_H}px`,
    height: `${(durMin / 60) * HOUR_H}px`,
  };
}
function timeLabel(i: CalendarItem) {
  const s = dayjs(i.startAt!).format("HH:mm");
  return i.endAt ? `${s}〜${dayjs(i.endAt).format("HH:mm")}` : s;
}

// 詳細の日時ラベル
const detailWhen = computed(() => {
  const e = selectedEvent.value;
  if (!e) return "";
  const day = dayjs(e.startAt).format("M月D日(ddd)");
  if (e.allDay) return `${day} ・ 終日`;
  const s = dayjs(e.startAt).format("HH:mm");
  return `${day} ${e.endAt ? `${s}〜${dayjs(e.endAt).format("HH:mm")}` : s}`;
});

// ── 追加・編集フォーム ──
// 詳細と同じ全画面オーバーレイで表示する。追加(create)/編集(edit)で共通。
type EventForm = {
  title: string;
  allDay: boolean;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location: string;
  memo: string; // 共有メモ
  personalNote: string; // 個人メモ（自分だけ）
};

const formMode = ref<"create" | "edit" | null>(null);
const form = ref<EventForm | null>(null);
const formError = ref("");

function blankForm(date: string): EventForm {
  return {
    title: "",
    allDay: false,
    date,
    startTime: "12:00",
    endTime: "13:00",
    location: "",
    memo: "",
    personalNote: "",
  };
}

// 新規追加：選択中の日を初期値にして空フォームを開く。
function openCreate() {
  form.value = blankForm(selectedDate.value);
  formError.value = "";
  formMode.value = "create";
}

// 編集：詳細表示中の予定をフォームに読み込む。
function openEdit() {
  const e = selectedEvent.value;
  if (!e) return;
  const start = dayjs(e.startAt);
  form.value = {
    title: e.title,
    allDay: e.allDay,
    date: start.format("YYYY-MM-DD"),
    startTime: start.format("HH:mm"),
    endTime: e.endAt
      ? dayjs(e.endAt).format("HH:mm")
      : start.add(1, "hour").format("HH:mm"),
    location: e.location ?? "",
    memo: e.memo ?? "",
    personalNote: e.personalNote ?? "",
  };
  formError.value = "";
  formMode.value = "edit";
}

function closeForm() {
  formMode.value = null;
  form.value = null;
  formError.value = "";
}

// フォーム → 保存用フィールドへ変換。検証 NG なら null を返しエラーを表示。
function buildInput(f: EventForm): NewEventInput | null {
  const title = f.title.trim();
  if (!title) {
    formError.value = "タイトルを入力してください";
    return null;
  }
  let startAt: string;
  let endAt: string | null;
  if (f.allDay) {
    startAt = `${f.date}T00:00:00`;
    endAt = null;
  } else {
    if (!f.startTime) {
      formError.value = "開始時刻を入力してください";
      return null;
    }
    startAt = `${f.date}T${f.startTime}:00`;
    endAt = f.endTime ? `${f.date}T${f.endTime}:00` : null;
    if (endAt && endAt < startAt) {
      formError.value = "終了時刻は開始時刻より後にしてください";
      return null;
    }
  }
  return {
    title,
    allDay: f.allDay,
    startAt,
    endAt,
    location: f.location.trim() || null,
    memo: f.memo.trim() || null,
    personalNote: f.personalNote.trim() || null,
  };
}

function submitForm() {
  if (!form.value) return;
  const input = buildInput(form.value);
  if (!input) return;
  const date = form.value.date;
  if (formMode.value === "create") {
    const created = addEvent(spaceId.value, input);
    // 追加した日へ移動して、その予定の詳細を開く。
    selectedDate.value = date;
    cursor.value = dayjs(date).startOf("month");
    closeForm();
    selectedEventId.value = created.id;
  } else if (formMode.value === "edit" && selectedEventId.value) {
    updateEvent(selectedEventId.value, input);
    selectedDate.value = date;
    cursor.value = dayjs(date).startOf("month");
    closeForm();
    // 詳細表示はそのまま（更新後の内容が反映される）。
  }
}

function deleteEvent() {
  if (!selectedEventId.value) return;
  if (!confirm("この予定を削除しますか？")) return;
  removeEvent(selectedEventId.value);
  closeDetail();
}
</script>

<template>
  <div class="page">
    <!-- ── 上部：月カレンダー（常に固定） ── -->
    <div class="cal-top">
      <header class="bar">
        <h1 class="month">{{ monthLabel }}</h1>
        <div class="nav">
          <button class="nav-btn" aria-label="前の月" @click="prev">‹</button>
          <button class="today" @click="today">今日</button>
          <button class="nav-btn" aria-label="次の月" @click="next">›</button>
        </div>
      </header>

      <div class="dow">
        <span
          v-for="(w, i) in WEEKDAYS"
          :key="w"
          :class="{ sun: i === 0, sat: i === 6 }"
          >{{ w }}</span
        >
      </div>

      <div class="grid">
        <div v-for="(week, wi) in weeks" :key="wi" class="week">
          <button
            v-for="cell in week"
            :key="cell.date"
            class="cell"
            :class="{ dim: !cell.inMonth, selected: cell.date === selectedDate }"
            @click="selectDay(cell)"
          >
            <span
              class="num"
              :class="{ today: cell.isToday, sel: cell.date === selectedDate }"
              >{{ cell.day }}</span
            >
            <!-- マスにタイトル（1〜2件＋『+N』） -->
            <span
              v-for="item in cell.items.slice(0, 2)"
              :key="item.key"
              class="chip"
              :class="item.kind === 'anniversary' ? 'anniv' : 'plan'"
            >
              <template v-if="item.kind === 'anniversary'">🎉</template
              >{{ item.title }}
            </span>
            <span v-if="cell.items.length > 2" class="more"
              >+{{ cell.items.length - 2 }}</span
            >
          </button>
        </div>
      </div>
    </div>

    <!-- ── 下部：選択日の時間軸（＋詳細オーバーレイ） ── -->
    <div class="day-panel">
      <div class="day-scroll">
        <div class="day-head">
          <span class="day-label">{{ dayLabel }}</span>
          <button class="add" @click="openCreate">＋ 予定を追加</button>
        </div>

      <div v-if="allDayItems.length" class="allday">
        <button
          v-for="item in allDayItems"
          :key="item.key"
          class="allday-item"
          :class="{ anniv: item.kind === 'anniversary' }"
          @click="openEvent(item)"
        >
          <span v-if="item.kind === 'anniversary'">🎉</span>
          <span>{{ item.title }}</span>
        </button>
      </div>

      <div class="axis" :style="{ '--hour-h': `${HOUR_H}px` }">
        <div class="hours">
          <div v-for="h in hours" :key="h" class="hour">
            <span class="t">{{ h }}</span>
          </div>
        </div>
        <div class="events">
          <button
            v-for="item in timedItems"
            :key="item.key"
            class="ev"
            :style="eventStyle(item)"
            @click="openEvent(item)"
          >
            <span class="ev-title">{{ item.title }}</span>
            <span class="ev-time">{{ timeLabel(item) }}</span>
          </button>
        </div>
      </div>

      <p v-if="!allDayItems.length && !timedItems.length" class="empty">
        この日の予定はまだありません
      </p>
      </div>
    </div>

    <!-- 予定詳細：全画面で表示（画面全体を覆う） -->
    <div v-if="selectedEvent" class="detail">
        <header class="detail-bar">
          <button class="back" @click="closeDetail">‹ 戻る</button>
        </header>
        <div class="detail-head">
          <h2>{{ selectedEvent.title }}</h2>
          <p class="when">{{ detailWhen }}</p>
        </div>

        <div v-if="selectedEvent.location" class="field">
          <p class="k">場所</p>
          <p class="v">{{ selectedEvent.location }}</p>
        </div>
        <div class="field">
          <p class="k">共有メモ <span class="hint">・2人で見る</span></p>
          <p class="v" :class="{ faint: !selectedEvent.memo }">
            {{ selectedEvent.memo ?? "まだありません" }}
          </p>
        </div>
        <div class="field personal">
          <p class="k">個人メモ <span class="hint">・自分だけ</span></p>
          <p class="v" :class="{ faint: !selectedEvent.personalNote }">
            {{ selectedEvent.personalNote ?? "まだありません" }}
          </p>
        </div>

        <div class="actions">
          <button class="abtn" @click="openEdit">編集</button>
          <button class="abtn danger" @click="deleteEvent">削除</button>
        </div>
      </div>

    <!-- 追加・編集フォーム：詳細と同じ全画面オーバーレイ -->
    <div v-if="form" class="detail form">
      <header class="detail-bar">
        <button class="back" @click="closeForm">‹ キャンセル</button>
        <span class="form-title">{{
          formMode === "create" ? "予定を追加" : "予定を編集"
        }}</span>
      </header>

      <form class="form-body" @submit.prevent="submitForm">
        <label class="fld">
          <span class="lbl">タイトル</span>
          <input
            v-model="form.title"
            class="inp"
            type="text"
            placeholder="例：映画デート"
            maxlength="100"
          />
        </label>

        <label class="fld row">
          <span class="lbl">終日</span>
          <input v-model="form.allDay" type="checkbox" class="chk" />
        </label>

        <label class="fld">
          <span class="lbl">日付</span>
          <input v-model="form.date" class="inp" type="date" />
        </label>

        <div v-if="!form.allDay" class="fld-grid">
          <label class="fld">
            <span class="lbl">開始</span>
            <input v-model="form.startTime" class="inp" type="time" />
          </label>
          <label class="fld">
            <span class="lbl">終了</span>
            <input v-model="form.endTime" class="inp" type="time" />
          </label>
        </div>

        <label class="fld">
          <span class="lbl">場所</span>
          <input
            v-model="form.location"
            class="inp"
            type="text"
            placeholder="例：○○シネマ 新宿"
            maxlength="200"
          />
        </label>

        <label class="fld">
          <span class="lbl">共有メモ <span class="hint">・2人で見る</span></span>
          <textarea
            v-model="form.memo"
            class="inp area"
            rows="3"
            maxlength="2000"
          ></textarea>
        </label>

        <label class="fld">
          <span class="lbl">個人メモ <span class="hint">・自分だけ</span></span>
          <textarea
            v-model="form.personalNote"
            class="inp area"
            rows="3"
            maxlength="2000"
          ></textarea>
        </label>

        <p v-if="formError" class="form-error">{{ formError }}</p>

        <div class="actions">
          <button type="button" class="abtn" @click="closeForm">キャンセル</button>
          <button type="submit" class="abtn primary">保存</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* 上部カレンダーを固定し、下部だけスクロールさせる固定レイアウト */
.page {
  position: relative;
  max-width: 480px;
  margin: 0 auto;
  height: calc(100dvh - var(--tabbar-h) - env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 var(--space-3);
}

.cal-top {
  flex: 0 0 auto;
  background: var(--bg);
  padding-bottom: var(--space-2);
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-1) var(--space-2);
}
.month {
  margin: 0;
  font-size: 1.2rem;
}
.nav {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.nav-btn {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 1.1rem;
  cursor: pointer;
}
.today {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  border-radius: var(--radius-pill);
  font-size: 0.76rem;
  padding: 0.3rem 0.7rem;
  cursor: pointer;
}

.dow {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.dow span {
  text-align: center;
  font-size: 0.68rem;
  color: var(--text-faint);
  padding: var(--space-1) 0;
}
.dow .sun {
  color: var(--accent-ink);
}
.dow .sat {
  color: #7c93b8;
}

/* 月グリッド（タイトル表示） */
.grid {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--border);
}
.week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}
.week + .week {
  margin-top: 1px;
}
.cell {
  height: 60px;
  min-width: 0;
  background: var(--bg);
  border: none;
  padding: 2px 3px 3px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 1px;
  cursor: pointer;
  font: inherit;
  overflow: hidden;
}
.cell.dim {
  background: var(--surface-sub);
}
.cell.selected {
  background: var(--accent-soft);
}
.num {
  font-size: 0.68rem;
  line-height: 1.2;
  color: var(--text);
  align-self: flex-start;
  min-width: 16px;
  text-align: center;
  border-radius: var(--radius-pill);
}
.cell.dim .num {
  color: var(--text-faint);
}
.num.today {
  border: 1px solid var(--accent);
  color: var(--accent-ink);
}
.num.sel {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  font-weight: 600;
}
.chip {
  font-size: 0.6rem;
  line-height: 1.25;
  padding: 0 3px;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chip.plan {
  background: var(--surface-sub);
  color: var(--text);
  border: 1px solid var(--border);
}
.cell.dim .chip.plan {
  background: var(--surface);
}
.chip.anniv {
  background: var(--accent-soft);
  color: var(--accent-ink);
}
.more {
  font-size: 0.56rem;
  line-height: 1.1;
  color: var(--text-faint);
  padding: 0 3px;
}

/* 下部パネル（スクロール領域・詳細オーバーレイの基準） */
.day-panel {
  flex: 1 1 auto;
  position: relative;
  overflow: hidden;
  min-height: 0;
}
.day-scroll {
  height: 100%;
  overflow-y: auto;
  padding-top: var(--space-3);
}
.day-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}
.day-label {
  font-weight: 700;
  font-size: 0.95rem;
}
.add {
  border: 1px solid var(--accent-soft);
  background: var(--accent-soft);
  color: var(--accent-ink);
  border-radius: var(--radius-pill);
  font-size: 0.74rem;
  padding: 0.3rem 0.8rem;
  cursor: pointer;
}

.allday {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}
.allday-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  border: 1px solid var(--border);
  background: var(--surface-sub);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  font-size: 0.85rem;
  text-align: left;
  cursor: pointer;
  color: var(--text);
}
.allday-item.anniv {
  background: var(--accent-soft);
  border-color: var(--accent-soft);
  color: var(--accent-ink);
}

.axis {
  position: relative;
  border-top: 1px solid var(--border);
}
.hours {
  display: flex;
  flex-direction: column;
}
.hour {
  display: grid;
  grid-template-columns: 40px 1fr;
  border-top: 1px dashed var(--border);
  height: var(--hour-h);
}
.hour:first-child {
  border-top: none;
}
.hour .t {
  font-size: 0.68rem;
  color: var(--text-faint);
  padding: 2px 6px 0 0;
  text-align: right;
}
/* 予定は時刻目盛りに重ねて絶対配置（開始位置・長さは eventStyle で算出） */
.events {
  position: absolute;
  top: 0;
  left: 40px;
  right: 0;
  bottom: 0;
}
.ev {
  position: absolute;
  left: 2px;
  right: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  border: none;
  border-left: 3px solid var(--accent);
  background: var(--surface-sub);
  border-radius: 6px;
  padding: 2px var(--space-3);
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;
}
.ev-title {
  font-size: 0.82rem;
  font-weight: 500;
}
.ev-time {
  font-size: 0.68rem;
  color: var(--text-muted);
}
.empty {
  text-align: center;
  color: var(--text-muted);
  margin: var(--space-8) 0;
  font-size: 0.85rem;
}

/* 予定詳細：画面全体を覆う全画面表示 */
.detail {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: var(--bg);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 var(--space-3) var(--space-8);
}
.detail-bar {
  position: sticky;
  top: 0;
  background: var(--bg);
  padding: var(--space-2) 0;
}
.back {
  border: none;
  background: none;
  color: var(--text-muted);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0;
}
.detail-head {
  margin-bottom: var(--space-4);
}
.detail-head h2 {
  margin: var(--space-2) 0 var(--space-1);
  font-size: 1.25rem;
}
.when {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.85rem;
}
.field {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-3);
}
.field.personal {
  border-style: dashed;
  border-color: var(--border-strong);
}
.field .k {
  margin: 0 0 var(--space-1);
  font-size: 0.72rem;
  color: var(--text-faint);
}
.field .v {
  margin: 0;
  font-size: 0.9rem;
  white-space: pre-wrap;
}
.field .v.faint {
  color: var(--text-faint);
}
.actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-4);
}
.abtn {
  flex: 1;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: var(--radius-pill);
  padding: var(--space-3);
  font-size: 0.85rem;
  cursor: pointer;
  color: var(--text);
}
.abtn.danger {
  color: #c0564f;
  border-color: #f0d6d3;
}
.abtn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  font-weight: 600;
}

/* 追加・編集フォーム（全画面オーバーレイ） */
.form-title {
  margin-left: var(--space-2);
  font-size: 0.95rem;
  font-weight: 600;
}
.detail-bar {
  display: flex;
  align-items: center;
}
.form-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.fld {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.fld.row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.fld-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--space-3);
}
/* グリッド内のセルが内容の最小幅で広がり、横にはみ出すのを防ぐ */
.fld-grid > .fld {
  min-width: 0;
}
.lbl {
  font-size: 0.72rem;
  color: var(--text-faint);
}
.inp {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  padding: var(--space-2) var(--space-3);
  font: inherit;
  font-size: 0.9rem;
  color: var(--text);
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
.inp:focus {
  outline: none;
  border-color: var(--accent);
}
/* 日付・時刻入力：ネイティブの固有最小幅やスピナーで横幅がはみ出し、
   2カラム時に開始/終了が重なるのを防ぐ */
.inp[type="time"],
.inp[type="date"] {
  -webkit-appearance: none;
  appearance: none;
}
.inp[type="time"]::-webkit-inner-spin-button,
.inp[type="time"]::-webkit-clear-button,
.inp[type="date"]::-webkit-inner-spin-button,
.inp[type="date"]::-webkit-clear-button {
  display: none;
  -webkit-appearance: none;
  margin: 0;
}
.inp[type="time"]::-webkit-calendar-picker-indicator,
.inp[type="date"]::-webkit-calendar-picker-indicator {
  margin-left: auto;
  padding-left: var(--space-1);
}
.inp.area {
  resize: vertical;
  white-space: pre-wrap;
}
.chk {
  width: 20px;
  height: 20px;
}
.form-error {
  margin: 0;
  color: #c0564f;
  font-size: 0.82rem;
}
</style>
