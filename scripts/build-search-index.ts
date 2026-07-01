import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Garu } from "garu-ko";
import { buildDualInvertedIndex } from "../src/lib/search/inverted-index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const postsDir = path.join(root, "content", "posts");
const outDir = path.join(root, "public", "search");
const outFile = path.join(outDir, "index.json");

function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {} as Record<string, unknown>, content: raw };

  const data: Record<string, unknown> = {};
  for (const line of match[1].split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const colon = trimmed.indexOf(":");
    if (colon === -1) continue;
    const key = trimmed.slice(0, colon).trim();
    let value: unknown = trimmed.slice(colon + 1).trim();
    if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((v) => v.trim().replace(/^["']|["']$/g, ""));
    } else if (
      typeof value === "string" &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, content: match[2] };
}

function stripMarkdown(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*_>\[\]()!`-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function loadPosts() {
  if (!fs.existsSync(postsDir)) return [];
  return fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith(".md"))
    .map((filename, i) => {
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

async function main() {
  console.log("→ Loading garu-ko morphological analyzer...");
  const garu = await Garu.load();

  const documents = loadPosts();
  const index = buildDualInvertedIndex(documents, garu);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(index, null, 2));

  const morphVocab = Object.keys(index.morph.postings).length;
  const ngramVocab = Object.keys(index.ngram.postings).length;

  console.log(
    `Built search index v2 with ${documents.length} documents → ${outFile}`
  );
  console.log(`  morph vocabulary: ${morphVocab}, ngram vocabulary: ${ngramVocab}`);

  garu.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
