import { readFileSync, writeFileSync, mkdirSync, statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { searchBM25 } from "../src/lib/search/bm25";
import type { InvertedIndex } from "../src/lib/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const indexPath = path.join(root, "public", "search", "index.json");
const goldenPath = path.join(root, "benchmarks", "search-golden-set.json");
const reportsDir = path.join(root, "benchmarks", "reports");

interface GoldenCase {
  id: string;
  query: string;
  relevant: string[];
  category: string;
  notes?: string;
}

interface GoldenSet {
  version: number;
  description: string;
  cases: GoldenCase[];
}

interface CaseResult {
  id: string;
  query: string;
  category: string;
  relevant: string[];
  ranked: string[];
  ndcg5: number;
  mrr: number;
  recall5: number;
  hit: boolean;
  latencyMs: number;
  notes?: string;
}

function dcgAtK(relevances: number[], k: number): number {
  return relevances.slice(0, k).reduce((sum, rel, i) => sum + rel / Math.log2(i + 2), 0);
}

function ndcgAtK(rankedSlugs: string[], relevant: Set<string>, k: number): number {
  const relevances = rankedSlugs.slice(0, k).map((slug) => (relevant.has(slug) ? 1 : 0));
  const dcg = dcgAtK(relevances, k);
  const idealCount = Math.min(relevant.size, k);
  const idcg = dcgAtK(Array(idealCount).fill(1), k);
  if (idcg === 0) return rankedSlugs.length === 0 ? 1 : 0;
  return dcg / idcg;
}

function mrr(rankedSlugs: string[], relevant: Set<string>): number {
  const idx = rankedSlugs.findIndex((slug) => relevant.has(slug));
  return idx === -1 ? 0 : 1 / (idx + 1);
}

function recallAtK(rankedSlugs: string[], relevant: Set<string>, k: number): number {
  if (relevant.size === 0) return rankedSlugs.length === 0 ? 1 : 0;
  const found = rankedSlugs.slice(0, k).filter((slug) => relevant.has(slug));
  return new Set(found).size / relevant.size;
}

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function measureIndexMetrics(index: InvertedIndex) {
  const stats = statSync(indexPath);
  const vocabulary = Object.keys(index.postings);

  return {
    totalDocs: index.totalDocs,
    vocabularySize: vocabulary.length,
    avgDocLength: Math.round(index.avgDocLength * 10) / 10,
    indexFileSizeKB: Math.round(stats.size / 1024),
    indexFileSizeBytes: stats.size,
  };
}

function runBenchmark(index: InvertedIndex, golden: GoldenSet) {
  const caseResults: CaseResult[] = [];
  const latencies: number[] = [];

  for (const testCase of golden.cases) {
    const relevant = new Set(testCase.relevant);

    const start = performance.now();
    const results = searchBM25(testCase.query, index, 10);
    const latencyMs = performance.now() - start;
    latencies.push(latencyMs);

    const ranked = results.map((r) => r.slug);
    const hit =
      relevant.size === 0
        ? ranked.length === 0
        : ranked.slice(0, 5).some((slug) => relevant.has(slug));

    caseResults.push({
      id: testCase.id,
      query: testCase.query,
      category: testCase.category,
      relevant: testCase.relevant,
      ranked: ranked.slice(0, 5),
      ndcg5: ndcgAtK(ranked, relevant, 5),
      mrr: mrr(ranked, relevant),
      recall5: recallAtK(ranked, relevant, 5),
      hit,
      latencyMs: Math.round(latencyMs * 100) / 100,
      notes: testCase.notes,
    });
  }

  const macro = {
    ndcg5: caseResults.reduce((s, r) => s + r.ndcg5, 0) / caseResults.length,
    mrr: caseResults.reduce((s, r) => s + r.mrr, 0) / caseResults.length,
    recall5: caseResults.reduce((s, r) => s + r.recall5, 0) / caseResults.length,
    hitRate: caseResults.filter((r) => r.hit).length / caseResults.length,
  };

  const latency = {
    meanMs: Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 100) / 100,
    p50Ms: Math.round(percentile(latencies, 50) * 100) / 100,
    p95Ms: Math.round(percentile(latencies, 95) * 100) / 100,
  };

  return { caseResults, macro, latency };
}

function printReport(
  indexMetrics: ReturnType<typeof measureIndexMetrics>,
  macro: ReturnType<typeof runBenchmark>["macro"],
  latency: ReturnType<typeof runBenchmark>["latency"],
  caseResults: CaseResult[]
) {
  console.log("\n=== 검색 벤치마크 ===\n");

  console.log("[인덱스 메트릭]");
  console.log(`  문서 수:        ${indexMetrics.totalDocs}`);
  console.log(`  어휘 수:        ${indexMetrics.vocabularySize}`);
  console.log(`  평균 문서 길이: ${indexMetrics.avgDocLength} 토큰`);
  console.log(`  인덱스 크기:    ${indexMetrics.indexFileSizeKB} KB`);

  console.log("\n[집계 메트릭] (Golden Set 25건)");
  console.log(`  NDCG@5:   ${(macro.ndcg5 * 100).toFixed(1)}%`);
  console.log(`  MRR:      ${(macro.mrr * 100).toFixed(1)}%`);
  console.log(`  Recall@5: ${(macro.recall5 * 100).toFixed(1)}%`);
  console.log(`  Hit Rate: ${(macro.hitRate * 100).toFixed(1)}%`);

  console.log("\n[검색 지연]");
  console.log(`  평균: ${latency.meanMs}ms  p50: ${latency.p50Ms}ms  p95: ${latency.p95Ms}ms`);

  const failures = caseResults.filter((r) => !r.hit);
  if (failures.length) {
    console.log(`\n[실패 케이스] ${failures.length}건`);
    for (const f of failures) {
      console.log(`  ✗ ${f.id}: "${f.query}" → [${f.ranked.join(", ") || "없음"}] (기대: ${f.relevant.join(", ") || "없음"})`);
    }
  } else {
    console.log("\n[실패 케이스] 없음");
  }

  const byCategory = new Map<string, CaseResult[]>();
  for (const r of caseResults) {
    if (!byCategory.has(r.category)) byCategory.set(r.category, []);
    byCategory.get(r.category)!.push(r);
  }

  console.log("\n[카테고리별 Hit Rate]");
  for (const [category, results] of [...byCategory.entries()].sort()) {
    const rate = results.filter((r) => r.hit).length / results.length;
    console.log(`  ${category.padEnd(16)} ${(rate * 100).toFixed(0)}% (${results.filter((r) => r.hit).length}/${results.length})`);
  }

  console.log("");
}

function main() {
  const index = JSON.parse(readFileSync(indexPath, "utf8")) as InvertedIndex;
  const golden = JSON.parse(readFileSync(goldenPath, "utf8")) as GoldenSet;

  const indexMetrics = measureIndexMetrics(index);
  const { caseResults, macro, latency } = runBenchmark(index, golden);

  const timestamp = new Date().toISOString();
  const phase = process.env.BENCHMARK_PHASE ?? "latest";
  const report = {
    generatedAt: timestamp,
    phase,
    indexMetrics,
    macro,
    latency,
    cases: caseResults,
  };

  mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, phase === "latest" ? "latest.json" : `${phase}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  printReport(indexMetrics, macro, latency, caseResults);
  console.log(`리포트 저장: ${reportPath}\n`);
}

main();
