// Lantern Rock — the hand-in program (Node 22, standard library only).
//
// The game itself is plain static files under game/ (game/index.html plus its ES
// modules; no build step, no library, no network request at run time) and the
// screenshots under screenshots/ are real renders of that code. This program
// copies both trees into the output directory and writes dossier.json there
// with the vendored make.fun library, which is what the judge reads.
//
// Run it from this directory:
//   MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader the output directory is /output.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(name: string) {
  const source = join(repoRoot, name);
  if (!existsSync(source)) return;
  const target = join(outputDir, name);
  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });

// Validate the inputs before building the dossier: copyTree silently skips
// a missing tree, so without this a missing screenshots/ directory would
// produce a dossier with zero images and no error.
if (!existsSync(join(repoRoot, 'game', 'index.html'))) {
  throw new Error('Lantern Rock: game/index.html is missing — cannot build the dossier.');
}
if (!existsSync(join(repoRoot, 'screenshots'))) {
  throw new Error('Lantern Rock: screenshots/ directory is missing — cannot build the dossier.');
}
const screenshotCount = readdirSync(join(repoRoot, 'screenshots')).length;
if (screenshotCount === 0 || screenshotCount > 4) {
  throw new Error(`Lantern Rock: screenshots/ must hold 1-4 files, found ${screenshotCount}.`);
}
copyTree('game');
copyTree('screenshots');

// The scorer's caps for this competition: at most 4 screenshots of 256 KiB,
// at most 993 files and 48 MiB under game/, paths under 1,000 bytes, and the
// dossier's source text capped at 160 KiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
