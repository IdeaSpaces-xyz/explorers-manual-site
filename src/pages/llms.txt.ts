import type { APIRoute } from 'astro';
import { COMMIT, front, inGroup, type Page } from '../lib/content';

const SITE = 'https://manual.ideaspaces.xyz';
const entry = (page: Page) => `- [${page.name}](${SITE}${page.twin}): ${page.summary}`;
const section = (title: string, group: string) => {
  const pages = inGroup(group);
  return pages.length > 0 ? [`## ${title}`, '', ...pages.map(entry), ''] : [];
};

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
      ...section('Guides', 'guides'),
      ...section('Explore', 'explore'),
      ...section('Reference', 'reference'),
      ...section('Developers', 'developers'),
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
