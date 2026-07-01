import {
  findFuzzyTerm as findFuzzyTermImpl,
  isHangulToken,
  levenshtein as levenshteinImpl,
  resolveTerm as resolveTermImpl,
  tokenize as tokenizeImpl,
} from "./tokenizer.shared.mjs";

export const tokenize = tokenizeImpl as (text: string) => string[];
export const levenshtein = levenshteinImpl as (a: string, b: string) => number;
export const findFuzzyTerm = findFuzzyTermImpl as (
  queryToken: string,
  vocabulary: string[],
  maxDistance?: number
) => string | null;
export const resolveTerm = resolveTermImpl as (queryToken: string, vocabulary: string[]) => string | null;
export { isHangulToken };
