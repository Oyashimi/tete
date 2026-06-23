import { computed } from "vue";
import type { BucketItem } from "@tete/shared";
import {
  addBucketItem,
  bucketItems,
  removeBucketItem,
  setBucketStatus,
  updateBucketItem,
} from "../lib/mock-bucket";
import { useCurrentUser } from "./useCurrentUser";

// 表示用に「自分の投稿か」を付けた形（左右の振り分けに使う）。
export type BucketItemView = BucketItem & {
  isMine: boolean;
  done: boolean;
};

export function useBucket(spaceId: string) {
  const { user } = useCurrentUser();

  // このスペースのメモを投稿時刻順（古い→新しい＝チャットと同じ）に並べる。
  const list = computed<BucketItemView[]>(() =>
    bucketItems.value
      .filter((i) => i.spaceId === spaceId)
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((i) => ({
        ...i,
        isMine: i.createdBy === user.value.id,
        done: i.status === "done",
      })),
  );

  // 空文字は追加しない。前後の空白は落とす。
  function add(title: string) {
    const t = title.trim();
    if (!t) return;
    addBucketItem(spaceId, user.value.id, t);
  }

  function update(id: string, title: string) {
    const t = title.trim();
    if (!t) return;
    updateBucketItem(id, t);
  }

  function remove(id: string) {
    removeBucketItem(id);
  }

  // 「できた！」印のトグル（done ⇔ open）。
  function toggleDone(item: BucketItem) {
    setBucketStatus(item.id, item.status === "done" ? "open" : "done");
  }

  return { list, add, update, remove, toggleDone };
}
