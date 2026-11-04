import type { APIRoute } from 'astro';
import { front, pages } from '../lib/content';

// The Note as it stands in the manual at the pin, frontmatter and marks included.
// /README.md sits beside /index.md because the manual's own links name it.
export function getStaticPaths() {
  return [
    ...pages.map((page) => ({ params: { slug: page.twin.slice(1, -3) }, props: { raw: page.raw } })),
    { params: { slug: 'README' }, props: { raw: front.raw } },
  ];
}

export const GET: APIRoute = ({ props }) =>
  new Response(props.raw as string, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
