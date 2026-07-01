import stopWords from "./stop-words.json" with { type: "json" };
import userDictionary from "./user-dictionary.json" with { type: "json" };

export const STOP_WORDS = new Set(stopWords);
export const USER_TERMS = new Set(userDictionary);

/** 붙여쓴 복합어 → 분해 토큰 (검색·색인 공통) */
export const DECOMPOSITIONS = {
  고객피드백: ["고객", "피드백"],
  원격근무: ["원격", "근무"],
};

const JOSA_PATTERN =
  /(에서|으로|에게|까지|부터|처럼|하고|이며|에는|과|와|을|를|이|가|은|는|의|에|도|로|한|만)$/;

const MAX_EDGE_BIGRAMS = 2;

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

/** 어절 끝 조사를 제거합니다. */
export function stripJosa(word) {
  if (!isHangulToken(word)) return word;

  let current = word;
  while (current.length >= 2) {
    const next = current.replace(JOSA_PATTERN, "");
    if (next === current || next.length < 2) break;
    current = next;
  }

  return current;
}

function hangulTokens(word) {
  const tokens = [];
  if (word.length < 2 || STOP_WORDS.has(word)) return tokens;

  tokens.push(word);

  for (let i = 0; i < Math.min(MAX_EDGE_BIGRAMS, word.length - 1); i++) {
    const bigram = word.slice(i, i + 2);
    if (!STOP_WORDS.has(bigram)) tokens.push(bigram);
  }

  return tokens;
}

function latinToken(word) {
  if (word.length > 1 && !STOP_WORDS.has(word)) return [word];
  return [];
}

function processHangulSegment(segment) {
  const stripped = stripJosa(segment);

  if (DECOMPOSITIONS[stripped]) {
    return DECOMPOSITIONS[stripped].flatMap((part) => hangulTokens(part));
  }

  if (USER_TERMS.has(stripped)) {
    return hangulTokens(stripped);
  }

  return hangulTokens(stripped);
}

/** 한국어 어절 + edge 바이그램, 영문/숫자 토큰을 추출합니다. */
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
        tokens.push(...processHangulSegment(segment.slice(i, j)));
        i = j;
      } else if (/[a-z0-9]/.test(ch)) {
        let j = i + 1;
        while (j < segment.length && /[a-z0-9]/.test(segment[j])) j++;
        const word = segment.slice(i, j);
        tokens.push(...(USER_TERMS.has(word) ? [word] : latinToken(word)));
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
