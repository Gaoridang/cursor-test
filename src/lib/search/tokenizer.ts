const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
  "do", "does", "did", "will", "would", "could", "should", "may", "might", "must",
  "that", "this", "these", "those", "it", "its", "as", "if", "then", "than", "when",
  "what", "which", "who", "how", "why", "where", "your", "you", "we", "they", "their",
  "our", "my", "me", "him", "her", "not", "no", "can", "about", "into", "over", "after",
  "이", "그", "저", "의", "가", "을", "를", "에", "에서", "와", "과", "도", "로", "으로",
  "은", "는", "이", "가", "하다", "있다", "되다", "하는", "한다", "합니다",
]);

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
