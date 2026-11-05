import type { APIRoute } from 'astro';
import matter from 'gray-matter';
import { COMMIT, SITE, detached, front, inGroup, opening, pages, updates, updatesRoute, type Page } from '../lib/content';
import { FOR_AGENTS } from '../lib/pages.mjs';
import { llmsFull } from '../lib/llms-full';

const agents = pages.find((page) => page.path === FOR_AGENTS)!;
const opener = detached(matter(agents.raw).content, agents.path);
const heading = /^# .+$/m.exec(opener)![0];
const kb = Math.round(Buffer.byteLength(llmsFull()) / 1024);
const entry = (page: Page) => `- [${page.name}](${SITE}${page.twin}): ${page.summary}`;
const section = (title: string, group: string) => {
  const pages = inGroup(group);
  return pages.length > 0 ? [`## ${title}`, '', ...pages.map(entry), ''] : [];
};

const timeline = opening
  ? [
      '## Updates',
      '',
      `What changed, newest first. Feed: ${SITE}/rss.xml. As Markdown: ${SITE}${updatesRoute}.md`,
      '',
      ...updates.map((post) => `- ${post.date.toISOString().slice(0, 10)} [${post.name}](${SITE}${post.twin}): ${post.summary}`),
      '',
    ]
  : [];

export const GET: APIRoute = () =>
  new Response(
    [
      heading,
      '',
      `> ${agents.summary}`,
      '',
      opener.replace(heading, '').trim(),
      '',
      `Every page here has a Markdown twin: add .md to its address. All of it in one file: ${SITE}/llms-full.txt (${kb} KB). Built from the manual at commit ${COMMIT}.`,
      '',
      '## Start here',
      '',
      entry(agents),
      entry(front),
      ...inGroup('page').map(entry),
      '',
      ...timeline,
      ...section('Guides', 'guides'),
      ...section('Explore', 'explore'),
      ...section('Reference', 'reference'),
      ...section('Developers', 'developers'),
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
