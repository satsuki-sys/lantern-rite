// Lantern Rite — the hand-in program for make.fun's best-card-game bounty.
// Node 22, standard library only. The game itself is plain static files
// under game/ (index.html and its ES modules, no library, no network
// request), and the screenshots are real renders of it under screenshots/.
// This program copies both into the output directory and writes
// dossier.json there with the vendored make.fun library, so the sealed
// scorer can check the entry and the judge can read it.
//
// Run it outside the grader's container with MAKEFUN_OUTPUT_DIR standing
// in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

/** The directory this file lives in: the repository root. */
function repoRoot() {
  return fileURLToPath(new URL('.', import.meta.url));
}

/** Where the hand-in goes: /output in the grader, MAKEFUN_OUTPUT_DIR elsewhere. */
function outputDir() {
  return process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
}

/** Copy one top-level entry of the repository into the output directory. */
function copyEntry(root, out, name) {
  const source = join(root, name);
  if (!existsSync(source)) return;
  cpSync(source, join(out, name), { recursive: true });
}

/**
 * The caps the scorer enforces (reference/gate.json): the dossier text is
 * capped at 160 KiB, at most 4 screenshots of 256 KiB each, and game/ holds
 * at most 993 files and directories and 48 MiB in all, with no path over
 * 1000 bytes. game/ shares /output's own 1000-entry cap with screenshots/
 * and dossier.json, so the game is kept well inside those limits.
 */
function dossierCaps() {
  return {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  };
}

const root = repoRoot();
const out = outputDir();

mkdirSync(out, { recursive: true });
copyEntry(root, out, 'game');
mkdirSync(join(out, 'screenshots'), { recursive: true });
copyEntry(root, out, 'screenshots');

writeFileSync(join(out, 'dossier.json'), buildDossier(out, dossierCaps()));
