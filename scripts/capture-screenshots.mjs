/**
 * MarketLayer by Catalayer — Screenshot capture script (dev only)
 * No API keys or secrets. Run: node scripts/capture-screenshots.mjs
 * Requires: frontend running on localhost:5173
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../docs/screenshots');
mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:5173';
const W = 1440;
const H = 900;

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ── 1. Mode selection — fresh state, no prefs ──────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: W, height: H } });
    await ctx.addInitScript(() => { localStorage.clear(); });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(OUT, 'mode-selection.png'), clip: { x: 0, y: 0, width: W, height: H } });
    console.log('✅ mode-selection.png');
    await ctx.close();
  }

  // ── 2. Starter Mode — onboarding hidden, no previous scan ─────────────
  {
    const ctx = await browser.newContext({ viewport: { width: W, height: H } });
    await ctx.addInitScript(() => {
      localStorage.setItem('marketlayer_starter_onboarding_seen', '1');
      localStorage.setItem('marketlayerPreferredMode', 'starter');
      localStorage.removeItem('marketlayer:starter:last-report');
      localStorage.removeItem('marketlayer:starter:last-report-ver');
    });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: join(OUT, 'starter-mode.png'), clip: { x: 0, y: 0, width: W, height: H } });
    console.log('✅ starter-mode.png');
    await ctx.close();
  }

  // ── 3. Advanced Mode ───────────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: W, height: H } });
    await ctx.addInitScript(() => {
      localStorage.setItem('marketlayer_starter_onboarding_seen', '1');
      localStorage.setItem('marketlayerPreferredMode', 'advanced');
      localStorage.removeItem('marketlayer:starter:last-report');
    });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: join(OUT, 'advanced-mode.png'), clip: { x: 0, y: 0, width: W, height: H } });
    console.log('✅ advanced-mode.png');
    await ctx.close();
  }

  // ── 4. Settings drawer ─────────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: W, height: H } });
    await ctx.addInitScript(() => {
      localStorage.setItem('marketlayer_starter_onboarding_seen', '1');
      localStorage.setItem('marketlayerPreferredMode', 'starter');
    });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    // Settings button is the last button in the bottom action bar
    const btn = page.locator('button').filter({ hasText: 'Settings' }).last();
    if (await btn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(1200);
    }
    await page.screenshot({ path: join(OUT, 'settings-drawer.png'), clip: { x: 0, y: 0, width: W, height: H } });
    console.log('✅ settings-drawer.png');
    await ctx.close();
  }

  // ── 5. Skill Packs picker ──────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: W, height: H } });
    await ctx.addInitScript(() => {
      localStorage.setItem('marketlayer_starter_onboarding_seen', '1');
      localStorage.setItem('marketlayerPreferredMode', 'advanced');
    });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    const btn = page.locator('button').filter({ hasText: /Skills/ }).first();
    if (await btn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(1200);
    }
    await page.screenshot({ path: join(OUT, 'skill-packs.png'), clip: { x: 0, y: 0, width: W, height: H } });
    console.log('✅ skill-packs.png');
    await ctx.close();
  }

  await browser.close();
  console.log(`\nAll screenshots saved to ${OUT}`);
})();
