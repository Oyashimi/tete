import { computed, ref } from "vue";
import { MOCK_SPACES, type SpaceView } from "../lib/mock";

// 単一スペースを返す。
//
// 【モック】id に一致するダミーを返す。API 紐付け時は
//   const res = await fetch(`/api/spaces/${id}`);
//   const { space } = await res.json();
// に差し替える（isPaired / partnerName は本番ではメンバー情報から導出）。
export function useSpace(id: string) {
  const space = ref<SpaceView | null>(
    MOCK_SPACES.find((s) => s.id === id) ?? null,
  );
  const isPending = ref(false);

  // 付き合った日からの日数（当日を1日目）。startedOn 未設定なら null。
  const daysTogether = computed(() => {
    const startedOn = space.value?.startedOn;
    if (!startedOn) return null;
    const start = new Date(startedOn).getTime();
    if (Number.isNaN(start)) return null;
    return Math.max(0, Math.floor((Date.now() - start) / 86_400_000)) + 1;
  });

  return { space, isPending, daysTogether };
}
