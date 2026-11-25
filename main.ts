// main.ts — hands Ember & Ladle in: copies game/ and screenshots/ to the output
// directory and writes /output/dossier.json with buildDossier.
// Node 22, standard library only. Run it as: MAKEFUN_OUTPUT_DIR=out node main.ts
// (outside the grader MAKEFUN_OUTPUT_DIR stands in for /output).

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(name: string): void {
  const src = join(repoRoot, name);
  const dst = join(outDir, name);
  if (!existsSync(src)) throw new Error(`main.ts: ${name}/ is missing from the repository`);
  cpSync(src, dst, { recursive: true });
}

function main(): void {
  // A fresh output directory every run, so two runs write the same bytes.
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  copyTree('game');
  copyTree('screenshots');
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  console.log(`wrote ${outDir}/dossier.json (${dossier.length} bytes)`);
}

main();
