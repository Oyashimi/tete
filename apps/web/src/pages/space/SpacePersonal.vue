<script setup lang="ts">
// じぶんタブ。個人機能（服装／会う前メモ／プレゼント／地雷・好み図鑑）の
// 全項目をここに並べる。★を付けた項目はホームの「じぶん用」に表示される。
// ※各機能の中身は擦り合わせ後に実装。いまは入口タイルとお気に入り操作のみ。
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useFavorites } from "../../composables/useFavorites";
import { PERSONAL_FEATURES } from "../../lib/features";

const route = useRoute();
const spaceId = computed(() => String(route.params.id));
const { isFavorite, toggle } = useFavorites(spaceId.value);
</script>

<template>
  <div class="page">
    <header class="bar">
      <h1>じぶん</h1>
      <p class="lead">あなただけの記録（相手には見えません）</p>
    </header>

    <p class="hint">★を付けた項目はホームにも表示されます</p>

    <ul class="tiles">
      <li
        v-for="f in PERSONAL_FEATURES"
        :key="f.key"
        class="tile"
        :class="{ wide: f.wide }"
      >
        <span class="ico">{{ f.icon }}</span>
        <span class="tile-label">{{ f.label }}</span>
        <button
          class="fav"
          :class="{ on: isFavorite(f.key) }"
          :aria-pressed="isFavorite(f.key)"
          :aria-label="isFavorite(f.key) ? 'お気に入りを解除' : 'お気に入りに追加'"
          @click="toggle(f.key)"
        >
          {{ isFavorite(f.key) ? "★" : "☆" }}
        </button>
      </li>
    </ul>
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
.hint {
  font-size: 0.72rem;
  color: var(--text-faint);
  margin: 0 0 var(--space-3);
}

/* 機能タイル（ホームの個人タイルと見た目を揃える） */
.tiles {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}
.tile {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-height: 84px;
  padding: var(--space-4);
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px dashed var(--border-strong);
}
.tile.wide {
  grid-column: 1 / -1;
}
.tile .ico {
  font-size: 1.4rem;
  line-height: 1;
}
.tile-label {
  font-size: 0.85rem;
  font-weight: 500;
}

/* お気に入りトグル（右上） */
.fav {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 4px;
  color: var(--text-faint);
  transition: color 0.12s ease, transform 0.12s ease;
}
.fav:hover {
  transform: scale(1.15);
}
.fav.on {
  color: var(--accent);
}
</style>
