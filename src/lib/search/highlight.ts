import type { InvertedIndex } from "@/lib/types";
import { getVocabulary } from "./inverted-index";
import { isHangulToken, resolveTerm, tokenize } from "./tokenizer";

export function highlightText(text: string, query: string, index?: InvertedIndex | null): string {
  const tokens = tokenize(query);
  if (!tokens.length) return text;

  const vocabulary = index ? getVocabulary(index) : tokens;
  const highlights = new Set<string>();

  for (const token of tokens) {
    highlights.add(token);
    const resolved = index ? resolveTerm(token, vocabulary) : null;
    if (resolved) highlights.add(resolved);
  }

  let result = text;
  const sorted = [...highlights].sort((a, b) => b.length - a.length);

  for (const term of sorted) {
    if (term.length < 2) continue;
    const pattern = isHangulToken(term) ? term : `(?<![\\p{L}\\p{N}])${escapeRegex(term)}(?![\\p{L}\\p{N}])`;
    const regex = new RegExp(`(${pattern})`, "giu");
    result = result.replace(regex, "<mark>$1</mark>");
  }

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
