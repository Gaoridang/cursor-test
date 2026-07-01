import type { InvertedIndex } from "@/lib/types";
import { getGaru, isGaruLoaded } from "./garu";

let indexCache: InvertedIndex | null = null;
let indexPromise: Promise<InvertedIndex> | null = null;

/** 이미 로드된 인덱스 캐시를 동기적으로 반환합니다. */
export function getCachedSearchIndex(): InvertedIndex | null {
  return indexCache;
}

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

/** 페이지 로드 시 검색 리소스를 즉시 불러옵니다. */
export function prefetchSearchResources(): void {
  if (typeof window === "undefined") return;

  void getSearchIndex().catch(() => {});

  if (isGaruLoaded()) return;

  const loadGaru = () => {
    void getGaru().catch(() => {});
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(loadGaru, { timeout: 1000 });
  } else {
    setTimeout(loadGaru, 0);
  }
}
