import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function run(script) {
  const tsScripts = ["build-search-index.ts"];
  const isTs = tsScripts.includes(script);
  const result = spawnSync(isTs ? "npx" : "node", isTs ? ["tsx", path.join(__dirname, script)] : [path.join(__dirname, script)], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("→ Building BM25 search index (garu-ko morph + ngram)...");
run("build-search-index.ts");

console.log("→ Syncing xAI Collection (skipped if env not set)...");
run("sync-collections.mjs");

console.log("→ Vercel prebuild complete.");
