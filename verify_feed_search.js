import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:5173');
  // Click Browse Community Feed or navigate to search
  const browseBtn = page.locator('button:has-text("Browse Community Feed")');
  if (await browseBtn.isVisible()) {
    await browseBtn.click();
  }

  await page.waitForTimeout(1000);

  // Find search input in feed list
  const searchInput = page.locator('input[placeholder*="Search"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill('This is a very long search query testing that text does not overlap with clear icon or shortcut badge');
    await page.screenshot({ path: '/home/jules/verification/feed_search_fixed.png' });
    console.log('Saved screenshot to /home/jules/verification/feed_search_fixed.png');
  } else {
    console.log('Search input not found on feed page, taking full page screenshot');
    await page.screenshot({ path: '/home/jules/verification/feed_search_fixed.png' });
  }

  await browser.close();
})();
