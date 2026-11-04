// The updates Thread as data. Used by the site and by scripts/check-dist.mjs, so
// both agree on which posts exist. Reads frontmatter, never file names.

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { MANUAL_ROOT_ID, UPDATES_ROUTE, UPDATES_THREAD } from './pages.mjs';

/**
 * @typedef {{ address: string, name: string, summary: string } | { position: string, summary: string }} MapMember
 * @typedef {{
 *   file: string, id: string, date: Date, name: string, summary: string, author: string | null,
 *   parents: string[], map: MapMember[], body: string, raw: string, slug: string, route: string, twin: string,
 * }} UpdatePost
 */

/** @param {string} text */
const slugOf = (text) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');

/**
 * A Map's members. A pinned page keeps its position; an outside link its address.
 * @param {string} file
 * @param {any} map
 * @returns {MapMember[]}
 */
function mapOf(file, map) {
  if (!map?.members) return [];
  return map.members.map((/** @type {any} */ member) => {
    if (member.address) return { address: member.address, name: member.name ?? member.address, summary: member.summary ?? '' };
    const root = map.roots?.[member.root];
    if (root?.root_node_id !== MANUAL_ROOT_ID) throw new Error(`${file}: a Map member is outside the manual: ${member.position}`);
    return { position: member.position, summary: member.summary ?? '' };
  });
}

/**
 * The posts readers see, oldest first, or null if the pin has no Thread.
 * `kind: post` only: marks and every other kind stay out. It is a tree: a post
 * names its parents, and the one with none is the opening.
 * @param {string} source
 * @returns {{ opening: UpdatePost, posts: UpdatePost[], byId: Map<string, UpdatePost> } | null}
 */
export function loadUpdates(source) {
  const folder = path.join(source, UPDATES_THREAD);
  if (!fs.existsSync(folder)) return null;

  const posts = fs
    .readdirSync(folder)
    .map((name) => {
      const raw = fs.readFileSync(path.join(folder, name), 'utf8');
      const { data, content } = matter(raw);
      return { file: `${UPDATES_THREAD}/${name}`, raw, data, content };
    })
    .filter((post) => post.data.kind === 'post')
    .map(({ file, raw, data, content }) => {
      for (const field of ['id', 'date', 'name', 'summary']) {
        if (!data[field]) throw new Error(`${file}: a published post needs ${field}`);
      }
      const date = new Date(data.date);
      if (Number.isNaN(date.getTime())) throw new Error(`${file}: date is not a date: ${data.date}`);
      const slug = `${date.toISOString().slice(0, 10)}-${slugOf(String(data.name))}`;
      return {
        file,
        id: String(data.id),
        date,
        name: String(data.name),
        summary: String(data.summary),
        author: data.author ? String(data.author) : null,
        parents: [data.in_reply_to ?? []].flat().map(String),
        map: mapOf(file, data.map),
        body: content.trim(),
        raw,
        slug,
        route: `${UPDATES_ROUTE}/${slug}`,
        twin: `${UPDATES_ROUTE}/${slug}.md`,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (posts.length === 0) throw new Error(`${UPDATES_THREAD}: the Thread has no posts`);
  const openings = posts.filter((post) => post.parents.length === 0);
  if (openings.length !== 1) throw new Error(`${UPDATES_THREAD}: needs one opening post, found ${openings.length}`);
  const byId = new Map(posts.map((post) => [post.id, post]));
  for (const post of posts) {
    for (const parent of post.parents) {
      if (!byId.has(parent)) throw new Error(`${post.file}: replies to ${parent}, which is not a published post`);
    }
  }
  const slugs = new Set(posts.map((post) => post.slug));
  if (slugs.size !== posts.length) throw new Error(`${UPDATES_THREAD}: two posts share a date and a name`);
  return { opening: openings[0], posts, byId };
}
