import { ref } from "vue";
import { MOCK_USER } from "../lib/mock";

// ログイン中ユーザーを返す。
//
// 【モック】デザイン段階では常にログイン済み扱いにして、毎回 Google ログインを
// 通さずに画面を作り込めるようにする。API 紐付け時は Better Auth の
// useSession() に差し替える（user が null なら未ログイン）。
export function useCurrentUser() {
  const user = ref(MOCK_USER);
  const isPending = ref(false);
  return { user, isPending };
}
