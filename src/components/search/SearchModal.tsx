"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PostListItem } from "@/components/blog/LatestPosts";
import { searchBM25, searchBM25WithGaru } from "@/lib/search/bm25";
import { getGaru } from "@/lib/search/garu";
import { searchGrok } from "@/lib/search/grok";
import { mergeSearchResults } from "@/lib/search/hybrid";
import { highlightText } from "@/lib/search/highlight";
import { getSearchIndex } from "@/lib/search/prefetch";
import type { GaruAnalyzer } from "@/lib/search/garu";
import type { InvertedIndex, SearchMode, SearchResult } from "@/lib/types";
import styles from "./SearchModal.module.css";

const MODE_LABELS: Record<SearchMode, string> = {
  all: "전체",
  keyword: "키워드",
  semantic: "시맨틱",
};

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState<InvertedIndex | null>(null);
  const [garu, setGaru] = useState<GaruAnalyzer | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    if (!index) {
      getSearchIndex()
        .then(setIndex)
        .catch(() => setError("검색 인덱스를 불러오지 못했습니다"));
    }

    if (!garu) {
      getGaru()
        .then(setGaru)
        .catch(() => {});
    }
  }, [open, index, garu]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && results[activeIndex]) {
        router.push(`/blog/${results[activeIndex].slug}`);
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, results, activeIndex, router]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setError(null);
      setActiveIndex(0);
    }
  }, [open]);

  const runSearch = useCallback(
    async (q: string, searchMode: SearchMode) => {
      if (!q.trim()) {
        setResults([]);
        setError(null);
        return;
      }

      setError(null);

      const runBm25 = () => {
        if (!index) return [];
        if (garu) return searchBM25WithGaru(q, index, garu);
        return searchBM25(q, index);
      };

      if (searchMode === "keyword") {
        if (!index) return;
        setResults(runBm25());
        return;
      }

      setLoading(true);
      try {
        if (searchMode === "semantic") {
          const grok = await searchGrok(q, "semantic");
          setResults(grok);
        } else {
          const bm25 = runBm25();
          try {
            const grok = await searchGrok(q, "hybrid");
            setResults(mergeSearchResults(bm25, grok));
          } catch {
            setResults(bm25);
            setError("시맨틱 검색을 사용할 수 없습니다 — 키워드 결과를 표시합니다");
          }
        }
      } catch {
        const bm25 = runBm25();
        if (bm25.length) {
          setResults(bm25);
          setError("시맨틱 검색을 사용할 수 없습니다 — 키워드 결과를 표시합니다");
        } else {
          setError("검색을 사용할 수 없습니다");
        }
      } finally {
        setLoading(false);
      }
    },
    [index, garu]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!index) return;

    if (mode === "keyword") {
      runSearch(query, mode);
      return;
    }

    debounceRef.current = setTimeout(() => runSearch(query, mode), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, mode, runSearch, index, garu]);

  if (!open) return null;

  const isIndexLoading = !index;

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="글 검색"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            className={styles.input}
            placeholder="글 검색..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="검색어"
          />
          <span className={styles.esc}>ESC</span>
        </div>

        <div className={styles.tabs} role="tablist">
          {(["all", "keyword", "semantic"] as SearchMode[]).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={mode === tab}
              className={`${styles.tab} ${mode === tab ? styles.tabActive : ""}`}
              onClick={() => setMode(tab)}
            >
              {MODE_LABELS[tab]}
            </button>
          ))}
        </div>

        <div className={styles.results}>
          {(loading || isIndexLoading) && <div className={styles.spinner} aria-label="불러오는 중" />}
          {error && <p className={styles.error}>{error}</p>}
          {!loading && !isIndexLoading && !results.length && query && !error && (
            <p className={styles.empty}>&ldquo;{query}&rdquo;에 대한 결과가 없습니다</p>
          )}
          {!loading && results.length > 0 && (
            <div className={styles.list} role="listbox">
              {results.map((result, i) => (
                <div
                  key={result.slug}
                  role="option"
                  aria-selected={i === activeIndex}
                  style={{
                    background: i === activeIndex ? "var(--color-border)" : undefined,
                    borderRadius: "8px",
                  }}
                >
                  <PostListItem
                    post={result}
                    titleHtml={highlightText(result.title, query, index)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <span>↑↓ 이동</span>
          <span>↵ 열기</span>
          <span>esc 닫기</span>
        </div>
      </div>
    </div>
  );
}
