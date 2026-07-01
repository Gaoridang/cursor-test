"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PostListItem } from "@/components/blog/LatestPosts";
import { searchBM25 } from "@/lib/search/bm25";
import { searchGrok } from "@/lib/search/grok";
import { mergeSearchResults } from "@/lib/search/hybrid";
import { highlightText } from "@/lib/search/highlight";
import type { InvertedIndex, SearchMode, SearchResult } from "@/lib/types";
import styles from "./SearchModal.module.css";

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
  const [activeIndex, setActiveIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    if (!index) {
      fetch("/search/index.json")
        .then((r) => r.json())
        .then(setIndex)
        .catch(() => setError("Failed to load search index"));
    }
  }, [open, index]);

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

      if (searchMode === "keyword") {
        if (!index) return;
        const bm25 = searchBM25(q, index);
        setResults(bm25);
        return;
      }

      setLoading(true);
      try {
        if (searchMode === "semantic") {
          const grok = await searchGrok(q, "semantic");
          setResults(grok);
        } else {
          const bm25 = index ? searchBM25(q, index) : [];
          try {
            const grok = await searchGrok(q, "hybrid");
            setResults(mergeSearchResults(bm25, grok));
          } catch {
            setResults(bm25);
            setError("Semantic search unavailable — showing keyword results");
          }
        }
      } catch {
        if (index) {
          setResults(searchBM25(q, index));
          setError("Semantic search unavailable — showing keyword results");
        } else {
          setError("Search unavailable");
        }
      } finally {
        setLoading(false);
      }
    },
    [index]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (mode === "keyword") {
      runSearch(query, mode);
      return;
    }

    debounceRef.current = setTimeout(() => runSearch(query, mode), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, mode, runSearch]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Search posts"
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
            placeholder="Search posts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search query"
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
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.results}>
          {loading && <div className={styles.spinner} aria-label="Loading" />}
          {error && <p className={styles.error}>{error}</p>}
          {!loading && !results.length && query && !error && (
            <p className={styles.empty}>No results for &ldquo;{query}&rdquo;</p>
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
                    titleHtml={highlightText(result.title, query)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
