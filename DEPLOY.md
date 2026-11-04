---
name: Explorers Manual site, release handoff
summary: Not deployed. What is prepared, what the human decides, the steps to attach manual.ideaspaces.xyz, and the signed-out smoke test to run afterwards.
---

# Release handoff (not deployed)

`wrangler.jsonc` serves `dist/` as Worker static assets, with no route, no custom domain and
`workers_dev: false`, so `wrangler deploy` alone cannot claim a hostname. Astro's canonical host is
`https://manual.ideaspaces.xyz`. No beacon or analytics is included.

## Before a release

```sh
git status --short            # empty, on the reviewed commit
npm ci
npm run build                 # no MANUAL_PIN: only manual.pin is a release
npx playwright test
```

Inspect `dist/`. The build refuses a commit that is not on the manual's `main`, a missing Note, a dead
internal link or anchor, a How it works beat that differs from its scene, and anything from `_agent/`,
`.pi/`, `_threads/` or `_local/`.

## Human gates

Nothing below has been run.

1. Say which `manual.pin` goes live, and whether the manual is pushed to its hosted repo first.
2. In Cloudflare, identify the account and the `ideaspaces.xyz` zone. Inspect any existing `manual`
   DNS record, Worker route or Pages project. DNS resolution alone does not prove ownership or routing.
3. Approve a non-conflicting Worker custom domain for `manual.ideaspaces.xyz`, or decide a different
   route. Never replace an existing record or Worker by assumption.
4. Then, and only then, add to `wrangler.jsonc`:

   ```jsonc
   "routes": [{ "pattern": "manual.ideaspaces.xyz", "custom_domain": true, "zone_name": "ideaspaces.xyz" }]
   ```

   and run `npx wrangler deploy`.

Read-only probes, if authorized: `dig manual.ideaspaces.xyz`, `curl -I https://manual.ideaspaces.xyz/`,
`wrangler whoami`, `wrangler deployments list --name explorers-manual-site`, `wrangler deploy --dry-run`.

## After a deploy: signed-out smoke

```sh
base=https://manual.ideaspaces.xyz
for path in / /index.md /README.md /how-it-works /how-it-works.md /integrations /developers \
  /guides/prepare-your-machine /guides/prepare-your-machine.md /explore/notes /reference/language \
  /llms.txt /robots.txt /sitemap-index.xml /favicon.svg; do
  curl -sS -o /dev/null -w '%{http_code} %{content_type} %{url_effective}\n' "$base$path"
done
curl -sS -o /dev/null -w '%{http_code} %{url_effective}\n' "$base/_agent/agreement.md"   # 404
curl -sS -o /dev/null -w '%{http_code} %{url_effective}\n' "$base/CLAUDE.md"             # 404
curl -sSI "$base/" | grep -i 'content-signal\|content-type'
```

Expect 200 and the right type, then walk it in a browser: How it works' eight beats, both themes, a
phone. Post the result in the Thread. Then the landing's link can go up, on the human's word.
