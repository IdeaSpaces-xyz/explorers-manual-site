import { expect, test } from '@playwright/test';
import { BEATS } from '../src/lib/story.mjs';
import { PAGES, routeOf } from '../src/lib/pages.mjs';

const routes = [...PAGES.map((page) => routeOf(page.path)), '/not-a-page'];

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
