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

export interface InvertedIndex {
  postings: Record<string, number[]>;
  docLengths: number[];
  avgDocLength: number;
  documentFrequency: Record<string, number>;
  totalDocs: number;
  documents: SearchDocument[];
}
