import type { SearchResult } from "@/lib/types";

interface GrokMatch {
  chunk_content: string;
  score: number;
  fields?: Record<string, string>;
}

interface GrokSearchResponse {
  matches?: GrokMatch[];
}

export function parseGrokMatches(data: GrokSearchResponse): SearchResult[] {
  if (!data.matches?.length) return [];

  return data.matches.map((match) => ({
    id: 0,
    slug: match.fields?.slug ?? "",
    title: match.fields?.title ?? "Untitled",
    excerpt: match.fields?.excerpt ?? match.chunk_content.slice(0, 160),
    category: match.fields?.category ?? "General",
    image: match.fields?.image ?? "/images/placeholder.jpg",
    date: match.fields?.date ?? "",
    readTime: Number(match.fields?.readTime ?? 1),
    snippet: match.chunk_content,
    score: match.score,
    highlights: [match.chunk_content.slice(0, 200)],
  }));
}

export async function searchGrok(
  query: string,
  mode: "semantic" | "hybrid"
): Promise<SearchResult[]> {
  const res = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, mode }),
  });

  if (!res.ok) {
    throw new Error("Semantic search unavailable");
  }

  const data = (await res.json()) as { results: SearchResult[] };
  return data.results;
}
