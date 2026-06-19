<script setup lang="ts">
import { useRoute } from "vue-router";

// スペース（箱）画面のプレースホルダ。カレンダー・各機能はここに載せていく。
const route = useRoute();
</script>

<template>
  <main class="wrap">
    <h1>スペース</h1>
    <p>space_id: {{ route.params.id }}</p>
  </main>
</template>

<style scoped>
.wrap {
  padding: 1.5rem;
}
</style>
