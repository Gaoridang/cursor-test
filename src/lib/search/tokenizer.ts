import stopWords from "./stop-words.json";

const STOP_WORDS = new Set(stopWords);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }

  return dp[m][n];
}

export function findFuzzyTerm(queryToken: string, vocabulary: string[], maxDistance = 2): string | null {
  if (vocabulary.includes(queryToken)) return queryToken;

  let best: string | null = null;
  let bestDist = maxDistance + 1;

  for (const term of vocabulary) {
    if (Math.abs(term.length - queryToken.length) > maxDistance) continue;
    const dist = levenshtein(queryToken, term);
    if (dist <= maxDistance && dist < bestDist) {
      bestDist = dist;
      best = term;
    }
  }

  return best;
}

/** Resolve a query token to an indexed term: exact → prefix → fuzzy. */
export function resolveTerm(queryToken: string, vocabulary: string[]): string | null {
  if (vocabulary.includes(queryToken)) return queryToken;

  if (queryToken.length >= 3) {
    const prefixMatches = vocabulary.filter((t) => t.startsWith(queryToken));
    if (prefixMatches.length > 0) {
      return prefixMatches.sort((a, b) => a.length - b.length || a.localeCompare(b))[0];
    }
  }

  return findFuzzyTerm(queryToken, vocabulary);
}
