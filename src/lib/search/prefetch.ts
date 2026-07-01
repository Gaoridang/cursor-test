import type { InvertedIndex } from "@/lib/types";
import { getGaru } from "./garu";

let indexCache: InvertedIndex | null = null;
let indexPromise: Promise<InvertedIndex> | null = null;

/** 캐시된 검색 인덱스를 반환하거나, 없으면 fetch합니다. */
export function getSearchIndex(): Promise<InvertedIndex> {
  if (indexCache) return Promise.resolve(indexCache);

  if (!indexPromise) {
    indexPromise = fetch("/search/index.json")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load search index");
        return response.json() as Promise<InvertedIndex>;
      })
      .then((data) => {
        indexCache = data;
        return data;
      });
  }

  return indexPromise;
}

/** 페이지 로드 후 idle 시점에 검색 리소스를 미리 불러옵니다. */
export function prefetchSearchResources(): void {
  if (typeof window === "undefined") return;

  const run = () => {
    void getSearchIndex().catch(() => {});
    void getGaru().catch(() => {});
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: 2000 });
  } else {
    setTimeout(run, 0);
  }
}
