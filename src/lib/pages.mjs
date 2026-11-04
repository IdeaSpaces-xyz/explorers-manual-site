// What is published. Nothing else in the manual reaches the site: the build
// copies exactly these files out of Git at the pin, and refuses a missing one.
//
//   path   the Note in the manual
//   group  where it sits in the site's lists
//   door   the front page shows it as a way in, in this order
//   nav    its label in the header
//   story  the page carries How it works' scroll story

export const FRONT = 'README.md';

export const PAGES = [
  { path: 'README.md', group: 'start' },

  { path: 'how-it-works.md', group: 'page', door: 1, nav: 'How it works', story: true },
  { path: 'integrations.md', group: 'page', door: 2, nav: 'Integrations' },
  { path: 'developers.md', group: 'developers', door: 3, nav: 'Developers' },

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

// Refused twice: here at build start, and again in the finished dist/.
export const NEVER_PUBLISHED = ['_agent', '.pi', '_threads', '_local'];

export function routeOf(path) {
  return path === FRONT ? '/' : `/${path.replace(/\.md$/, '')}`;
}

export function twinOf(path) {
  return path === FRONT ? '/index.md' : `/${path}`;
}

export function isNeverPublished(path) {
  return path.split('/').some((part) => NEVER_PUBLISHED.includes(part));
}
