import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { opening, updates, type Update } from '../lib/content';

// /rss.xml, only when the pin has the updates Thread.
export function getStaticPaths() {
  return opening ? [{ params: { feed: 'rss' } }] : [];
}

const SITE = 'https://manual.ideaspaces.xyz';
const escapeHtml = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function content(post: Update) {
  if (post.map.length === 0) return post.html;
  const links = post.map
    .map((link) => `<li><a href="${escapeHtml(link.href.startsWith('/') ? SITE + link.href : link.href)}">${escapeHtml(link.name)}</a>${link.summary ? `: ${escapeHtml(link.summary)}` : ''}</li>`)
    .join('');
  return `${post.html}<h2>What changed, read more here</h2><ul>${links}</ul>`;
}

export function GET(context: APIContext) {
  return rss({
    title: opening!.name,
    description: opening!.summary,
    site: context.site!,
    trailingSlash: false,
    customData: '<language>en</language>',
    items: updates.map((post) => ({
      title: post.name,
      description: post.summary,
      pubDate: post.date,
      link: post.route,
      customData: `<guid isPermaLink="false">${post.id}</guid>`,
      content: content(post),
    })),
  });
}
