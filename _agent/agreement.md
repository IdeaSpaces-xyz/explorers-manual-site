---
name: Agreement — Explorers Manual site
summary: >
  The Astro site that presents the Explorers' Manual at manual.ideaspaces.xyz. A code ideaspace: it
  owns how the manual looks and how it is built, never what the manual says. It publishes only an
  allow-list of Notes from one pinned manual commit, and deploying stays the human's word.
agreement: code:repo:n_2a3d538fd141774c200a617e
root_node_id: n_9da81c8f55ca131b0e4d2d87
---

# Agreement — Explorers Manual site

> The manual holds the words. This repo gives them a place a person can follow.

## What this place is

A **code ideaspace** for the public site of the [Explorers' Manual](https://ideaspaces.xyz/repos/n_ba793faed9389f32f7f59828):
static Astro, a Cloudflare Worker serving assets, a `.md` twin of every page and an `llms.txt`, so
people and their agents can read the same thing. The readers are end users. The work is coordinated
in Home's Thread `2026-11-04-explorers-manual-core`, whose Agreement governs what ships and when.
UI/UX holds this repo.

## How work goes here

1. **Words come from the manual.** Public text lives in `knowledge/explorers-manual`. This repo holds
   the chrome: navigation, labels, the How it works scene. If a page should say something else, the
   change goes to the manual through Documentalist, not into a template here.
2. **The pin decides what is published.** `manual.pin` names one manual commit and `src/lib/pages.mjs`
   the Notes allowed from it. `scripts/build.mjs` reads those files from Git at the pin, so an uncommitted
   edit or an unlisted file cannot reach the site. Moving the pin is a reviewed commit here.
3. **Never published, for now:** `_agent/`, `.pi/`, `_threads/`, `_local/`. The build refuses them
   twice: in the allow-list, and in the finished `dist/`. The one exception is the posts of the manual's
   updates Thread, named in `src/lib/pages.mjs`; its `_agent/` and every other Thread stay closed.
4. **The build refuses rather than guesses.** A missing Note, a dead internal link or anchor, or a How
   it works beat that does not match its scene stops the build.
5. **Text reads without JavaScript.** Scripts only add to a page that already works: the animation,
   the theme switch. Every page is checked at a phone width, in both themes, and by keyboard.
6. **`wrangler.jsonc` has no route.** Attaching a hostname is a separate, deliberate step in
   [DEPLOY.md](../DEPLOY.md).

## Alone, and brought back

Alone: reader and layout work, fixing the build, moving the pin to a delivered commit, opening a
review request. Brought back to the human: deploying, DNS and Cloudflare routes, what is public,
public wording, a new shared design pattern, and any change to this file.

## Words with local meaning

- **Pin** — the full commit of the manual a build reads.
- **Twin** — the `.md` file beside each page: the Note as it stands in the manual at the pin.
- **Beat** — one step of How it works' scroll story, marked in the Note, drawn by a scene here.

## Still open

- Whether deploys after Ship 1 go ahead on the holder's check, with the human told: the Thread's 6.1.

## When to revisit

When a template starts holding words a reader would quote, when the site and the manual disagree on a
fact, or when the allow-list stops being the honest list of what is public.
