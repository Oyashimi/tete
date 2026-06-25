import { computed } from "vue";
import type { PreDateItem, PreDateSection } from "@tete/shared";
import {
  addPreDateItem,
  addPreDateSection,
  preDateItems,
  preDateSections,
  removePreDateItem,
  removePreDateSection,
  updatePreDateItem,
  updatePreDateSection,
} from "../lib/mock-predate";
import { useCurrentUser } from "./useCurrentUser";

// 表示用：セクションに配下の項目をぶら下げた形。
export type PreDateSectionView = PreDateSection & {
  items: PreDateItem[];
};

// 会う前メモ（個人機能）。「セクション（見出し）＋項目」の2階層を扱う。
// 相手には見えない＝owner_user_id が自分のものだけにフィルタする。
export function usePreDate(spaceId: string) {
  const { user } = useCurrentUser();

  // 自分のセクションを作成順に並べ、各セクションへ配下項目（作成順）をぶら下げる。
  const sections = computed<PreDateSectionView[]>(() =>
    preDateSections.value
      .filter((s) => s.spaceId === spaceId && s.ownerUserId === user.value.id)
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((s) => ({
        ...s,
        items: preDateItems.value
          .filter((i) => i.sectionId === s.id)
          .slice()
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      })),
  );

  // いずれも空文字は受け付けず、前後の空白は落とす（本文内の改行は保持）。
  function addSection(title: string) {
    const t = title.trim();
    if (!t) return;
    addPreDateSection(spaceId, user.value.id, t);
  }
  function renameSection(id: string, title: string) {
    const t = title.trim();
    if (!t) return;
    updatePreDateSection(id, t);
  }
  function removeSection(id: string) {
    removePreDateSection(id);
  }
  function addItem(sectionId: string, content: string) {
    const c = content.trim();
    if (!c) return;
    addPreDateItem(sectionId, c);
  }
  function updateItem(id: string, content: string) {
    const c = content.trim();
    if (!c) return;
    updatePreDateItem(id, c);
  }
  function removeItem(id: string) {
    removePreDateItem(id);
  }

  return {
    sections,
    addSection,
    renameSection,
    removeSection,
    addItem,
    updateItem,
    removeItem,
  };
}
