import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function run(script) {
  const result = spawnSync("node", [path.join(__dirname, script)], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("→ Building BM25 search index...");
run("build-search-index.mjs");

console.log("→ Syncing xAI Collection (skipped if env not set)...");
run("sync-collections.mjs");

console.log("→ Vercel prebuild complete.");
