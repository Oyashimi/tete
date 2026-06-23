<script setup lang="ts">
import dayjs from "dayjs";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import type { Recurrence } from "@tete/shared";
import {
  type AnniversaryView,
  countdownLabel,
  useAnniversaries,
} from "../../composables/useAnniversaries";

// 記念日タブ：記念日を「日付＋タイトル＋あと◯日」で一覧表示。
// 編集・削除・ピン留め（1件だけホームに出す）に対応。
const route = useRoute();
const spaceId = computed(() => String(route.params.id));
const { list, isPinned, togglePin, add, update, remove } = useAnniversaries(
  spaceId.value,
);

// 繰り返しの表示ラベルと選択肢。
const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: "yearly", label: "毎年" },
  { value: "monthly", label: "毎月" },
  { value: "none", label: "繰り返さない" },
];
function recurrenceLabel(r: Recurrence): string {
  return RECURRENCE_OPTIONS.find((o) => o.value === r)?.label ?? "";
}
function nextDateLabel(v: AnniversaryView): string {
  return dayjs(v.nextDate).format("M月D日(ddd)");
}

// ── 追加・編集フォーム（全画面オーバーレイ） ──
type AnniversaryForm = {
  title: string;
  eventDate: string; // YYYY-MM-DD
  recurrence: Recurrence;
};

const formMode = ref<"create" | "edit" | null>(null);
const editingId = ref<string | null>(null);
const form = ref<AnniversaryForm | null>(null);
const formError = ref("");

function openCreate() {
  form.value = {
    title: "",
    eventDate: dayjs().format("YYYY-MM-DD"),
    recurrence: "yearly",
  };
  editingId.value = null;
  formError.value = "";
  formMode.value = "create";
}

function openEdit(v: AnniversaryView) {
  form.value = {
    title: v.title,
    eventDate: v.eventDate,
    recurrence: v.recurrence,
  };
  editingId.value = v.id;
  formError.value = "";
  formMode.value = "edit";
}

function closeForm() {
  formMode.value = null;
  editingId.value = null;
  form.value = null;
  formError.value = "";
}

function submitForm() {
  if (!form.value) return;
  const title = form.value.title.trim();
  if (!title) {
    formError.value = "タイトルを入力してください";
    return;
  }
  if (!form.value.eventDate) {
    formError.value = "日付を入力してください";
    return;
  }
  const input = {
    title,
    eventDate: form.value.eventDate,
    recurrence: form.value.recurrence,
  };
  if (formMode.value === "edit" && editingId.value) {
    update(editingId.value, input);
  } else {
    add(input);
  }
  closeForm();
}

function onDelete(v: AnniversaryView) {
  if (!confirm(`「${v.title}」を削除しますか？`)) return;
  remove(v.id);
}
</script>

<template>
  <div class="page">
    <header class="bar">
      <div>
        <h1>記念日</h1>
        <p class="lead">大切な日のカウントダウン。1件をホームに出せます</p>
      </div>
      <button class="add" @click="openCreate">＋ 追加</button>
    </header>

    <ul v-if="list.length" class="cards">
      <li
        v-for="a in list"
        :key="a.id"
        class="card"
        :class="{ pinned: isPinned(a.id) }"
      >
        <div class="card-main">
          <div class="title-row">
            <span class="title">{{ a.title }}</span>
            <span class="badge">{{ recurrenceLabel(a.recurrence) }}</span>
          </div>
          <p class="date">{{ nextDateLabel(a) }}</p>
        </div>

        <div class="card-side">
          <span
            class="count"
            :class="{ today: a.daysUntil === 0, past: a.daysUntil < 0 }"
            >{{ countdownLabel(a) }}</span
          >
          <div class="ops">
            <button
              class="pin"
              :class="{ on: isPinned(a.id) }"
              :aria-pressed="isPinned(a.id)"
              :aria-label="isPinned(a.id) ? 'ホーム表示を解除' : 'ホームに表示'"
              @click="togglePin(a.id)"
            >
              📌
            </button>
            <button class="op" aria-label="編集" @click="openEdit(a)">✎</button>
            <button
              class="op danger"
              aria-label="削除"
              @click="onDelete(a)"
            >
              🗑
            </button>
          </div>
        </div>
      </li>
    </ul>

    <div v-else class="empty">
      <span class="emoji">🎉</span>
      <p class="empty-title">記念日はまだありません</p>
      <p class="empty-sub">「＋ 追加」で最初の記念日を登録しましょう</p>
    </div>

    <!-- 追加・編集フォーム（全画面オーバーレイ） -->
    <div v-if="form" class="overlay">
      <header class="overlay-bar">
        <button class="back" @click="closeForm">‹ キャンセル</button>
        <span class="overlay-title">{{
          formMode === "create" ? "記念日を追加" : "記念日を編集"
        }}</span>
      </header>

      <form class="form-body" @submit.prevent="submitForm">
        <label class="fld">
          <span class="lbl">タイトル</span>
          <input
            v-model="form.title"
            class="inp"
            type="text"
            placeholder="例：付き合った記念日"
            maxlength="100"
          />
        </label>

        <label class="fld">
          <span class="lbl">日付</span>
          <input v-model="form.eventDate" class="inp" type="date" />
        </label>

        <label class="fld">
          <span class="lbl">繰り返し</span>
          <select v-model="form.recurrence" class="inp">
            <option v-for="o in RECURRENCE_OPTIONS" :key="o.value" :value="o.value">
              {{ o.label }}
            </option>
          </select>
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
.page {
  position: relative;
  max-width: 480px;
  margin: 0 auto;
  padding: 0 var(--space-4) var(--space-8);
}
.bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) 0;
}
.bar h1 {
  margin: 0;
  font-size: 1.2rem;
}
.lead {
  margin: var(--space-1) 0 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}
.add {
  flex: 0 0 auto;
  border: 1px solid var(--accent-soft);
  background: var(--accent-soft);
  color: var(--accent-ink);
  border-radius: var(--radius-pill);
  font-size: 0.78rem;
  padding: 0.35rem 0.85rem;
  cursor: pointer;
}

/* 記念日カード */
.cards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  padding: var(--space-3) var(--space-4);
}
.card.pinned {
  border-color: var(--accent);
  background: var(--accent-soft);
}
.card-main {
  min-width: 0;
}
.title-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.title {
  font-weight: 600;
  font-size: 0.95rem;
}
.badge {
  flex: 0 0 auto;
  font-size: 0.66rem;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  padding: 0.05rem 0.5rem;
}
.date {
  margin: var(--space-1) 0 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}
.card-side {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
}
.count {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--accent-ink);
}
.count.today {
  color: var(--accent);
}
.count.past {
  color: var(--text-faint);
  font-weight: 500;
}
.ops {
  display: flex;
  align-items: center;
  gap: 2px;
}
.pin,
.op {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.95rem;
  line-height: 1;
  padding: 4px;
  opacity: 0.45;
  filter: grayscale(1);
  transition: opacity 0.12s ease, filter 0.12s ease;
}
.pin.on {
  opacity: 1;
  filter: none;
}
.pin:hover,
.op:hover {
  opacity: 0.85;
}

/* 空状態 */
.empty {
  margin-top: 22vh;
  text-align: center;
  color: var(--text-muted);
}
.empty .emoji {
  font-size: 2.2rem;
}
.empty-title {
  margin: var(--space-3) 0 var(--space-1);
  font-weight: 600;
  color: var(--text);
}
.empty-sub {
  margin: 0;
  font-size: 0.82rem;
}

/* 追加・編集フォーム（全画面オーバーレイ） */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 30;
  max-width: 480px;
  margin: 0 auto;
  background: var(--bg);
  overflow-y: auto;
  padding: 0 var(--space-4) var(--space-8);
}
.overlay-bar {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  background: var(--bg);
  padding: var(--space-3) 0;
}
.back {
  border: none;
  background: none;
  color: var(--text-muted);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0;
}
.overlay-title {
  margin-left: var(--space-2);
  font-size: 0.95rem;
  font-weight: 600;
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
  box-sizing: border-box;
}
.inp:focus {
  outline: none;
  border-color: var(--accent);
}
.form-error {
  margin: 0;
  color: #c0564f;
  font-size: 0.82rem;
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
.abtn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  font-weight: 600;
}
</style>
