import type { IndexField, InvertedIndex, InvertedIndexV1, SearchDocument } from "@/lib/types";
import type { GaruAnalyzer } from "./garu";
import { getIndexFields } from "./index-fields";
import { extractMorphTokens } from "./morph-tokens";
import { tokenize as tokenizeNgram } from "./tokenizer";

function buildField(
  documents: (SearchDocument & { body?: string; tags?: string | string[] })[],
  getTokens: (text: string) => string[]
): IndexField {
  const postings: Record<string, number[]> = {};
  const docLengths: number[] = [];
  const documentFrequency: Record<string, number> = {};
  const termDocSets: Record<string, Set<number>> = {};

  documents.forEach((doc, docId) => {
    const fields = getIndexFields(doc);
    const tokens: string[] = [];

    for (const field of fields) {
      const fieldTokens = getTokens(field.text);
      for (let i = 0; i < field.weight; i++) {
        tokens.push(...fieldTokens);
      }
    }

    docLengths.push(tokens.length);

    const seen = new Set<string>();
    for (const term of tokens) {
      if (!postings[term]) postings[term] = [];
      postings[term].push(docId);
      if (!seen.has(term)) {
        seen.add(term);
        if (!termDocSets[term]) termDocSets[term] = new Set();
        termDocSets[term].add(docId);
      }
    }
  });

  for (const [term, set] of Object.entries(termDocSets)) {
    documentFrequency[term] = set.size;
  }

  const avgDocLength =
    docLengths.length > 0 ? docLengths.reduce((a, b) => a + b, 0) / docLengths.length : 0;

  return { postings, docLengths, avgDocLength, documentFrequency };
}

export function buildDualInvertedIndex(
  documents: (SearchDocument & { body?: string; tags?: string | string[] })[],
  garu: GaruAnalyzer
): InvertedIndex {
  const morph = buildField(documents, (text) => extractMorphTokens(garu, text));
  const ngram = buildField(documents, (text) => tokenizeNgram(text));

  const storedDocuments = documents.map(({ body: _body, tags: _tags, ...doc }) => doc);

  return {
    version: 2,
    morph,
    ngram,
    totalDocs: storedDocuments.length,
    documents: storedDocuments,
  };
}

export function getVocabulary(field: IndexField): string[] {
  return Object.keys(field.postings);
}

/** v1 단일 필드 인덱스 호환 */
export function isLegacyIndex(index: InvertedIndex): index is InvertedIndexV1 {
  return index.version !== 2;
}

export function getMorphField(index: InvertedIndex): IndexField {
  if (isLegacyIndex(index)) {
    return {
      postings: index.postings,
      docLengths: index.docLengths,
      avgDocLength: index.avgDocLength,
      documentFrequency: index.documentFrequency,
    };
  }
  return index.morph;
}

export function getNgramField(index: InvertedIndex): IndexField | null {
  if (isLegacyIndex(index)) return null;
  return index.ngram;
}
