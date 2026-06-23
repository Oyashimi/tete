import { ref } from "vue";
import { MOCK_SPACES, type SpaceView } from "../lib/mock";

// 自分が所属するスペース一覧を返す。
//
// 【モック】いまはダミーを同期で返すだけ。API 紐付け時は、この関数の中身を
//   const res = await fetch("/api/spaces");
//   const { spaces } = await res.json();
// に差し替える（戻り値の形と呼び出し側は変えない）。
export function useSpaces() {
  const spaces = ref<SpaceView[]>(MOCK_SPACES);
  const isPending = ref(false);
  const error = ref<string | null>(null);
  return { spaces, isPending, error };
}
