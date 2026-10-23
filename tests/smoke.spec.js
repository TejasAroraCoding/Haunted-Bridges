import { expect, test } from '@playwright/test';

/** Collects uncaught errors and console errors so every test can assert there were none. */
function trackErrors(page) {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => msg.type() === 'error' && errors.push(msg.text()));
  return errors;
}

const game = (page, fn, arg) => page.evaluate(fn, arg);

async function startRun(page) {
  await page.getByRole('button', { name: /DEPLOY INTO BRIDGE/ }).click();
  await expect.poll(() => game(page, () => window.__game.state.scene)).toBe('play');
  await game(page, () => {
    window.__game.state.stageCardTimer = 0;
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#menu-main')).toBeVisible();
});

test('main hub fits on screen', async ({ page }) => {
  const errors = trackErrors(page);
  const viewport = page.viewportSize();
  const deploy = await page.getByRole('button', { name: /DEPLOY INTO BRIDGE/ }).boundingBox();
  expect(deploy.y + deploy.height).toBeLessThanOrEqual(viewport.height);
  const stage = await page.locator('#game-stage').boundingBox();
  expect(stage.width / stage.height).toBeCloseTo(16 / 9, 1);
  expect(errors).toEqual([]);
});

test('a run starts, the hero moves and fires', async ({ page }) => {
  const errors = trackErrors(page);
  await startRun(page);
  const startX = await game(page, () => window.__game.state.player.x);
  await page.keyboard.down('d');
  await page.waitForTimeout(400);
  await page.keyboard.up('d');
  expect(await game(page, () => window.__game.state.player.x)).toBeGreaterThan(startX + 20);
  await page.keyboard.down(' ');
  await page.waitForTimeout(150);
  expect(await game(page, () => window.__game.state.playerBullets.length)).toBeGreaterThan(0);
  await page.keyboard.up(' ');
  expect(errors).toEqual([]);
});

test('collecting every coin opens the gate and the portal warps to stage 2', async ({ page }) => {
  await startRun(page);
  await game(page, () => {
    const s = window.__game.state;
    s.player.inv = 99;
    for (const coin of s.coins) Object.assign(coin, { x: s.player.x, y: s.player.y });
  });
  await expect.poll(() => game(page, () => window.__game.state.gateLift), { timeout: 5000 }).toBe(1);
  await game(page, () => Object.assign(window.__game.state.player, { x: 940, y: 270 }));
  await expect.poll(() => game(page, () => window.__game.state.stageIndex), { timeout: 6000 }).toBe(1);
});

test('every stage loads its layout', async ({ page }) => {
  const errors = trackErrors(page);
  await startRun(page);
  for (let stage = 0; stage < 6; stage++) {
    const info = await game(
      page,
      n => {
        window.__game.loadStage(n);
        const s = window.__game.state;
        return { coins: s.coins.length, enemies: s.enemies.length, boss: Boolean(s.boss) };
      },
      stage
    );
    if (stage < 5) expect(info.coins).toBeGreaterThan(0);
    else expect(info.boss).toBe(true);
    expect(info.enemies).toBeGreaterThan(0);
    await page.waitForTimeout(150);
  }
  expect(errors).toEqual([]);
});

test('running out of lives shows the game-over screen', async ({ page }) => {
  await startRun(page);
  await game(page, () => {
    const s = window.__game.state;
    Object.assign(s, { lives: 0 });
    Object.assign(s.player, { hp: 1, inv: 0 });
    window.__game.hurt(1);
  });
  await expect(page.locator('#modal-end')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#end-title')).toHaveText('GAME OVER');
});

test('defeating Malakor shows the victory screen', async ({ page }) => {
  await startRun(page);
  await game(page, () => {
    window.__game.loadStage(5);
    const s = window.__game.state;
    Object.assign(s, { stageCardTimer: 0, bossIntro: 0 });
    s.player.inv = 99;
    s.boss.hp = 0.5;
    s.playerBullets.push({
      x: s.boss.x,
      y: s.boss.y,
      vx: 1,
      vy: 0,
      l: 1,
      dm: 5,
      weapon: 'bolt',
      aoe: false,
      pierce: 0,
      age: 0,
      rot: 0,
    });
  });
  await expect(page.locator('#modal-end')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('#end-title')).toHaveText('VICTORY');
});

test('pause menu opens and resumes', async ({ page }) => {
  await startRun(page);
  await page.keyboard.press('p');
  await expect(page.locator('#modal-status')).toBeVisible();
  await page.getByRole('button', { name: /RESUME MISSION/ }).click();
  await expect.poll(() => game(page, () => window.__game.state.scene)).toBe('play');
});

test('starting a new run during the portal warp begins at stage 1', async ({ page }) => {
  await startRun(page);
  await game(page, () => {
    const s = window.__game.state;
    Object.assign(s, { coinsLeft: 0, gateLift: 1, warpTimer: 1.5 }); // mid-warp to stage 2
  });
  await page.keyboard.press('r'); // restart
  await page.waitForTimeout(2500); // longer than the warp would have taken
  expect(await game(page, () => window.__game.state.stageIndex)).toBe(0);
});

test('heroes are named Aric, Ronin, Bram and Phoenix', async ({ page }) => {
  await page.getByRole('button', { name: /CHAMPIONS/ }).click();
  const names = await page
    .locator('#modal-heroes .hero-card .font-display.text-white, #modal-heroes .hero-card')
    .allInnerTexts();
  const text = names.join(' ');
  for (const name of ['ARIC', 'RONIN', 'BRAM', 'PHOENIX']) expect(text.toUpperCase()).toContain(name);
  expect(text.toUpperCase()).not.toContain('VESPER');
  expect(text.toUpperCase()).not.toContain('LYRA');
});
