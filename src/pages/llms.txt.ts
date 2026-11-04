import type { APIRoute } from 'astro';
import { COMMIT, front, inGroup, opening, updates, updatesRoute, type Page } from '../lib/content';

const SITE = 'https://manual.ideaspaces.xyz';
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
      `# ${front.name}`,
      '',
      `> ${front.summary}`,
      '',
      `Every page here has a Markdown twin: add .md to its address. Built from the manual at commit ${COMMIT}.`,
      '',
      '## Start here',
      '',
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
