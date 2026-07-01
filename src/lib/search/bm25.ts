import type { InvertedIndex, SearchResult } from "@/lib/types";
import { getVocabulary } from "./inverted-index";
import { findFuzzyTerm, tokenize } from "./tokenizer";

const K1 = 1.2;
const B = 0.75;

function idf(term: string, index: InvertedIndex): number {
  const df = index.documentFrequency[term] ?? 0;
  return Math.log(1 + (index.totalDocs - df + 0.5) / (df + 0.5));
}

export function searchBM25(query: string, index: InvertedIndex, limit = 10): SearchResult[] {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return [];

  const vocabulary = getVocabulary(index);
  const scores = new Map<number, number>();

  for (const rawToken of queryTokens) {
    const term = findFuzzyTerm(rawToken, vocabulary) ?? rawToken;
    const postingList = index.postings[term];
    if (!postingList?.length) continue;

    const termIdf = idf(term, index);
    const tfMap = new Map<number, number>();

    for (const docId of postingList) {
      tfMap.set(docId, (tfMap.get(docId) ?? 0) + 1);
    }

    for (const [docId, tf] of tfMap) {
      const dl = index.docLengths[docId] ?? 0;
      const denom = tf + K1 * (1 - B + (B * dl) / (index.avgDocLength || 1));
      const score = termIdf * ((tf * (K1 + 1)) / denom);
      scores.set(docId, (scores.get(docId) ?? 0) + score);
    }
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([docId, score]) => ({
      ...index.documents[docId],
      score,
    }));
}
