import type { GaruAnalyzer } from "./garu";
import { STOP_WORDS } from "./tokenizer.shared.mjs";
import { isLatinToken } from "./tokenizer";

/** 검색 색인에 포함할 품사 (garu-orama-tokenizer 기준) */
const SEARCH_POS = new Set(["NNG", "NNP", "VV", "VA", "SL", "NR", "SN", "SH", "XR"]);

function isSearchableToken(text: string): boolean {
  const normalized = text.toLowerCase();
  if (!normalized || STOP_WORDS.has(normalized)) return false;
  if (isLatinToken(normalized)) return normalized.length >= 2;
  return normalized.length >= 1;
}

/** garu-ko 형태소 분석 결과에서 검색용 토큰을 추출합니다. */
export function extractMorphTokens(garu: GaruAnalyzer, text: string): string[] {
  if (!text || typeof text !== "string" || !text.trim()) return [];

  const result = garu.analyze(text);
  const analysis = Array.isArray(result) ? result[0] : result;
  const tokens: string[] = [];

  for (const token of analysis.tokens) {
    if (!SEARCH_POS.has(token.pos)) continue;
    const normalized = token.text.toLowerCase();
    if (!isSearchableToken(normalized)) continue;
    tokens.push(normalized);
  }

  return tokens;
}
