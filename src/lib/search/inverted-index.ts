import type { InvertedIndex, SearchDocument } from "@/lib/types";
import { tokenize } from "./tokenizer";

export function buildInvertedIndex(documents: SearchDocument[]): InvertedIndex {
  const postings: Record<string, number[]> = {};
  const docLengths: number[] = [];
  const documentFrequency: Record<string, number> = {};
  const termDocSets: Record<string, Set<number>> = {};

  documents.forEach((doc, docId) => {
    const fields = [
      { text: doc.title, weight: 3 },
      { text: doc.excerpt, weight: 1 },
      { text: doc.snippet, weight: 1 },
      { text: doc.category, weight: 2 },
    ];

    const tokens: string[] = [];
    for (const field of fields) {
      const fieldTokens = tokenize(field.text);
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
    docLengths.length > 0
      ? docLengths.reduce((a, b) => a + b, 0) / docLengths.length
      : 0;

  return {
    postings,
    docLengths,
    avgDocLength,
    documentFrequency,
    totalDocs: documents.length,
    documents,
  };
}

export function getVocabulary(index: InvertedIndex): string[] {
  return Object.keys(index.postings);
}
