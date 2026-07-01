import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const postsDir = path.join(root, "content", "posts");
const stateFile = path.join(root, "collection-sync-state.json");

const MGMT_KEY = process.env.XAI_MANAGEMENT_API_KEY;
const COLLECTION_ID = process.env.XAI_COLLECTION_ID;

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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, content: match[2] };
}

function hashContent(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function loadPosts() {
  if (!fs.existsSync(postsDir)) return [];
  return fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith(".md"))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(postsDir, filename), "utf8");
      const { data, content } = parseFrontmatter(raw);
      const slug = String(data.slug || filename.replace(/\.md$/, ""));
      return {
        slug,
        content,
        hash: hashContent(raw),
        fields: {
          slug,
          title: String(data.title || slug),
          date: String(data.date || ""),
          category: String(data.category || "General"),
          image: String(data.image || "/images/placeholder.jpg"),
          excerpt: String(data.excerpt || content.slice(0, 160)),
          readTime: String(Math.max(1, Math.ceil(content.split(/\s+/).length / 200))),
          contentHash: hashContent(raw),
        },
      };
    });
}

function loadState() {
  if (!fs.existsSync(stateFile)) return { files: {} };
  return JSON.parse(fs.readFileSync(stateFile, "utf8"));
}

function saveState(state) {
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

async function listRemoteDocuments() {
  const res = await fetch(
    `https://management-api.x.ai/v1/collections/${COLLECTION_ID}/documents`,
    { headers: { Authorization: `Bearer ${MGMT_KEY}` } }
  );
  if (!res.ok) {
    console.warn("Could not list collection documents:", await res.text());
    return {};
  }

  const data = await res.json();
  const documents = data.documents || data.data || data.items || [];
  const bySlug = {};

  for (const doc of documents) {
    const fileId = doc.file_id || doc.document_id || doc.id;
    const fields = doc.fields || {};
    const slug =
      fields.slug ||
      (doc.name || "").replace(/\.md$/, "");
    if (slug && fileId) {
      bySlug[slug] = {
        fileId,
        hash: fields.contentHash || null,
      };
    }
  }

  return bySlug;
}

async function hydrateState(state) {
  const remote = await listRemoteDocuments();
  const hydrated = { files: { ...state.files } };

  for (const [slug, meta] of Object.entries(remote)) {
    if (!hydrated.files[slug]) {
      hydrated.files[slug] = meta;
    }
  }

  return hydrated;
}

async function uploadDocument(post) {
  const body = `---\n${Object.entries(post.fields)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n")}\n---\n\n${post.content}`;
  const formData = new FormData();
  formData.append("name", `${post.slug}.md`);
  formData.append("data", new Blob([body], { type: "text/markdown" }), `${post.slug}.md`);
  formData.append("content_type", "text/markdown");
  formData.append("fields", JSON.stringify(post.fields));

  const res = await fetch(`https://management-api.x.ai/v1/collections/${COLLECTION_ID}/documents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${MGMT_KEY}` },
    body: formData,
  });

  if (!res.ok) throw new Error(`Upload failed for ${post.slug}: ${await res.text()}`);
  const data = await res.json();
  return data.file_id || data.document_id || data.id;
}

async function removeDocument(fileId) {
  const res = await fetch(
    `https://management-api.x.ai/v1/collections/${COLLECTION_ID}/documents/${fileId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${MGMT_KEY}` },
    }
  );
  if (!res.ok && res.status !== 404) {
    throw new Error(`Delete failed: ${await res.text()}`);
  }
}

async function main() {
  if (!MGMT_KEY || !COLLECTION_ID) {
    console.log("Skipping collection sync (XAI_MANAGEMENT_API_KEY / XAI_COLLECTION_ID not set)");
    return;
  }

  const posts = loadPosts();
  let state = await hydrateState(loadState());
  const newState = { files: {} };
  const currentSlugs = new Set(posts.map((p) => p.slug));

  for (const post of posts) {
    const prev = state.files[post.slug];
    if (prev?.hash === post.hash) {
      newState.files[post.slug] = { hash: post.hash, fileId: prev.fileId };
      continue;
    }
    if (prev?.fileId) await removeDocument(prev.fileId);
    const fileId = await uploadDocument(post);
    newState.files[post.slug] = { hash: post.hash, fileId };
    console.log(`Synced: ${post.slug}`);
  }

  for (const [slug, meta] of Object.entries(state.files)) {
    if (!currentSlugs.has(slug) && meta.fileId) {
      await removeDocument(meta.fileId);
      console.log(`Removed: ${slug}`);
    }
  }

  // Persist state for local dev; Vercel builds are ephemeral but remote hash in fields enables re-hydration.
  if (!process.env.VERCEL) {
    saveState(newState);
  }

  console.log(`Collection sync complete (${posts.length} posts)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
