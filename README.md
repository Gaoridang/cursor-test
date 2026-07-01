# essos Blog

A personal blog with essos-inspired design, client-side BM25 keyword search, and Grok Collections semantic search.

## Stack

- **Next.js 15** + TypeScript + CSS Modules
- **Content:** Markdown in `content/posts/`
- **Keyword search:** Self-hosted BM25 inverted index (build-time)
- **Semantic search:** [xAI Collections API](https://docs.x.ai/developers/files/collections) (hybrid)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Search

### Keyword (works offline)

Build the index:

```bash
node scripts/build-search-index.mjs
```

Index is written to `public/search/index.json` and loaded client-side.

### Semantic (Grok Collections)

1. Copy `.env.example` to `.env.local`
2. Create a Collection in the [xAI Console](https://console.x.ai)
3. Set `XAI_API_KEY`, `XAI_MANAGEMENT_API_KEY`, `XAI_COLLECTION_ID`
4. Sync posts:

```bash
npm run sync:collections
```

Search modal tabs:

- **Keyword** — instant BM25
- **Semantic** — Grok Collections `semantic` mode
- **All** — BM25 + Grok `hybrid` merged

Press `Cmd+K` (or `Ctrl+K`) to open search.

## Deploy to Vercel

**Works without env vars** — Keyword search only until you add xAI keys.

1. Connect this repo on [vercel.com](https://vercel.com)
2. Deploy ( `vercel.json` configures the build )
3. Later: add `XAI_API_KEY`, `XAI_MANAGEMENT_API_KEY`, `XAI_COLLECTION_ID`, `NEXT_PUBLIC_SITE_URL` in Vercel → Settings → Environment Variables → Redeploy

See [docs/VERCEL.md](docs/VERCEL.md) for the full checklist (Korean).

## Adding Posts

Create a file in `content/posts/`:

```markdown
---
title: "My Post"
slug: my-post
date: 2024-08-10
category: General
image: /images/placeholder.svg
excerpt: "Short description"
---

Your content here...
```

Then rebuild the index and sync collections.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build index + production build |
| `npm run sync:collections` | Upload posts to xAI Collection |
