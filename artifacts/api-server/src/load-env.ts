import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

function resolveScriptDir(): string | null {
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    return null;
  }
}

const candidates: string[] = [];

for (const base of [process.cwd(), resolveScriptDir()].filter(Boolean) as string[]) {
  candidates.push(path.resolve(base, ".env"));
  candidates.push(path.resolve(base, "..", ".env"));
  candidates.push(path.resolve(base, "..", "..", ".env"));
  candidates.push(path.resolve(base, "..", "..", "..", ".env"));
}

const seen = new Set<string>();
for (const envPath of candidates) {
  const normalized = path.normalize(envPath);
  if (seen.has(normalized)) continue;
  seen.add(normalized);
  if (existsSync(normalized)) {
    config({ path: normalized });
    break;
  }
}
