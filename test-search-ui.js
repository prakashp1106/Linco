import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(1000);

  // Fill search bar in main feed
  const searchInput = page.locator('input[placeholder*="Search"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill('Searching for lost wallet in Indiranagar Bengaluru');
  }

  await page.screenshot({ path: '/home/jules/verification/search_bar_fixed.png', fullPage: false });
  await browser.close();
})();
