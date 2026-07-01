#!/usr/bin/env node
/** @deprecated build-search-index.ts 를 사용하세요 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
spawnSync("npx", ["tsx", path.join(__dirname, "build-search-index.ts")], {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});
