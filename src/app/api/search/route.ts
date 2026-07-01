import { NextResponse } from "next/server";
import { parseGrokMatches } from "@/lib/search/grok";

export async function POST(request: Request) {
  const apiKey = process.env.XAI_API_KEY;
  const collectionId = process.env.XAI_COLLECTION_ID;

  if (!apiKey || !collectionId) {
    return NextResponse.json(
      { error: "Search API not configured" },
      { status: 503 }
    );
  }

  const { query, mode = "hybrid" } = (await request.json()) as {
    query: string;
    mode?: "semantic" | "hybrid";
  };

  if (!query?.trim()) {
    return NextResponse.json({ results: [] });
  }

  const res = await fetch("https://api.x.ai/v1/documents/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      source: { collection_ids: [collectionId] },
      retrieval_mode: { type: mode },
      limit: 10,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Grok search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 502 });
  }

  const data = await res.json();
  const results = parseGrokMatches(data);

  return NextResponse.json({ results });
}
