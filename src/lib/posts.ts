import fs from "fs";
import path from "path";
import { parseFrontmatter } from "@/lib/parse/frontmatter";
import { markdownToHtml, stripMarkdown } from "@/lib/parse/markdown";
import type { Post, PostFrontmatter } from "@/lib/types";
import { formatDate } from "@/lib/dates";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

function wordCount(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length || 1;
}

function toPost(raw: string, filename: string): Post {
  const { data, content } = parseFrontmatter(raw);
  const slug =
    (typeof data.slug === "string" && data.slug) ||
    filename.replace(/\.md$/, "");

  const frontmatter: PostFrontmatter = {
    title: String(data.title ?? slug),
    slug,
    date: String(data.date ?? new Date().toISOString().slice(0, 10)),
    category: String(data.category ?? "General"),
    featured: data.featured === true,
    image: String(data.image ?? "/images/placeholder.jpg"),
    excerpt: String(data.excerpt ?? stripMarkdown(content).slice(0, 160)),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
  };

  const plain = stripMarkdown(content);
  const readTime = Math.max(1, Math.ceil(wordCount(plain) / 200));

  return {
    ...frontmatter,
    body: content,
    html: markdownToHtml(content),
    readTime,
  };
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((filename) => toPost(fs.readFileSync(path.join(POSTS_DIR, filename), "utf8"), filename))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export { formatDate } from "@/lib/dates";
