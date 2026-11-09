// What is published. Nothing else in the manual reaches the site: the build
// copies exactly these files out of Git at the pin, and refuses a missing one.
//
//   path   the Note in the manual
//   group  where it sits in the site's lists
//   door   the front page shows it as a way in, in this order
//   nav    its label in the header
//   story  the page carries How it works' scroll story
//   landing  came from the landing: keeps its label-over-title sections

export const FRONT = 'README.md';

// The Note llms.txt opens with, word for word, so no copy lives in this repo.
export const FOR_AGENTS = 'for-agents.md';

export const PAGES = [
  { path: FOR_AGENTS, group: 'agents' },
  { path: 'README.md', group: 'start' },

  { path: 'why.md', group: 'page', door: 1, nav: 'Why' },
  { path: 'how-it-works.md', group: 'page', door: 2, nav: 'How it works', story: true, landing: true },
  { path: 'integrations.md', group: 'page', door: 3, nav: 'Integrations', landing: true },
  { path: 'developers.md', group: 'developers', door: 4, nav: 'Developers', landing: true },

  { path: 'guides/prepare-your-machine.md', group: 'guides' },
  { path: 'guides/open-this-manual-with-an-agent.md', group: 'guides' },
  { path: 'guides/check-for-updates.md', group: 'guides' },
  { path: 'guides/create-your-first-agent.md', group: 'guides' },
  { path: 'guides/explore-with-your-agent.md', group: 'guides' },
  { path: 'guides/reflect-on-your-work.md', group: 'guides' },
  { path: 'guides/talk-to-your-agent.md', group: 'guides' },

  { path: 'explore/why-work-locally.md', group: 'explore' },
  { path: 'explore/what-is-an-ideaspace.md', group: 'explore' },
  { path: 'explore/what-is-git.md', group: 'explore' },
  { path: 'explore/how-work-changes.md', group: 'explore' },
  { path: 'explore/notes.md', group: 'explore' },
  { path: 'explore/skills.md', group: 'explore' },
  { path: 'explore/knowledge-keeps-moving.md', group: 'explore' },
  { path: 'explore/how-sharing-works.md', group: 'explore' },

  { path: 'reference/language.md', group: 'reference' },
];

// Folders a reader can trim a URL back to: each lists its Notes.
export const SECTIONS = { guides: 'Guides', explore: 'Explore', reference: 'Reference' };

// The order of llms-full.txt, by group.
export const READING_ORDER = ['agents', 'start', 'page', 'guides', 'explore', 'reference', 'developers'];

// The one Thread that is public: its posts, read from Git at the pin. Only the
// files directly in this folder: its README and _agent/ stay closed, and so does
// every other Thread. If the pin has no such Thread, the site has no timeline.
export const UPDATES_THREAD = '_threads/updates';
export const UPDATES_ROUTE = '/updates';
export const MANUAL_ROOT_ID = 'n_ba793faed9389f32f7f59828';

// Refused twice: here at build start, and again in the finished dist/.
export const NEVER_PUBLISHED = ['_agent', '.pi', '_threads', '_local', '_drafts'];

// Sections that kept their words but changed their address when the landing's
// pages became Notes. An old link such as /integrations#claude must still land.
export const OLD_ANCHORS = {
  'integrations.md': { 'claude-code--cowork': ['claude'], watch: ['first-agent-video'] },
  'developers.md': { 'published-foundation': ['protocol'], 'the-compatibility-boundary': ['build'] },
};

export function routeOf(path) {
  return path === FRONT ? '/' : `/${path.replace(/\.md$/, '')}`;
}

export function twinOf(path) {
  return path === FRONT ? '/index.md' : `/${path}`;
}

export function isNeverPublished(path) {
  return path.split('/').some((part) => NEVER_PUBLISHED.includes(part));
}
