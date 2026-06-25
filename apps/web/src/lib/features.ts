// スペース内の機能タイル定義。ホーム／じぶんタブで共通利用する。
// ここを一元化することで、入口の二重定義（表記ゆれ）を防ぐ。

export type Feature = {
  key: string;
  icon: string;
  label: string;
  wide?: boolean; // タイルを横幅いっぱいに広げる
  route?: string; // 遷移先のルート名（未設定なら遷移しない＝準備中）
};

// 共有機能（2人で見る）。
export const SHARED_FEATURES: Feature[] = [
  { key: "calendar", icon: "📅", label: "デート記録・予定", route: "space-calendar" },
  { key: "anniversary", icon: "🎉", label: "記念日", route: "space-anniversary" },
  { key: "bucket", icon: "✨", label: "いつかリスト", wide: true, route: "space-bucket" },
];

// 個人機能（自分だけ・相手に見えない）。
// ホームの「じぶん用」セクションに全項目を表示する。
export const PERSONAL_FEATURES: Feature[] = [
  // デート時に同じ服を避けるため、直近に何を着たかを振り返る用途（記録より参照が主）
  { key: "outfit", icon: "👗", label: "服装記録" },
  { key: "predate", icon: "📝", label: "会う前メモ" },
  { key: "gift", icon: "🎁", label: "プレゼント" },
  { key: "partner", icon: "📖", label: "地雷・好み図鑑", wide: true },
];
