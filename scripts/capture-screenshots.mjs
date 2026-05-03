// scripts/capture-screenshots.mjs
// Dev-only screenshot capture script. Does not contain any secrets or API keys.
// Run from repo root: node --experimental-vm-modules scripts/capture-screenshots.mjs
// Or: cd frontend && node ../scripts/capture-screenshots.mjs
import { createRequire } from 'module';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve playwright from frontend/node_modules
const require = createRequire(join(__dirname, '../frontend/node_modules/playwright/package.json'));
const { chromium } = await import(join(__dirname, '../frontend/node_modules/playwright/index.mjs'));

const OUT = join(__dirname, '../docs/screenshots');
mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:5173';

async function shot(page, name, description) {
  await page.screenshot({
    path: join(OUT, name),
    clip: { x: 0, y: 0, width: 1440, height: 900 }
  });
  console.log(`✅ ${name} — ${description}`);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // ── Helper: dismiss any onboarding overlay ──────────────────────────────
  async function dismissOnboarding() {
    // Try pressing Escape to close overlay
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    // Also try clicking a Skip/Finish button if present
    const skip = page.locator('button:has-text("Skip"), button:has-text("Finish")').first();
    try {
      if (await skip.isVisible({ timeout: 500 })) {
        await skip.click();
        await page.waitForTimeout(300);
      }
    } catch { /* no overlay */ }
    // Set onboarding seen in localStorage so it won't reappear
    await page.evaluate(() => {
      try { localStorage.setItem('marketlayer_starter_onboarding_seen', 'true'); } catch {}
    });
  }

  // ── 1. Mode selection / start screen ────────────────────────────────────
  // Use a fresh context with localStorage pre-seeded so no onboarding overlay
  await ctx.addInitScript(() => {
    try { localStorage.setItem('marketlayer_starter_onboarding_seen', 'true'); } catch {}
  });
  await page.goto(BASE);
  // Clear everything for the true first-run mode-selection shot
  await page.evaluate(() => {
    localStorage.clear();
    // Don't set onboarding key here — we want mode selection visible
  });
  await page.reload();
  await page.waitForTimeout(1500);
  await shot(page, 'start-screen.png', 'Mode selection page');

  // ── 2. Enter Starter Mode ────────────────────────────────────────────────
  // Seed localStorage before navigating to prevent onboarding overlay
  await page.evaluate(() => {
    try { localStorage.setItem('marketlayer_starter_onboarding_seen', 'true'); } catch {}
  });
  const starterBtn = page.locator('button:has-text("Starter"), [data-mode="starter"], text=Starter Mode').first();
  const starterFallback = page.locator('text=Starter').first();
  try {
    if (await starterBtn.isVisible({ timeout: 2000 })) {
      await starterBtn.click();
    } else {
      await starterFallback.click({ timeout: 5000 });
    }
  } catch { /* already in starter */ }
  await page.waitForTimeout(1500);
  await dismissOnboarding();
  await shot(page, 'starter-console.png', 'Starter Mode main console');

  // ── 3. Switch to Advanced Mode ───────────────────────────────────────────
  try {
    const advancedBtn = page.locator('button[role="tab"]:has-text("Advanced"), button:has-text("Advanced Mode")').first();
    if (await advancedBtn.isVisible({ timeout: 2000 })) {
      await advancedBtn.click();
    } else {
      await page.locator('text=Advanced').first().click({ timeout: 5000 });
    }
    await page.waitForTimeout(1000);
  } catch { /* stay on current page */ }
  await shot(page, 'advanced-console.png', 'Advanced Mode console');

  // ── 4. Open Settings ─────────────────────────────────────────────────────
  try {
    const settingsBtn = page.locator('button:has-text("Settings"), [aria-label="Settings"], [data-testid="settings"]').first();
    if (await settingsBtn.isVisible({ timeout: 2000 })) {
      await settingsBtn.click();
    } else {
      await page.locator('text=Settings').first().click({ timeout: 5000 });
    }
    await page.waitForTimeout(800);
  } catch { /* settings not reachable */ }
  await shot(page, 'settings-panel.png', 'Settings drawer with AI provider config');

  // Close settings
  try {
    const closeBtn = page.locator('[aria-label="Close"], button:has-text("Close"), button:has-text("Done")').first();
    if (await closeBtn.isVisible({ timeout: 1000 })) await closeBtn.click();
    await page.keyboard.press('Escape');
  } catch {}
  await page.waitForTimeout(500);

  // ── 5. Skill Packs ───────────────────────────────────────────────────────
  try {
    const skillsBtn = page.locator('button:has-text("Skills"), [data-testid="skills-btn"]').first();
    if (await skillsBtn.isVisible({ timeout: 2000 })) {
      await skillsBtn.click();
    } else {
      await page.locator('text=Skills').first().click({ timeout: 5000 });
    }
    await page.waitForTimeout(800);
  } catch { /* skills not reachable */ }
  await shot(page, 'skill-packs.png', 'Skill Packs picker with Catalayer AI Packs subscription note');

  // ── 6. Full Report ───────────────────────────────────────────────────────
  try {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const fullReportBtn = page.locator('button:has-text("Full Report")').first();
    if (await fullReportBtn.isVisible({ timeout: 1000 }) && await fullReportBtn.isEnabled()) {
      await fullReportBtn.click();
      await page.waitForTimeout(1000);
    }
  } catch {}
  await shot(page, 'full-report.png', 'Console view (Full Report requires completed scan)');

  await browser.close();
  console.log(`\nAll screenshots saved to ${OUT}`);
})();
