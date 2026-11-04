---
name: Explorers Manual site
summary: The public site of the Explorers' Manual, for manual.ideaspaces.xyz. Static Astro, built from one pinned manual commit and an allow-list of Notes, with a Markdown twin of every page and an llms.txt.
---

# Explorers Manual site

The site that presents the [Explorers' Manual](https://ideaspaces.xyz/repos/n_ba793faed9389f32f7f59828).
The words live in the manual; this repo gives them a place. It holds the reader, the front page, and
How it works' scroll story. Start with the [Agreement](_agent/agreement.md).

## See it

You need Node 22.23 or newer and a checkout of the manual.

```sh
npm ci
npm run build      # reads the manual at manual.pin, then checks dist/
npm run preview    # http://localhost:4321
```

The build looks for the manual at `../../knowledge/explorers-manual`. Set `MANUAL_ROOT` if yours is
elsewhere. `npm run dev` runs the same source on Astro's dev server.

## How a Note becomes a page

| | |
|---|---|
| `manual.pin` | The manual commit a build reads |
| `src/lib/pages.mjs` | The allow-list: which Notes are published, and where they appear |
| `scripts/build.mjs` | Copies exactly those files out of Git at the pin, then runs Astro |
| `scripts/check-dist.mjs` | Reads the finished `dist/` and refuses what should not be there |
| `src/lib/content.ts` | Turns a Note into a page, and refuses a link that lands on nothing |
| `src/lib/story.mjs` | What each How it works beat shows |

To publish a new manual commit, change `manual.pin` and rebuild. To publish another Note, add it to
`src/lib/pages.mjs`. Both are reviewed changes here.

`/explore/notes` is the page and `/explore/notes.md` its twin: the Note exactly as it stands at the
pin. `/llms.txt` lists them all.

## The timeline

`/updates` is the manual's updates Thread, `_threads/updates/`, read from Git at the pin. Only `kind: post`
reaches readers, and `src/lib/updates.mjs` builds the tree from `in_reply_to`. Each post has a page, a `.md`
twin and a place in `/rss.xml`; `/updates.md` and `llms.txt` list them with dates, so an agent can answer
"what changed since this date?". A pin without the Thread simply has no timeline. The look is direction A, the
line, chosen by the human from Visuals' study; `src/styles/timeline.css` holds it.

## How it works' story

The Note marks the story with comments, so its wording stays plain Markdown:

```markdown
<!-- story: start -->

## I. The loop

<!-- beat: loop -->
### Every agent runs the same small loop.

<!-- story: end -->
```

Acts are `##` headings, beats are `###` headings right after their mark, and `src/lib/story.mjs` says
what each beat id shows. If the ids or their order differ from the Note, the build refuses. The scene
itself is `src/components/how-it-works/scene.svg`, from the landing. Its one rule: the loop drawing
never moves, because the eye only sees what moved if nothing else did.

## Checks

```sh
npm run build                 # includes scripts/check-dist.mjs
npx playwright test           # walks the built site in Chromium and WebKit
```

Deploying is the human's step: [DEPLOY.md](DEPLOY.md).
