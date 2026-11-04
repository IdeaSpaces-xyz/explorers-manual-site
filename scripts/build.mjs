// Builds the site from one pinned manual commit.
//
// The No Idea site refuses a dirty checkout. This one goes a step further and
// never reads the checkout at all: it takes each allow-listed Note out of Git
// at the pin, so an uncommitted edit or an unlisted file cannot reach the site,
// and work in progress in the manual does not stop a build.
//
//   npm run build                 the pin in manual.pin, the manual beside Home's code/
//   MANUAL_ROOT=/path npm run build
//   MANUAL_PIN=<sha> npm run build   try another commit; not a release
//   npm run dev                   the same source, Astro's dev server

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FRONT, PAGES, isNeverPublished } from '../src/lib/pages.mjs';

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fail = (message) => {
  console.error(`Refused: ${message}`);
  process.exit(1);
};

const root = resolve(process.env.MANUAL_ROOT ?? join(site, '../../knowledge/explorers-manual'));
if (!existsSync(root)) fail(`no manual checkout at ${root}; set MANUAL_ROOT`);
const git = (...args) =>
  execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const recorded = readFileSync(join(site, 'manual.pin'), 'utf8').trim();
const pin = (process.env.MANUAL_PIN ?? recorded).trim();
if (!/^[0-9a-f]{40}$/.test(pin)) fail(`the pin must be a full commit, got "${pin}"`);

try {
  git('cat-file', '-e', `${pin}^{commit}`);
} catch {
  fail(`${pin} is not a commit in ${root}`);
}
try {
  git('merge-base', '--is-ancestor', pin, 'main');
} catch {
  fail(`${pin} is not on the manual's main`);
}

if (!PAGES.some((page) => page.path === FRONT)) fail(`${FRONT} must be published`);
const source = join(site, '.source');
rmSync(source, { recursive: true, force: true });
for (const { path } of PAGES) {
  if (isNeverPublished(path)) fail(`${path} is in a folder that is never published`);
  let text;
  try {
    text = git('show', `${pin}:${path}`);
  } catch {
    fail(`allow-listed Note ${path} is not in the manual at ${pin}`);
  }
  mkdirSync(dirname(join(source, path)), { recursive: true });
  writeFileSync(join(source, path), text);
}

const env = {
  ...process.env,
  MANUAL_SOURCE: source,
  MANUAL_COMMIT: pin,
  ASTRO_TELEMETRY_DISABLED: '1',
};
const dev = process.argv.includes('--dev');
console.log(`Manual ${pin}, ${PAGES.length} Notes${pin === recorded ? '' : ' (MANUAL_PIN: not a release)'}`);
const astro = spawnSync('npm', ['exec', '--', 'astro', dev ? 'dev' : 'build'], {
  cwd: site,
  stdio: 'inherit',
  env,
});
if (astro.status !== 0) process.exit(astro.status ?? 1);
if (dev) process.exit(0);

const check = spawnSync('node', ['scripts/check-dist.mjs'], { cwd: site, stdio: 'inherit', env: { ...env, MANUAL_ROOT: root } });
process.exit(check.status ?? 1);
