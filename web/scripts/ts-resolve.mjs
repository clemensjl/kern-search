// Aufloeser fuer den eingebauten Node-Testrunner.
//
// Node strippt TypeScript-Typen seit 22.18 selbst, verlangt in ESM aber
// vollstaendige Dateiendungen. Der Anwendungscode importiert wie in Next
// ueblich ohne Endung ("./weights") und mit dem Alias "@/". Dieser Hook
// ergaenzt beides, damit ohne zusaetzliche Abhaengigkeit getestet werden kann.
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");
const EXTS = [".ts", ".tsx", ".mts", ".js", "/index.ts", "/index.tsx"];

function firstExisting(base) {
  for (const e of EXTS) {
    const p = base + e;
    if (existsSync(p)) return pathToFileURL(p).href;
  }
  return null;
}

registerHooks({
  resolve(spec, ctx, next) {
    if (spec.startsWith("@/")) {
      const hit = firstExisting(resolvePath(ROOT, spec.slice(2)));
      if (hit) return { url: hit, shortCircuit: true };
    }
    if (spec.startsWith(".") && ctx.parentURL?.startsWith("file:")) {
      const base = resolvePath(dirname(fileURLToPath(ctx.parentURL)), spec);
      if (!existsSync(base)) {
        const hit = firstExisting(base);
        if (hit) return { url: hit, shortCircuit: true };
      }
    }
    return next(spec, ctx);
  },
});
