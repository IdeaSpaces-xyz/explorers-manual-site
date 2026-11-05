import type { APIRoute } from 'astro';
import { SITE, front, inFolder, opening, pages, updates, updatesRoute } from '../lib/content';
import { SECTIONS } from '../lib/pages.mjs';

// The Note as it stands in the manual at the pin, frontmatter and marks included.
// /README.md sits beside /index.md because the manual's own links name it. A post's
// twin is the post as it stands in the Thread, Map included.
export function getStaticPaths() {
  // The timeline's twin answers "what changed since this date?": a date on every line.
  const timeline = opening && {
    params: { slug: updatesRoute.slice(1) },
    props: {
      raw: [
        `# ${opening.name}`,
        '',
        `> ${opening.summary}`,
        '',
        `Newest first. Feed: ${SITE}/rss.xml`,
        '',
        ...updates.map((post) => `- ${post.date.toISOString().slice(0, 10)} [${post.name}](${SITE}${post.twin}): ${post.summary}`),
        '',
      ].join('\n'),
    },
  };
  return [
    ...pages.map((page) => ({ params: { slug: page.twin.slice(1, -3) }, props: { raw: page.raw } })),
    { params: { slug: 'README' }, props: { raw: front.raw } },
    ...updates.map((post) => ({ params: { slug: post.twin.slice(1, -3) }, props: { raw: post.raw } })),
    ...(timeline ? [timeline] : []),
    ...Object.entries(SECTIONS).map(([folder, label]) => ({
      params: { slug: folder },
      props: {
        raw: [`# ${label}`, '', ...inFolder(folder).map((page) => `- [${page.name}](${SITE}${page.twin}): ${page.summary}`), ''].join('\n'),
      },
    })),
  ];
}

export const GET: APIRoute = ({ props }) =>
  new Response(props.raw as string, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
