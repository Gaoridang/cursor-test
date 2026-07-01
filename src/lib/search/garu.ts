import type { Garu } from "garu-ko";

export type GaruAnalyzer = Garu;

let garuInstance: GaruAnalyzer | null = null;
let loadPromise: Promise<GaruAnalyzer> | null = null;

/** garu-ko WASM 인스턴스를 lazy load합니다 (브라우저·Node 공용). */
export async function getGaru(): Promise<GaruAnalyzer> {
  if (garuInstance?.isLoaded()) return garuInstance;

  if (!loadPromise) {
    loadPromise = (async () => {
      const { Garu } = await import("garu-ko");
      garuInstance = await Garu.load();
      return garuInstance;
    })();
  }

  return loadPromise;
}

export function isGaruLoaded(): boolean {
  return garuInstance?.isLoaded() ?? false;
}

export function getCachedGaru(): GaruAnalyzer | null {
  return garuInstance?.isLoaded() ? garuInstance : null;
}
