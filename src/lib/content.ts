import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { Marked, type Tokens } from 'marked';
import { FRONT, OLD_ANCHORS, PAGES, UPDATES_ROUTE, routeOf, twinOf } from './pages.mjs';
import { BEATS } from './story.mjs';
import { loadUpdates } from './updates.mjs';
import type { UpdatePost } from './updates.mjs';

const SOURCE = process.env.MANUAL_SOURCE;
export const COMMIT = process.env.MANUAL_COMMIT ?? '';
if (!SOURCE || !COMMIT) throw new Error('Build through scripts/build.mjs: it reads the manual at the pin');

export interface Act {
  number: string;
  name: string;
}

export interface Beat {
  id: string;
  act: Act;
  title: string;
  anchor: string;
  html: string;
}

export interface Story {
  hero: string;
  beats: Beat[];
  rest: string;
}

export interface Section {
  title: string;
  anchor: string;
  /** The number of a step on the path, when the heading has one. */
  step: string | null;
  html: string;
}

export interface Page {
  path: string;
  route: string;
  twin: string;
  group: string;
  door?: number;
  nav?: string;
  /** Came from the landing: keeps its label-over-title sections. */
  landing: boolean;
  name: string;
  summary: string;
  heading: string;
  raw: string;
  html: string;
  story: Story | null;
}

const BY_PATH = new Map<string, (typeof PAGES)[number]>(PAGES.map((page) => [page.path, page]));
const escapeHtml = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

/** GitHub's heading slug, so an anchor that works in the repo works here. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/\s/g, '-');
}

function makeSlugger() {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base = slugify(text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}

/** A link in a Note, as the site serves it. Refuses one that lands on nothing published. */
function resolveHref(href: string, from: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('#')) return href;
  const [target, anchor] = href.split('#');
  if (target.startsWith('/')) {
    throw new Error(`${from}: "${href}" is a site path. Link to the Note, relative, so it holds in the repo too`);
  }
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(from), target));
  if (!BY_PATH.has(resolved)) throw new Error(`${from}: "${href}" links to ${resolved}, which is not published`);
  return `${routeOf(resolved)}${anchor ? `#${anchor}` : ''}`;
}

function plainText(tokens: Tokens.Generic[] = []): string {
  return tokens
    .map((token) => (token.tokens ? plainText(token.tokens as Tokens.Generic[]) : (token.text ?? token.raw ?? '')))
    .join('');
}

function renderer(from: string, slug: (text: string) => string) {
  const marked = new Marked({ gfm: true, breaks: false });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = plainText(tokens as Tokens.Generic[]);
        const id = slug(text);
        const old = (OLD_ANCHORS as Record<string, Record<string, string[]>>)[from]?.[id] ?? [];
        const aliases = old.map((alias) => `<span id="${alias}"></span>`).join('');
        return `${aliases}<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
      // Comments carry marks for the build. Nothing else in a Note is raw HTML today.
      html({ text }) {
        return text.trimStart().startsWith('<!--') ? '' : text;
      },
      link({ href, title, tokens }) {
        const target = resolveHref(href, from);
        const external = /^https?:/i.test(target);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        const rel = external ? ' rel="noopener noreferrer"' : '';
        return `<a href="${escapeHtml(target)}"${titleAttr}${rel}>${this.parser.parseInline(tokens)}</a>`;
      },
      image({ href, title, text }) {
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${titleAttr} loading="lazy" decoding="async" />`;
      },
      paragraph({ tokens, text }) {
        const body = this.parser.parseInline(tokens);
        const links = tokens.filter((token) => token.type === 'link') as Tokens.Link[];
        const onlyLinks = links.length > 0 && tokens.every((token) => token.type === 'link' || !token.raw.trim());
        if (onlyLinks && links.some((link) => /[→↗]\s*$/.test(link.text))) return `<p class="actions">${body}</p>\n`;
        if (/^Scroll ↓/.test(text)) return `<p class="cue">${body}</p>\n`;
        const first = tokens[0];
        if (first?.type === 'strong' && /:$/.test(plainText((first as Tokens.Strong).tokens as Tokens.Generic[]))) {
          return `<p class="checkpoint">${body}</p>\n`;
        }
        return `<p>${body}</p>\n`;
      },
      code({ text, lang }) {
        const title = /title="([^"]*)"/.exec(lang ?? '')?.[1];
        const caption = title ? `<figcaption>${escapeHtml(title)}</figcaption>` : '';
        const label = title ? ` aria-label="${escapeHtml(title)}"` : ' aria-label="Code"';
        return `<figure class="code">${caption}<pre tabindex="0" role="region"${label}><code>${escapeHtml(text)}</code></pre></figure>\n`;
      },
      table(token) {
        const head = token.header
          .map((cell) => `<th scope="col">${this.parser.parseInline(cell.tokens)}</th>`)
          .join('');
        const rows = token.rows
          .map((row) => `<tr>${row.map((cell) => `<td>${this.parser.parseInline(cell.tokens)}</td>`).join('')}</tr>`)
          .join('\n');
        return `<div class="table" tabindex="0" role="region" aria-label="Table"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>\n`;
      },
    },
  });
  return (markdown: string) => marked.parse(markdown, { async: false }) as string;
}

function parseStory(file: string, body: string, render: (markdown: string) => string, slug: (text: string) => string): Story {
  const parts = body.split(/^<!-- story: (?:start|end) -->\s*$/m);
  if (parts.length !== 3) throw new Error(`${file}: needs one <!-- story: start --> and one <!-- story: end -->`);
  const [before, storyText, after] = parts;

  const beats: Beat[] = [];
  let act: Act | null = null;
  // Each chunk starts at an act heading or a beat mark.
  for (const chunk of storyText.split(/^(?=## |<!-- beat: )/m)) {
    const actMatch = /^## ([IVX]+)\.\s+(.+)$/m.exec(chunk);
    if (chunk.startsWith('## ')) {
      if (!actMatch) throw new Error(`${file}: act heading must read "## I. Name": ${chunk.split('\n')[0]}`);
      act = { number: actMatch[1], name: actMatch[2].trim() };
      continue;
    }
    const mark = /^<!-- beat: ([a-z-]+) -->\s*\n### (.+)\n([\s\S]*)$/.exec(chunk);
    if (!mark) {
      if (chunk.trim()) throw new Error(`${file}: text in the story outside a beat: ${chunk.trim().slice(0, 60)}`);
      continue;
    }
    if (!act) throw new Error(`${file}: beat ${mark[1]} comes before any act`);
    beats.push({ id: mark[1], act, title: mark[2].trim(), anchor: slug(mark[2]), html: render(mark[3]) });
  }

  const found = beats.map((beat) => beat.id).join(', ');
  const expected = BEATS.map((beat) => beat.id).join(', ');
  if (found !== expected) throw new Error(`${file}: story beats differ from the scene.\n  Note:  ${found}\n  Scene: ${expected}`);
  return { hero: render(before), beats, rest: render(after) };
}

function load(entry: (typeof PAGES)[number]): Page {
  const raw = fs.readFileSync(path.join(SOURCE!, entry.path), 'utf8');
  const { data, content } = matter(raw);
  if (!data.name || !data.summary) throw new Error(`${entry.path}: needs name and summary`);
  const heading = /^# (.+)$/m.exec(content)?.[1].trim();
  if (!heading) throw new Error(`${entry.path}: needs a # heading`);

  const slug = makeSlugger();
  const render = renderer(entry.path, slug);
  const story = entry.story ? parseStory(entry.path, content, render, slug) : null;
  return {
    path: entry.path,
    route: routeOf(entry.path),
    twin: twinOf(entry.path),
    group: entry.group,
    door: entry.door,
    nav: entry.nav,
    landing: Boolean(entry.landing),
    name: String(data.name),
    summary: String(data.summary),
    heading: heading.replace(/[*_`]/g, '').replace(/[.]$/, ''),
    raw,
    html: story ? '' : render(content),
    story,
  };
}

export const pages: Page[] = PAGES.map(load);
export const front = pages.find((page) => page.path === FRONT)!;
export const doors = pages.filter((page) => page.door !== undefined).sort((a, b) => a.door! - b.door!);
export const nav = pages.filter((page) => page.nav);
export const inGroup = (group: string) => pages.filter((page) => page.group === group);

/** The front page: the README cut at its ## headings, with the numbered ones as the path. */
export function frontSections(): { intro: string; sections: Section[] } {
  const body = matter(front.raw).content;
  const [intro, ...chunks] = body.split(/^(?=## )/m);
  const slug = makeSlugger();
  const render = renderer(front.path, slug);
  return {
    intro: render(intro),
    sections: chunks.map((chunk) => {
      const title = /^## (.+)$/m.exec(chunk)![1].trim();
      const rest = chunk.slice(chunk.indexOf('\n') + 1);
      return { title, anchor: slug(title), step: /^(\d+)\.\s/.exec(title)?.[1] ?? null, html: render(rest) };
    }),
  };
}

/** The guides in the order the README's numbered steps reach them. */
function pathOrder(): string[] {
  const body = matter(front.raw).content;
  const order: string[] = [];
  for (const chunk of body.split(/^(?=## )/m)) {
    if (!/^## (\d+\.|Whenever you return)/.test(chunk)) continue;
    for (const [, href] of chunk.matchAll(/\]\((guides\/[^)#]+\.md)/g)) {
      if (BY_PATH.has(href) && !order.includes(href)) order.push(href);
    }
  }
  return order;
}

const order = pathOrder();
/** Where a person goes after this page on the path, if it is on the path. */
export function nextOnPath(page: Page): Page | null {
  const index = order.indexOf(page.path);
  if (index < 0 || index === order.length - 1) return null;
  return pages.find((candidate) => candidate.path === order[index + 1]) ?? null;
}

export interface MapLink {
  href: string;
  name: string;
  summary: string;
  /** Leaves the manual, or is a file rather than a page. */
  external: boolean;
}

export interface Update extends Omit<UpdatePost, 'map' | 'parents'> {
  html: string;
  map: MapLink[];
  parents: UpdatePost[];
  replies: UpdatePost[];
}

const SITE = 'https://manual.ideaspaces.xyz';

/** A post's Map, as links: a manual page by its route, anything else by its address. */
function mapLinks(post: UpdatePost): MapLink[] {
  return post.map.map((member) => {
    if ('address' in member) return { href: member.address, name: member.name, summary: member.summary, external: true };
    const page = pages.find((candidate) => candidate.path === member.position);
    if (!page) throw new Error(`${post.file}: its Map names ${member.position}, which is not published`);
    return { href: page.route, name: page.name, summary: member.summary, external: false };
  });
}

const thread = loadUpdates(SOURCE);
export const updatesRoute = UPDATES_ROUTE;
export const hasUpdates = thread !== null;

function toUpdate(post: UpdatePost): Update {
  const render = renderer(post.file, makeSlugger());
  return {
    ...post,
    html: render(post.body),
    map: mapLinks(post),
    parents: post.parents.map((id) => thread!.byId.get(id)!),
    replies: thread!.posts.filter((candidate) => candidate.parents.includes(post.id)),
  };
}

export const opening = thread ? toUpdate(thread.opening) : null;
/** Newest first, the opening kept apart: it says what the Thread is, not what changed. */
export const updates: Update[] = thread
  ? thread.posts.filter((post) => post !== thread.opening).map(toUpdate).reverse()
  : [];

export interface LineStory {
  post: Update;
  /** Every later post that follows from this one, oldest first. */
  followUps: Update[];
}

/** The post a story hangs from: walk up the tree until the next parent is the opening. */
function storyRoot(post: Update): Update {
  let current = post;
  for (;;) {
    const parent = current.parents.find((candidate) => candidate.id !== opening!.id);
    const next = parent && updates.find((candidate) => candidate.id === parent.id);
    if (!next) return current;
    current = next;
  }
}

/** The line: one entry per story, newest activity first, each follow-up kept with its story. */
export const stories: LineStory[] = updates
  .filter((post) => storyRoot(post) === post)
  .map((post) => ({
    post,
    followUps: updates.filter((candidate) => candidate !== post && storyRoot(candidate) === post).reverse(),
  }))
  .sort((a, b) => {
    const latest = (story: LineStory) => Math.max(story.post.date.getTime(), ...story.followUps.map((post) => post.date.getTime()));
    return latest(b) - latest(a);
  });
