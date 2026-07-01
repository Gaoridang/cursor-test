import stopWords from "./stop-words.json" with { type: "json" };

export const STOP_WORDS = new Set(stopWords);

export function isHangulChar(ch) {
  const code = ch.charCodeAt(0);
  return code >= 0xac00 && code <= 0xd7a3;
}

export function isHangulToken(token) {
  return /^[\uac00-\ud7a3]+$/.test(token);
}

export function isLatinToken(token) {
  return /^[a-z0-9]+$/.test(token);
}

function hangulTokens(word) {
  const tokens = [];
  if (word.length < 2 || STOP_WORDS.has(word)) return tokens;

  tokens.push(word);
  if (word.length >= 3) {
    for (let i = 0; i < word.length - 1; i++) {
      const bigram = word.slice(i, i + 2);
      if (!STOP_WORDS.has(bigram)) tokens.push(bigram);
    }
  }

  return tokens;
}

function latinToken(word) {
  if (word.length > 1 && !STOP_WORDS.has(word)) return [word];
  return [];
}

/** 한국어 어절 + 바이그램, 영문/숫자 토큰을 추출합니다. */
export function tokenize(text) {
  const normalized = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ");
  const tokens = [];

  for (const segment of normalized.split(/\s+/)) {
    if (!segment) continue;

    let i = 0;
    while (i < segment.length) {
      const ch = segment[i];

      if (isHangulChar(ch)) {
        let j = i + 1;
        while (j < segment.length && isHangulChar(segment[j])) j++;
        tokens.push(...hangulTokens(segment.slice(i, j)));
        i = j;
      } else if (/[a-z0-9]/.test(ch)) {
        let j = i + 1;
        while (j < segment.length && /[a-z0-9]/.test(segment[j])) j++;
        tokens.push(...latinToken(segment.slice(i, j)));
        i = j;
      } else {
        i++;
      }
    }
  }

  return tokens;
}

export function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

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

export function findFuzzyTerm(queryToken, vocabulary, maxDistance = 1) {
  if (vocabulary.includes(queryToken)) return queryToken;

  const pool = vocabulary.filter((term) =>
    isHangulToken(queryToken) ? isHangulToken(term) : isLatinToken(term)
  );

  let best = null;
  let bestDist = maxDistance + 1;

  for (const term of pool) {
    if (Math.abs(term.length - queryToken.length) > maxDistance) continue;
    const dist = levenshtein(queryToken, term);
    if (dist <= maxDistance && dist < bestDist) {
      bestDist = dist;
      best = term;
    }
  }

  return best;
}

/** exact → prefix → fuzzy 순으로 인덱스 용어를 찾습니다. */
export function resolveTerm(queryToken, vocabulary) {
  if (vocabulary.includes(queryToken)) return queryToken;

  const minPrefix = isHangulToken(queryToken) ? 2 : 3;
  if (queryToken.length >= minPrefix) {
    const prefixMatches = vocabulary.filter((t) => t.startsWith(queryToken));
    if (prefixMatches.length > 0) {
      return prefixMatches.sort((a, b) => a.length - b.length || a.localeCompare(b))[0];
    }
  }

  return findFuzzyTerm(queryToken, vocabulary);
}
