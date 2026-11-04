import { existsSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { BEATS } from '../src/lib/story.mjs';
import { PAGES, routeOf } from '../src/lib/pages.mjs';

// The timeline exists only when the build's pin holds the updates Thread.
const hasTimeline = existsSync('dist/rss.xml');
const routes = [...PAGES.map((page) => routeOf(page.path)), '/not-a-page', ...(hasTimeline ? ['/updates'] : [])];

for (const [width, height, label] of [[1280, 800, 'wide'], [390, 844, 'phone']]) {
  test(`How it works walks every beat with real scrolling, ${label}`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height });
    await page.goto('/how-it-works');
    await page.mouse.move(width / 2, height / 2);
    const seen = [];
    for (let step = 0; step < 120 && seen.length < BEATS.length; step += 1) {
      const live = await page.locator('.hiw-beat.live').getAttribute('data-beat');
      if (seen.at(-1) !== live) seen.push(live);
      await page.mouse.wheel(0, 180);
      await page.waitForTimeout(80);
    }
    expect(seen).toEqual(BEATS.map((beat) => beat.id));
    await expect(page.locator('#gMesh')).toHaveAttribute('opacity', '1');
    await expect(page.locator('#actNum')).toHaveText('IV');
  });
}

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('How it works is the words alone', async ({ page }) => {
    await page.goto('/how-it-works');
    await expect(page.locator('.hiw-stage-col')).toBeHidden();
    await expect(page.locator('.theme')).toBeHidden();
    await expect(page.locator('.hiw-beat')).toHaveCount(BEATS.length);
    await expect(page.locator('.hiw-beat').first()).toHaveCSS('opacity', '1');
  });
});

for (const colorScheme of ['light', 'dark']) {
  test.describe(colorScheme, () => {
    test.use({ colorScheme, viewport: { width: 390, height: 844 } });

    test('no page runs wider than a phone', async ({ page }) => {
      for (const route of routes) {
        await page.goto(route);
        const width = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(width, route).toBeLessThanOrEqual(390);
      }
    });
  });
}

test('the theme switch cycles and survives a page change', async ({ page }) => {
  await page.goto('/');
  const theme = page.locator('.theme');
  await expect(theme).toHaveText('System');
  await theme.click();
  await theme.click();
  await expect(theme).toHaveText('Dark');
  await page.goto('/explore/notes');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.locator('.theme')).toHaveText('Dark');
});

test('a guide says what comes next on the path', async ({ page }) => {
  await page.goto('/guides/prepare-your-machine');
  await page.locator('.next').click();
  await expect(page).toHaveURL(/open-this-manual-with-an-agent/);
});

test('old anchors from the landing still land on their sections', async ({ page }) => {
  for (const [path, heading] of [
    ['/integrations#claude', 'Claude Code + Cowork'],
    ['/integrations#first-agent-video', 'Watch'],
    ['/developers#protocol', 'Published foundation'],
    ['/developers#build', 'The compatibility boundary'],
  ]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeInViewport();
  }
});

test.describe('the timeline', () => {
  test.skip(!hasTimeline, 'no updates Thread at this pin');

  const items = (xml) =>
    [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => ({
      link: /<link>(.*?)<\/link>/.exec(item)[1],
      date: new Date(/<pubDate>(.*?)<\/pubDate>/.exec(item)[1]),
    }));

  test('an agent can tell what changed since a date, from the feed and the Markdown', async ({ request }) => {
    const feed = items(await (await request.get('/rss.xml')).text());
    expect(feed.length).toBeGreaterThan(0);
    const dates = feed.map((item) => item.date.getTime());
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
    expect(feed.filter((item) => item.date > new Date('2100-01-01'))).toEqual([]);

    const timeline = await (await request.get('/updates.md')).text();
    for (const item of feed) {
      const path = new URL(item.link).pathname;
      expect(timeline).toContain(`${item.date.toISOString().slice(0, 10)} [`);
      expect(timeline).toContain(`${path}.md`);
      const twin = await request.get(`${path}.md`);
      expect(twin.ok()).toBe(true);
      expect(await twin.text()).toContain('kind: post');
    }
  });

  test('every post opens from the timeline and says what changed', async ({ page, request }) => {
    const feed = items(await (await request.get('/rss.xml')).text());
    await page.goto('/updates');
    await expect(page.locator('.timeline > li')).toHaveCount(feed.length);
    for (const item of feed) {
      const path = new URL(item.link).pathname;
      await page.goto('/updates');
      await page.locator(`.timeline a[href="${path}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole('heading', { name: 'What changed, read more here' })).toBeVisible();
      await expect(page.locator('.changed a').first()).toBeVisible();
    }
  });

  test('nothing but posts comes out of the Thread', async ({ request, page }) => {
    for (const closed of ['/updates/README', '/updates/README.md', '/updates/_agent/agreement.md', '/_threads/updates/README.md']) {
      expect((await request.get(closed)).status(), closed).toBe(404);
    }
    await page.goto('/updates');
    await expect(page.locator('main')).not.toContainText('msg_');
  });
});
