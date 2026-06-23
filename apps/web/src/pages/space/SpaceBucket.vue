<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  type BucketItemView,
  useBucket,
} from "../../composables/useBucket";

// いつかリスト：いつか一緒にやりたいこと・行きたい場所・おすすめ等を
// チャット風に雑多に殴り書きできる共有スペース。自分は右・相手は左。
const route = useRoute();
const spaceId = computed(() => String(route.params.id));
const { list, add, update, remove, toggleDone } = useBucket(spaceId.value);

// 入力（クイック投稿）
const draft = ref("");
const scroller = ref<HTMLElement | null>(null);

function scrollToBottom() {
  nextTick(() => {
    const el = scroller.value;
    if (el) el.scrollTop = el.scrollHeight;
  });
}

function submit() {
  const t = draft.value.trim();
  if (!t) return;
  add(t);
  draft.value = "";
  scrollToBottom();
}

// 入力欄：Enterで送信、Shift+Enterで改行。
function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    submit();
  }
}

// 件数が増えたら最下部へ（初期表示・投稿時）。
watch(() => list.value.length, scrollToBottom, { immediate: true });

// ── インライン編集 ──
const editingId = ref<string | null>(null);
const editText = ref("");

function startEdit(item: BucketItemView) {
  editingId.value = item.id;
  editText.value = item.title;
}
function commitEdit() {
  if (editingId.value) update(editingId.value, editText.value);
  editingId.value = null;
  editText.value = "";
}
function cancelEdit() {
  editingId.value = null;
  editText.value = "";
}

function onDelete(item: BucketItemView) {
  if (!confirm("このメモを削除しますか？")) return;
  remove(item.id);
}
</script>

<template>
  <div class="page">
    <header class="bar">
      <h1>いつかリスト ✨</h1>
      <p class="lead">いつか一緒に。行きたい場所・やりたいこと・おすすめを気軽にどうぞ</p>
    </header>

    <div ref="scroller" class="stream">
      <div v-if="!list.length" class="empty">
        <span class="emoji">💭</span>
        <p class="empty-title">まだ何もありません</p>
        <p class="empty-sub">下の入力から最初のひとことを書いてみましょう</p>
      </div>

      <div
        v-for="item in list"
        :key="item.id"
        class="row"
        :class="{ mine: item.isMine }"
      >
        <!-- 編集中はインライン入力に切り替え -->
        <div v-if="editingId === item.id" class="bubble editing">
          <textarea
            v-model="editText"
            class="edit-area"
            rows="2"
            maxlength="200"
            @keydown.escape="cancelEdit"
          ></textarea>
          <div class="edit-ops">
            <button class="mini" @click="cancelEdit">取消</button>
            <button class="mini primary" @click="commitEdit">保存</button>
          </div>
        </div>

        <template v-else>
          <div class="bubble" :class="{ done: item.done }">
            <p class="text">{{ item.title }}</p>
          </div>

          <div class="ops">
            <span v-if="item.done" class="done-label">✨叶った！</span>
            <button
              class="op"
              :class="{ on: item.done }"
              :aria-pressed="item.done"
              :aria-label="item.done ? '叶った印を外す' : '叶った印をつける'"
              @click="toggleDone(item)"
            >
              ✓
            </button>
            <template v-if="item.isMine">
              <button class="op" aria-label="編集" @click="startEdit(item)">
                ✎
              </button>
              <button class="op" aria-label="削除" @click="onDelete(item)">
                🗑
              </button>
            </template>
          </div>
        </template>
      </div>
    </div>

    <!-- クイック入力 -->
    <form class="composer" @submit.prevent="submit">
      <textarea
        v-model="draft"
        class="input"
        rows="1"
        placeholder="メモを書く…"
        maxlength="200"
        @keydown="onKeydown"
      ></textarea>
      <button type="submit" class="send" :disabled="!draft.trim()" aria-label="送信">
        ↑
      </button>
    </form>
  </div>
</template>

<style scoped>
/* 上：固定ヘッダー / 中：スクロールするストリーム / 下：固定入力 */
.page {
  max-width: 480px;
  margin: 0 auto;
  height: calc(100dvh - var(--tabbar-h) - env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 var(--space-3);
}
.bar {
  flex: 0 0 auto;
  padding: var(--space-4) var(--space-1) var(--space-2);
}
.bar h1 {
  margin: 0;
  font-size: 1.2rem;
}
.lead {
  margin: var(--space-1) 0 0;
  font-size: 0.76rem;
  color: var(--text-muted);
}

/* ストリーム（チャット本体） */
.stream {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3) 0;
}

.row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 80%;
}
.row.mine {
  align-self: flex-end;
  align-items: flex-end;
}
.bubble {
  position: relative;
  border-radius: var(--radius);
  padding: var(--space-2) var(--space-3);
  background: var(--surface-sub);
  border: 1px solid var(--border);
}
/* 自分のメモはアクセント寄りの面で右側に */
.row.mine .bubble {
  background: var(--accent-soft);
  border-color: var(--accent-soft);
}
.bubble.done {
  background: var(--surface);
  border-style: dashed;
  border-color: var(--border-strong);
}
.text {
  margin: 0;
  font-size: 0.9rem;
  white-space: pre-wrap;
  word-break: break-word;
}
.bubble.done .text {
  color: var(--text-muted);
  text-decoration: line-through;
  text-decoration-color: var(--text-faint);
}
/* 各メモのアクション（叶った印・編集・削除） */
.ops {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 2px var(--space-1) 0;
}
/* 「叶った！」はアクション行に併記。常設の行なので縦シフトが起きない */
.done-label {
  margin-right: 2px;
  font-size: 0.66rem;
  font-weight: 700;
  color: var(--accent-ink);
  white-space: nowrap;
}
.op {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.8rem;
  line-height: 1;
  padding: 3px;
  opacity: 0.4;
  filter: grayscale(1);
  transition: opacity 0.12s ease, filter 0.12s ease;
}
.op:hover {
  opacity: 0.8;
}
.op.on {
  opacity: 1;
  filter: none;
  color: var(--accent);
}

/* インライン編集 */
.bubble.editing {
  width: 100%;
  background: var(--surface);
}
.edit-area {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  padding: var(--space-2);
  font: inherit;
  font-size: 0.9rem;
  color: var(--text);
  resize: vertical;
}
.edit-area:focus {
  outline: none;
  border-color: var(--accent);
}
.edit-ops {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-2);
}
.mini {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: var(--radius-pill);
  font-size: 0.72rem;
  padding: 0.2rem 0.7rem;
  cursor: pointer;
  color: var(--text);
}
.mini.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  font-weight: 600;
}

/* 空状態 */
.empty {
  margin: auto;
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

/* クイック入力（下部固定） */
.composer {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
  padding: var(--space-2) 0 var(--space-3);
  background: var(--bg);
}
.input {
  flex: 1 1 auto;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  padding: var(--space-2) var(--space-3);
  font: inherit;
  font-size: 0.9rem;
  color: var(--text);
  resize: none;
  max-height: 120px;
}
.input:focus {
  outline: none;
  border-color: var(--accent);
}
.send {
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--accent);
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
}
.send:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
