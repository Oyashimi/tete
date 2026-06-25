<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";

// スペース内の共通レイアウト。下部タブで各タブを切り替える。
// タブは現在のスペース（:id）にスコープされる。
const route = useRoute();
const spaceId = computed(() => String(route.params.id));

const tabs = [
  { name: "space", icon: "🏠", label: "ホーム" },
  { name: "space-calendar", icon: "📅", label: "カレンダー" },
];
</script>

<template>
  <div class="layout">
    <div class="content">
      <RouterView :key="spaceId" />
    </div>

    <nav class="tabbar">
      <div class="tabs">
        <RouterLink
          v-for="t in tabs"
          :key="t.name"
          class="tab"
          :class="{ active: route.name === t.name }"
          :to="{ name: t.name, params: { id: spaceId } }"
        >
          <span class="tab-ico">{{ t.icon }}</span>
          <span class="tab-label">{{ t.label }}</span>
        </RouterLink>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100dvh;
}
/* 下部タブ（fixed）に隠れないよう、コンテンツ下部に余白を確保 */
.content {
  padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom, 0px));
}

.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  height: calc(var(--tabbar-h) + env(safe-area-inset-bottom, 0px));
  display: flex;
  justify-content: center;
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.tabs {
  display: flex;
  width: 100%;
  max-width: 480px;
  height: var(--tabbar-h);
}
.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-decoration: none;
  color: var(--text-faint);
  transition: color 0.12s ease;
}
.tab-ico {
  font-size: 1.25rem;
  line-height: 1;
  filter: grayscale(1);
  opacity: 0.55;
  transition: filter 0.12s ease, opacity 0.12s ease;
}
.tab-label {
  font-size: 0.66rem;
  letter-spacing: 0.02em;
}
.tab.active {
  color: var(--accent-ink);
}
.tab.active .tab-ico {
  filter: none;
  opacity: 1;
}
</style>
