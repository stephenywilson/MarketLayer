/**
 * MarketLayer by Catalayer — Screenshot capture script
 * Dev-only. Does not contain API keys or secrets.
 * Usage: node scripts/capture-screenshots.mjs
 */
import { createRequire } from 'module';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../docs/screenshots');
mkdirSync(OUT, { recursive: true });

// Resolve playwright from frontend/node_modules since it is not installed at repo root
const frontendModules = join(__dirname, '../frontend/node_modules');
const { chromium } = await import(join(frontendModules, 'playwright/index.mjs'));

const BASE = 'http://localhost:5173';
const W = 1440;
const H = 900;

async function capture(page, filename, description) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(OUT, filename), clip: { x: 0, y: 0, width: W, height: H } });
  console.log(`✅ ${filename} — ${description}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: W, height: H } });
  const page = await ctx.newPage();

  // ── 1. Mode selection (fresh state)
  await page.goto(BASE);
  await page.evaluate(() => {
    localStorage.removeItem('marketlayerPreferredMode');
    localStorage.removeItem('marketlayer_starter_onboarding_seen');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await capture(page, 'mode-selection.png', 'Mode selection page');

  // ── 2. Starter Mode
  // Try clicking Starter button or card
  try {
    const btn = page.locator('text=Starter').first();
    if (await btn.isVisible({ timeout: 2000 })) {
      await btn.click();
      await page.waitForTimeout(1500);
    }
  } catch {}
  // If we're still on mode selection, navigate directly
  const url = page.url();
  if (url === BASE + '/' || url === BASE) {
    await page.goto(BASE + '/?mode=starter');
    await page.waitForTimeout(1500);
  }
  await capture(page, 'starter-mode.png', 'Starter Mode dashboard');

  // ── 3. Switch to Advanced Mode
  try {
    const adv = page.locator('text=Advanced, text=ADVANCED').first();
    if (await adv.isVisible({ timeout: 2000 })) {
      await adv.click();
      await page.waitForTimeout(1200);
    }
  } catch {}
  await capture(page, 'advanced-mode.png', 'Advanced Mode dashboard');

  // ── 4. Settings drawer
  try {
    const settings = page.locator('text=Settings').first();
    if (await settings.isVisible({ timeout: 2000 })) {
      await settings.click();
      await page.waitForTimeout(1000);
    }
  } catch {}
  await capture(page, 'settings-drawer.png', 'Settings drawer');

  // Close settings
  try {
    const esc = page.locator('[aria-label="Close"]').first();
    if (await esc.isVisible({ timeout: 1000 })) await esc.click();
    else await page.keyboard.press('Escape');
  } catch {}
  await page.waitForTimeout(500);

  // ── 5. Skill Packs picker
  try {
    const skills = page.locator('text=Skills').first();
    if (await skills.isVisible({ timeout: 2000 })) {
      await skills.click();
      await page.waitForTimeout(1000);
    }
  } catch {}
  await capture(page, 'skill-packs.png', 'Skill Packs picker');

  await browser.close();
  console.log(`\n📸 All screenshots saved to ${OUT}`);
})();
