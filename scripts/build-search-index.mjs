import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import stopWords from "../src/lib/search/stop-words.json" with { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const postsDir = path.join(root, "content", "posts");
const outDir = path.join(root, "public", "search");
const outFile = path.join(outDir, "index.json");

const STOP_WORDS = new Set(stopWords);

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const data = {};
  for (const line of match[1].split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const colon = trimmed.indexOf(":");
    if (colon === -1) continue;
    const key = trimmed.slice(0, colon).trim();
    let value = trimmed.slice(colon + 1).trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value.slice(1, -1).split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
    } else if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, content: match[2] };
}

function stripMarkdown(md) {
  return md.replace(/```[\s\S]*?```/g, " ").replace(/[#*_>\[\]()!`-]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function getIndexFields(doc) {
  const tags = Array.isArray(doc.tags) ? doc.tags.join(" ") : String(doc.tags || "");
  return [
    { text: doc.title, weight: 3 },
    { text: doc.excerpt, weight: 2 },
    { text: doc.category, weight: 2 },
    { text: tags, weight: 2 },
    { text: doc.body, weight: 1 },
  ];
}

function buildIndex(documents) {
  const postings = {};
  const docLengths = [];
  const documentFrequency = {};
  const termDocSets = {};

  documents.forEach((doc, docId) => {
    const fields = getIndexFields(doc);
    const tokens = [];
    for (const field of fields) {
      const t = tokenize(field.text);
      for (let i = 0; i < field.weight; i++) tokens.push(...t);
    }
    docLengths.push(tokens.length);
    const seen = new Set();
    for (const term of tokens) {
      if (!postings[term]) postings[term] = [];
      postings[term].push(docId);
      if (!seen.has(term)) {
        seen.add(term);
        if (!termDocSets[term]) termDocSets[term] = new Set();
        termDocSets[term].add(docId);
      }
    }
  });

  for (const [term, set] of Object.entries(termDocSets)) {
    documentFrequency[term] = set.size;
  }

  const avgDocLength = docLengths.length ? docLengths.reduce((a, b) => a + b, 0) / docLengths.length : 0;
  const storedDocuments = documents.map(({ body: _body, tags: _tags, ...doc }) => doc);
  return { postings, docLengths, avgDocLength, documentFrequency, totalDocs: storedDocuments.length, documents: storedDocuments };
}

function loadPosts() {
  if (!fs.existsSync(postsDir)) return [];
  return fs.readdirSync(postsDir).filter((f) => f.endsWith(".md")).map((filename, i) => {
    const raw = fs.readFileSync(path.join(postsDir, filename), "utf8");
    const { data, content } = parseFrontmatter(raw);
    const slug = data.slug || filename.replace(/\.md$/, "");
    const plain = stripMarkdown(content);
    const tags = Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [];
    return {
      id: i,
      slug: String(slug),
      title: String(data.title || slug),
      excerpt: String(data.excerpt || plain.slice(0, 160)),
      category: String(data.category || "General"),
      image: String(data.image || "/images/placeholder.jpg"),
      date: String(data.date || new Date().toISOString().slice(0, 10)),
      readTime: Math.max(1, Math.ceil(plain.split(/\s+/).filter(Boolean).length / 200)),
      snippet: plain.slice(0, 300),
      body: plain,
      tags,
    };
  });
}

const documents = loadPosts();
const index = buildIndex(documents);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(index, null, 2));
console.log(`Built search index with ${documents.length} documents → ${outFile}`);
