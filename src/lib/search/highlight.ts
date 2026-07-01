import { resolveTerm, tokenize } from "./tokenizer";
import { getVocabulary } from "./inverted-index";
import type { InvertedIndex } from "@/lib/types";

export function highlightText(text: string, query: string, index?: InvertedIndex | null): string {
  const tokens = tokenize(query);
  if (!tokens.length) return text;

  const vocabulary = index ? getVocabulary(index) : tokens;
  let result = text;

  for (const token of tokens) {
    const resolved = index ? (resolveTerm(token, vocabulary) ?? token) : token;
    const regex = new RegExp(`(${escapeRegex(resolved)})`, "gi");
    result = result.replace(regex, "<mark>$1</mark>");

    if (resolved !== token) {
      const queryRegex = new RegExp(`(${escapeRegex(token)})`, "gi");
      result = result.replace(queryRegex, "<mark>$1</mark>");
    }
  }

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
