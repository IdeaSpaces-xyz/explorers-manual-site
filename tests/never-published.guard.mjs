// Run with `npm run test:guard`. Proves a never-published folder, `_drafts/`
// included, is refused twice: at build start and in the finished dist/.
// Not a Playwright spec: it works on a scratch copy of the scripts and never
// touches the real dist/ or the real allow-list.

import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { NEVER_PUBLISHED, isNeverPublished } from '../src/lib/pages.mjs';

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Same lookup as the build: MANUAL_ROOT, else the manual beside Home's code/.
const manual = resolve(process.env.MANUAL_ROOT ?? join(site, '../../knowledge/explorers-manual'));
const FOLDERS = ['_agent', '.pi', '_threads', '_local', '_drafts'];

test('every never-published folder is on the list, _drafts included', () => {
  for (const folder of FOLDERS) assert.ok(NEVER_PUBLISHED.includes(folder), `${folder} is missing`);
});

test('a path under a never-published folder is refused, at any depth', () => {
  for (const folder of FOLDERS) {
    assert.ok(isNeverPublished(`${folder}/note.md`), `${folder}/note.md`);
    assert.ok(isNeverPublished(`guides/${folder}/note.md`), `guides/${folder}/note.md`);
  }
  assert.ok(!isNeverPublished('guides/prepare-your-machine.md'));
  assert.ok(!isNeverPublished('drafts.md'), 'a name that merely resembles the folder is not refused');
});

describe('on a scratch copy of the site', () => {
  let scratch;
  const run = (script, env = {}) =>
    spawnSync(process.execPath, [join(scratch, 'scripts', script)], { encoding: 'utf8', env: { ...process.env, MANUAL_ROOT: manual, ...env } });

  before(() => {
    scratch = mkdtempSync(join(tmpdir(), 'manual-guard-'));
    cpSync(join(site, 'scripts'), join(scratch, 'scripts'), { recursive: true });
    cpSync(join(site, 'src', 'lib'), join(scratch, 'src', 'lib'), { recursive: true });
    for (const file of ['manual.pin', 'package.json']) cpSync(join(site, file), join(scratch, file));
    symlinkSync(join(site, 'node_modules'), join(scratch, 'node_modules'));
  });
  after(() => rmSync(scratch, { recursive: true, force: true }));

  test('the build refuses an allow-listed Note under _drafts/ before it builds anything', { skip: !existsSync(manual) && 'no manual checkout: set MANUAL_ROOT' }, () => {
    appendFileSync(join(scratch, 'src', 'lib', 'pages.mjs'), "\nPAGES.push({ path: '_drafts/secret.md', group: 'page' });\n");
    const result = run('build.mjs');
    assert.notEqual(result.status, 0, 'the build must fail');
    assert.match(result.stderr, /_drafts\/secret\.md is in a folder that is never published/);
    assert.ok(!existsSync(join(scratch, 'dist')), 'nothing was built');
  });

  test('check-dist refuses a file under _drafts/ in the finished dist/', { skip: !existsSync(join(site, 'dist')) && 'run npm run build first' }, () => {
    cpSync(join(site, 'dist'), join(scratch, 'dist'), { recursive: true });
    cpSync(join(site, 'src', 'lib', 'pages.mjs'), join(scratch, 'src', 'lib', 'pages.mjs'));
    cpSync(join(site, '.source'), join(scratch, '.source'), { recursive: true });
    const clean = run('check-dist.mjs');
    assert.equal(clean.status, 0, `a clean dist/ must pass first: ${clean.stderr}`);

    mkdirSync(join(scratch, 'dist', '_drafts'), { recursive: true });
    writeFileSync(join(scratch, 'dist', '_drafts', 'secret.html'), '<p>draft</p>');
    const result = run('check-dist.mjs');
    assert.notEqual(result.status, 0, 'check-dist must fail');
    assert.match(result.stderr, /never-published path in dist: \/_drafts\/secret\.html/);
  });
});
