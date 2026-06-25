<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import type { PreDateItem } from "@tete/shared";
import {
  type PreDateSectionView,
  usePreDate,
} from "../../composables/usePreDate";

// 会う前メモ：次に会う前に話したいこと・確認したいこと等を
// 「セクション（見出し）＋項目」の2階層で書き留める個人メモ。
// 相手には見えない（owner_user_id が自分のものだけ表示）。
const route = useRoute();
const spaceId = computed(() => String(route.params.id));
const {
  sections,
  addSection,
  renameSection,
  removeSection,
  addItem,
  updateItem,
  removeItem,
} = usePreDate(spaceId.value);

// 入力上限。schemas.ts（title max 50 / content max 1000）と揃える。
const TITLE_MAX = 50;
const CONTENT_MAX = 1000;

// ── セクション追加（最下部） ──
const newSectionTitle = ref("");
function submitSection() {
  const t = newSectionTitle.value.trim();
  if (!t) return;
  addSection(t);
  newSectionTitle.value = "";
}

// ── セクション見出しのリネーム ──
const editingSectionId = ref<string | null>(null);
const editSectionTitle = ref("");
function startEditSection(s: PreDateSectionView) {
  editingSectionId.value = s.id;
  editSectionTitle.value = s.title;
}
function commitEditSection() {
  if (!editingSectionId.value) return;
  const title = editSectionTitle.value.trim();
  // 空（空白のみ）の場合は編集を閉じず、入力を継続させる
  if (!title) return;
  renameSection(editingSectionId.value, title);
  editingSectionId.value = null;
  editSectionTitle.value = "";
}
function cancelEditSection() {
  editingSectionId.value = null;
  editSectionTitle.value = "";
}
function onDeleteSection(s: PreDateSectionView) {
  const msg = s.items.length
    ? `「${s.title}」と中の項目（${s.items.length}件）を削除しますか？`
    : `「${s.title}」を削除しますか？`;
  if (!confirm(msg)) return;
  removeSection(s.id);
}

// ── 項目追加（セクションごとの入力欄） ──
const itemDrafts = reactive<Record<string, string>>({});
function submitItem(sectionId: string) {
  const c = (itemDrafts[sectionId] ?? "").trim();
  if (!c) return;
  addItem(sectionId, c);
  itemDrafts[sectionId] = "";
}

// ── 項目のインライン編集 ──
const editingItemId = ref<string | null>(null);
const editItemText = ref("");
function startEditItem(item: PreDateItem) {
  editingItemId.value = item.id;
  editItemText.value = item.content;
}
function commitEditItem() {
  if (editingItemId.value) updateItem(editingItemId.value, editItemText.value);
  editingItemId.value = null;
  editItemText.value = "";
}
function cancelEditItem() {
  editingItemId.value = null;
  editItemText.value = "";
}
function onDeleteItem(item: PreDateItem) {
  if (!confirm("この項目を削除しますか？")) return;
  removeItem(item.id);
}
</script>

<template>
  <div class="page">
    <header class="bar">
      <h1>会う前メモ 📝</h1>
      <p class="lead">次に会う前に話したいこと・確認したいこと（相手には見えません）</p>
    </header>

    <div class="sections">
      <section v-for="s in sections" :key="s.id" class="section">
        <!-- セクション見出し -->
        <div class="section-head">
          <template v-if="editingSectionId === s.id">
            <input
              v-model="editSectionTitle"
              class="section-title-input"
              :maxlength="TITLE_MAX"
              @keydown.enter.prevent="commitEditSection"
              @keydown.escape="cancelEditSection"
            />
            <button type="button" class="mini" @click="cancelEditSection">
              取消
            </button>
            <button
              type="button"
              class="mini primary"
              :disabled="!editSectionTitle.trim()"
              @click="commitEditSection"
            >
              保存
            </button>
          </template>
          <template v-else>
            <h2 class="section-title">{{ s.title }}</h2>
            <div class="section-ops">
              <button class="op" aria-label="見出しを編集" @click="startEditSection(s)">
                ✎
              </button>
              <button class="op" aria-label="セクションを削除" @click="onDeleteSection(s)">
                🗑
              </button>
            </div>
          </template>
        </div>

        <!-- 項目リスト -->
        <ul v-if="s.items.length" class="items">
          <li v-for="item in s.items" :key="item.id" class="item">
            <template v-if="editingItemId === item.id">
              <textarea
                v-model="editItemText"
                class="edit-area"
                rows="2"
                :maxlength="CONTENT_MAX"
                @keydown.escape="cancelEditItem"
              ></textarea>
              <div class="edit-ops">
                <button type="button" class="mini" @click="cancelEditItem">
                  取消
                </button>
                <button
                  type="button"
                  class="mini primary"
                  :disabled="!editItemText.trim()"
                  @click="commitEditItem"
                >
                  保存
                </button>
              </div>
            </template>
            <template v-else>
              <p class="item-text">{{ item.content }}</p>
              <div class="item-ops">
                <button class="op" aria-label="編集" @click="startEditItem(item)">
                  ✎
                </button>
                <button class="op" aria-label="削除" @click="onDeleteItem(item)">
                  🗑
                </button>
              </div>
            </template>
          </li>
        </ul>
        <p v-else class="items-empty">まだ項目がありません</p>

        <!-- 項目追加 -->
        <form class="item-add" @submit.prevent="submitItem(s.id)">
          <textarea
            v-model="itemDrafts[s.id]"
            class="item-input"
            rows="1"
            :maxlength="CONTENT_MAX"
            placeholder="項目を追加…（改行できます）"
          ></textarea>
          <button
            type="submit"
            class="add-mini"
            :disabled="!(itemDrafts[s.id] || '').trim()"
            aria-label="項目を追加"
          >
            ＋
          </button>
        </form>
      </section>
    </div>

    <!-- セクション追加 -->
    <form class="section-add" @submit.prevent="submitSection">
      <input
        v-model="newSectionTitle"
        class="section-add-input"
        :maxlength="TITLE_MAX"
        placeholder="新しいセクション（例：話したいこと）"
      />
      <button type="submit" class="add" :disabled="!newSectionTitle.trim()">
        ＋ 追加
      </button>
    </form>
  </div>
</template>

<style scoped>
.page {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 var(--space-4) var(--space-8);
}
.bar {
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

/* セクション一覧 */
.sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.section {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  padding: var(--space-3) var(--space-4) var(--space-4);
}

/* セクション見出し */
.section-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 28px;
  margin-bottom: var(--space-2);
}
.section-title {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}
.section-ops {
  display: flex;
  gap: 2px;
}
.section-title-input {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  padding: var(--space-1) var(--space-2);
  font: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
}
.section-title-input:focus {
  outline: none;
  border-color: var(--accent);
}

/* 項目リスト */
.items {
  list-style: none;
  margin: 0 0 var(--space-2);
  padding: 0;
  display: flex;
  flex-direction: column;
}
.item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--border);
}
.item:last-child {
  border-bottom: none;
}
.item-text {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.5;
  /* 改行をそのまま反映（保存値は生のまま・<br>変換はしない） */
  white-space: pre-wrap;
  word-break: break-word;
  /* 「・」分だけ字下げし、折り返し2行目以降の行頭を揃える */
  padding-left: 1em;
  text-indent: -1em;
}
.item-text::before {
  content: "・";
  color: var(--text-faint);
}
.item-ops {
  flex: 0 0 auto;
  display: flex;
  gap: 2px;
}
.items-empty {
  margin: 0 0 var(--space-2);
  font-size: 0.78rem;
  color: var(--text-faint);
}

/* 操作ボタン（編集・削除） */
.op {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.8rem;
  line-height: 1;
  padding: 3px;
  opacity: 0.4;
  filter: grayscale(1);
  transition: opacity 0.12s ease;
}
.op:hover {
  opacity: 0.85;
}

/* 項目追加フォーム */
.item-add {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-1);
}
.item-input {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  padding: var(--space-2);
  font: inherit;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--text);
  resize: vertical;
  min-height: 38px;
}
.item-input:focus {
  outline: none;
  border-color: var(--accent);
}
.add-mini {
  flex: 0 0 auto;
  width: 34px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-sub);
  color: var(--text);
  font-size: 1rem;
  cursor: pointer;
}
.add-mini:disabled {
  opacity: 0.4;
  cursor: default;
}

/* インライン編集（項目） */
.edit-area {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  padding: var(--space-2);
  font: inherit;
  font-size: 0.88rem;
  line-height: 1.5;
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
  margin: var(--space-2) 0;
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
.mini.primary:disabled {
  opacity: 0.4;
  cursor: default;
}

/* セクション追加（最下部） */
.section-add {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-4);
}
.section-add-input {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius);
  background: var(--surface);
  padding: var(--space-3);
  font: inherit;
  font-size: 0.88rem;
  color: var(--text);
}
.section-add-input:focus {
  outline: none;
  border-color: var(--accent);
}
.add {
  flex: 0 0 auto;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--accent);
  color: #fff;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.4rem 1rem;
  cursor: pointer;
  white-space: nowrap;
}
.add:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
