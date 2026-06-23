import type { Space } from "@tete/shared";

// デザイン段階用のダミーデータ置き場。
// API 紐付け時は各 composable の中身を本物の fetch に差し替えるだけで、
// 画面側は無変更で済むようにここへ隔離する。

// 【モック】ログイン中ユーザー（本番は Better Auth の useSession() から取る）。
export const MOCK_USER = {
  id: "mock-user-1",
  name: "はなこ",
  email: "hanako@example.com",
  image: null as string | null,
};

// スペース表示に必要な追加情報（Space 契約には無い、メンバー由来の派生値）。
// - isPaired: 相手が参加済みか（メンバー2人）。未参加＝ソロ状態。
// - partnerName: 2人状態のときの相手メンバーのプロフィール名。
// 本番では space_members を引いて算出する。
export type SpaceView = Space & {
  isPaired: boolean;
  partnerName: string | null;
};

// 【モック】自分が所属するスペース一覧。
// 重要：ソロは"状態"であって"種類"ではない。最初は必ず kind='couple' の箱が
// メンバー1人（ソロ状態）で始まり、招待で相手が入ると2人になる＝同じ箱。
// （kind='solo' は複数人モード＝課金専用の箱なので、ここには出さない）
export const MOCK_SPACES: SpaceView[] = [
  {
    // ② 2人状態（相手が参加済み）
    id: "11111111-1111-4111-8111-111111111111",
    kind: "couple",
    displayName: null,
    startedOn: "2024-02-14",
    createdAt: "2024-02-14T00:00:00.000Z",
    joinedAt: "2024-02-14T00:00:00.000Z",
    isPaired: true,
    partnerName: "たろう",
  },
  {
    // ① ソロ状態（まだ相手が未参加）
    id: "22222222-2222-4222-8222-222222222222",
    kind: "couple",
    displayName: null,
    startedOn: null,
    createdAt: "2025-09-01T00:00:00.000Z",
    joinedAt: "2025-09-01T00:00:00.000Z",
    isPaired: false,
    partnerName: null,
  },
];
