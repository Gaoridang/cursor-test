import type { SearchResult } from "@/lib/types";

function normalizeScores(results: SearchResult[]): SearchResult[] {
  if (!results.length) return [];
  const max = Math.max(...results.map((r) => r.score), 0.001);
  return results.map((r) => ({ ...r, score: r.score / max }));
}

export function mergeSearchResults(
  bm25: SearchResult[],
  grok: SearchResult[],
  bm25Weight = 0.5
): SearchResult[] {
  const grokWeight = 1 - bm25Weight;
  const normalizedBm25 = normalizeScores(bm25);
  const normalizedGrok = normalizeScores(grok);
  const merged = new Map<string, SearchResult>();

  for (const result of normalizedBm25) {
    merged.set(result.slug, { ...result, score: result.score * bm25Weight });
  }

  for (const result of normalizedGrok) {
    const existing = merged.get(result.slug);
    if (existing) {
      merged.set(result.slug, {
        ...existing,
        score: existing.score + result.score * grokWeight,
        highlights: result.highlights ?? existing.highlights,
        snippet: result.snippet || existing.snippet,
      });
    } else {
      merged.set(result.slug, { ...result, score: result.score * grokWeight });
    }
  }

  return [...merged.values()].sort((a, b) => b.score - a.score);
}
