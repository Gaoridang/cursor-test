import type { SearchDocument } from "@/lib/types";

export interface IndexField {
  text: string;
  weight: number;
}

/** Fields and weights used when building the inverted index. */
export function getIndexFields(
  doc: SearchDocument & { body?: string; tags?: string | string[] }
): IndexField[] {
  const tags = Array.isArray(doc.tags) ? doc.tags.join(" ") : (doc.tags ?? "");
  return [
    { text: doc.title, weight: 3 },
    { text: doc.excerpt, weight: 2 },
    { text: doc.category, weight: 2 },
    { text: tags, weight: 2 },
    { text: doc.body ?? doc.snippet, weight: 1 },
  ];
}
