import type { GaruAnalyzer } from "./garu";
import type { IndexField, InvertedIndex, QueryTokens, SearchResult } from "@/lib/types";
import { extractMorphTokens } from "./morph-tokens";
import {
  getMorphField,
  getNgramField,
  getVocabulary,
  isLegacyIndex,
} from "./inverted-index";
import { resolveTerm, tokenize } from "./tokenizer";

const K1 = 1.2;
const B = 0.75;
const MORPH_WEIGHT = 2.0;
const NGRAM_WEIGHT = 1.0;

function idf(term: string, field: IndexField, totalDocs: number): number {
  const df = field.documentFrequency[term] ?? 0;
  return Math.log(1 + (totalDocs - df + 0.5) / (df + 0.5));
}

/** 토큰 수에 따른 최소 매칭 개수 (minimum_should_match) */
export function getRequiredMatches(tokenCount: number): number {
  if (tokenCount <= 1) return 1;
  if (tokenCount === 2) return 2;
  return Math.ceil(tokenCount * 0.75);
}

function scoreField(
  queryTokens: string[],
  field: IndexField,
  totalDocs: number,
  weight: number,
  requireMatch: boolean
): { scores: Map<number, number>; matchedCounts: Map<number, number> } {
  const vocabulary = getVocabulary(field);
  const scores = new Map<number, number>();
  const matchedCounts = new Map<number, number>();

  if (!queryTokens.length) return { scores, matchedCounts };

  for (const rawToken of queryTokens) {
    const term = resolveTerm(rawToken, vocabulary);
    if (!term) continue;

    const postingList = field.postings[term];
    if (!postingList?.length) continue;

    const termIdf = idf(term, field, totalDocs);
    const tfMap = new Map<number, number>();

    for (const docId of postingList) {
      tfMap.set(docId, (tfMap.get(docId) ?? 0) + 1);
    }

    for (const [docId, tf] of tfMap) {
      matchedCounts.set(docId, (matchedCounts.get(docId) ?? 0) + 1);

      const dl = field.docLengths[docId] ?? 0;
      const denom = tf + K1 * (1 - B + (B * dl) / (field.avgDocLength || 1));
      const score = weight * termIdf * ((tf * (K1 + 1)) / denom);
      scores.set(docId, (scores.get(docId) ?? 0) + score);
    }
  }

  if (requireMatch) {
    const required = getRequiredMatches(queryTokens.length);
    for (const [docId, count] of matchedCounts) {
      if (count < required) {
        scores.delete(docId);
      }
    }
  }

  return { scores, matchedCounts };
}

function mergeScores(...scoreMaps: Map<number, number>[]): Map<number, number> {
  const merged = new Map<number, number>();
  for (const map of scoreMaps) {
    for (const [docId, score] of map) {
      merged.set(docId, (merged.get(docId) ?? 0) + score);
    }
  }
  return merged;
}

export function tokenizeQuery(query: string, garu?: GaruAnalyzer | null): QueryTokens {
  const ngram = tokenize(query);
  const morph = garu ? extractMorphTokens(garu, query) : ngram;
  return { morph, ngram };
}

export function searchBM25(
  query: string,
  index: InvertedIndex,
  limit = 10,
  queryTokens?: QueryTokens
): SearchResult[] {
  const tokens = queryTokens ?? { morph: tokenize(query), ngram: tokenize(query) };
  const morphField = getMorphField(index);
  const ngramField = getNgramField(index);

  const morphResult = scoreField(tokens.morph, morphField, index.totalDocs, MORPH_WEIGHT, true);

  let scores = morphResult.scores;

  if (ngramField && tokens.ngram.length) {
    const ngramResult = scoreField(
      tokens.ngram,
      ngramField,
      index.totalDocs,
      NGRAM_WEIGHT,
      scores.size === 0
    );
    scores = mergeScores(scores, ngramResult.scores);
  }

  if (!scores.size && !isLegacyIndex(index) && ngramField) {
    const fallback = scoreField(tokens.ngram, ngramField, index.totalDocs, NGRAM_WEIGHT, true);
    scores = fallback.scores;
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([docId, score]) => ({
      ...index.documents[docId],
      score,
    }));
}

/** garu-ko로 검색어를 형태소 분석한 뒤 BM25 검색합니다. */
export function searchBM25WithGaru(
  query: string,
  index: InvertedIndex,
  garu: GaruAnalyzer,
  limit = 10
): SearchResult[] {
  return searchBM25(query, index, limit, tokenizeQuery(query, garu));
}
