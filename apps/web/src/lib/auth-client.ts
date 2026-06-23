import { createAuthClient } from "better-auth/vue";

// フロント用の Better Auth クライアント。同一オリジンなので baseURL は不要
// （/api/auth/* を相対で叩く）。useSession() などが Vue のリアクティブで使える。
export const authClient = createAuthClient({
  basePath: "/api/auth",
});

export const { signIn, signOut, useSession } = authClient;

// Googleでログイン。完了後はログイン後の入口（スペース一覧）へ。
export function signInWithGoogle() {
  return signIn.social({ provider: "google", callbackURL: "/spaces" });
}
