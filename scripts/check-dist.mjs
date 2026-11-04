// Reads the finished dist/ the way a visitor would, and refuses what should not
// be there: a missing page or twin, a Markdown file nobody listed, anything from
// a never-published folder, a twin that differs from the Note at the pin, an
// internal link or anchor that lands on nothing, or a page llms.txt forgets.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES, routeOf, twinOf, isNeverPublished } from '../src/lib/pages.mjs';

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(site, 'dist');
const root = resolve(process.env.MANUAL_ROOT ?? join(site, '../../knowledge/explorers-manual'));
const pin = (process.env.MANUAL_COMMIT ?? process.env.MANUAL_PIN ?? readFileSync(join(site, 'manual.pin'), 'utf8')).trim();

const problems = [];
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  );
const files = walk(dist).map((file) => `/${relative(dist, file)}`);
const fileSet = new Set(files);
const htmlOf = (route) => (route === '/' ? '/index.html' : `${route}.html`);

const twins = new Set(['/README.md']);
for (const { path } of PAGES) {
  const html = htmlOf(routeOf(path));
  const twin = twinOf(path);
  twins.add(twin);
  if (!fileSet.has(html)) problems.push(`no page for ${path}: ${html}`);
  if (!fileSet.has(twin)) {
    problems.push(`no twin for ${path}: ${twin}`);
    continue;
  }
  const note = execFileSync('git', ['-C', root, 'show', `${pin}:${path}`], { encoding: 'utf8' });
  if (readFileSync(join(dist, twin), 'utf8') !== note) problems.push(`twin differs from the Note: ${twin}`);
}

for (const file of files) {
  if (isNeverPublished(file)) problems.push(`never-published path in dist: ${file}`);
  if (file.endsWith('.md') && !twins.has(file)) problems.push(`unlisted Markdown in dist: ${file}`);
}

const pages = files.filter((file) => file.endsWith('.html'));
const ids = new Map();
const idsOf = (file) => {
  if (!ids.has(file)) {
    const html = readFileSync(join(dist, file), 'utf8');
    ids.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])));
  }
  return ids.get(file);
};

let links = 0;
for (const page of pages) {
  const html = readFileSync(join(dist, page), 'utf8');
  for (const [, raw] of html.matchAll(/<(?:a|link|script|img)\b[^>]*?\s(?:href|src)="([^"]+)"/g)) {
    const href = raw.replaceAll('&amp;', '&').replaceAll('&#38;', '&');
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) continue;
    links += 1;
    const [path, anchor] = href.split('#');
    const target = path === '' ? page : path === '/' ? '/index.html' : path;
    const file = fileSet.has(target) ? target : fileSet.has(`${target}.html`) ? `${target}.html` : null;
    if (!file) {
      problems.push(`${page} links to nothing: ${href}`);
      continue;
    }
    if (anchor && file.endsWith('.html') && !idsOf(file).has(decodeURIComponent(anchor))) {
      problems.push(`${page} links to a missing anchor: ${href}`);
    }
  }
}

if (!fileSet.has('/llms.txt')) problems.push('no llms.txt');
else {
  const llms = readFileSync(join(dist, 'llms.txt'), 'utf8');
  for (const { path } of PAGES) {
    if (!llms.includes(twinOf(path))) problems.push(`llms.txt does not list ${twinOf(path)}`);
  }
}
if (!fileSet.has('/404.html')) problems.push('no 404 page');

if (problems.length > 0) {
  console.error(`Refused: ${problems.length} problem(s) in dist/`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log(`dist/ holds: ${PAGES.length} pages, ${twins.size} Markdown files, ${links} internal links all landing, manual ${pin.slice(0, 7)}`);
