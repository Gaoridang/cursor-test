export interface PostFrontmatter {
  title: string;
  slug: string;
  date: string;
  category: string;
  featured?: boolean;
  image: string;
  excerpt: string;
  tags?: string[];
}

export interface Post extends PostFrontmatter {
  body: string;
  html: string;
  readTime: number;
}

export interface SearchDocument {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  date: string;
  readTime: number;
  snippet: string;
}

export interface SearchResult extends SearchDocument {
  score: number;
  highlights?: string[];
}

export type SearchMode = "all" | "keyword" | "semantic";

export interface IndexField {
  postings: Record<string, number[]>;
  docLengths: number[];
  avgDocLength: number;
  documentFrequency: Record<string, number>;
}

export interface InvertedIndexV2 {
  version: 2;
  morph: IndexField;
  ngram: IndexField;
  totalDocs: number;
  documents: SearchDocument[];
}

/** @deprecated v1 단일 필드 — 하위 호환용 */
export interface InvertedIndexV1 {
  version?: 1;
  postings: Record<string, number[]>;
  docLengths: number[];
  avgDocLength: number;
  documentFrequency: Record<string, number>;
  totalDocs: number;
  documents: SearchDocument[];
}

export type InvertedIndex = InvertedIndexV2 | InvertedIndexV1;

export interface QueryTokens {
  morph: string[];
  ngram: string[];
}
