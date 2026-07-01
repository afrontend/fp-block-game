import { chromium } from 'playwright';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';
import fs from 'fs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5177;
const BASE = '/fp-block-game/';
const COLS = 30;
const ROWS = 40;
const TICK_INTERVAL_MS = 150;
const TICKS = 80;
const EVADE_ROW_THRESHOLD = 10;
const WIDTH = 480;
const HEIGHT = 760;

let fireTick = nextFireTick(0);

function nextFireTick(tick) {
  return tick + 4 + Math.floor(Math.random() * 5);
}

const avgCol = cells =>
  cells.length === 0
    ? -1
    : cells.reduce((sum, p) => sum + p.c, 0) / cells.length;

function willCollide(shuttleCells, meteoriteCells) {
  if (meteoriteCells.length === 0) return false;
  const meteoriteMaxRow = Math.max(...meteoriteCells.map(p => p.r));
  if (meteoriteMaxRow < ROWS - 1 - EVADE_ROW_THRESHOLD) return false;
  const shuttleMinCol = Math.min(...shuttleCells.map(p => p.c));
  const shuttleMaxCol = Math.max(...shuttleCells.map(p => p.c));
  const meteoriteMinCol = Math.min(...meteoriteCells.map(p => p.c));
  const meteoriteMaxCol = Math.max(...meteoriteCells.map(p => p.c));
  return meteoriteMinCol <= shuttleMaxCol && meteoriteMaxCol >= shuttleMinCol;
}

function chooseKey(shuttleCells, meteoriteCells, tick) {
  const shuttleCol = avgCol(shuttleCells);
  const meteoriteCol = avgCol(meteoriteCells);

  if (meteoriteCol === -1) return 'up';

  if (willCollide(shuttleCells, meteoriteCells)) {
    return shuttleCol <= meteoriteCol ? 'left' : 'right';
  }

  if (tick >= fireTick) {
    fireTick = nextFireTick(tick);
    return 'up';
  }

  if (Math.abs(meteoriteCol - shuttleCol) < 2) return 'up';
  return meteoriteCol > shuttleCol ? 'right' : 'left';
}

const PLAYWRIGHT_KEY = { up: 'ArrowUp', left: 'ArrowLeft', right: 'ArrowRight' };

async function waitForServer(url, timeout = 30000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error(`Server not ready after ${timeout}ms`);
}

async function getGameCells(page) {
  return page.evaluate(cols => {
    const blocks = document.querySelectorAll('.App .block');
    const shuttle = [];
    const meteorite = [];
    blocks.forEach((block, i) => {
      const color = block.style.getPropertyValue('--c');
      if (color === 'pink' || color === 'blue') {
        const r = Math.floor(i / cols);
        const c = i % cols;
        if (color === 'pink') shuttle.push({ r, c });
        else meteorite.push({ r, c });
      }
    });
    return { shuttle, meteorite };
  }, COLS);
}

async function main() {
  console.log('Building...');
  const build = spawn('npx', ['vite', 'build'], { stdio: 'inherit', shell: true, cwd: ROOT });
  await new Promise((resolve, reject) => {
    build.on('close', code =>
      code === 0 ? resolve() : reject(new Error(`Build failed: ${code}`))
    );
  });

  console.log('Starting preview server...');
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT)], {
    stdio: 'pipe',
    shell: true,
    cwd: ROOT,
  });
  const url = `http://localhost:${PORT}${BASE}`;
  await waitForServer(url);
  console.log(`Server ready at ${url}`);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-block-demo-'));
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: { dir: tmpDir, size: { width: WIDTH, height: HEIGHT } },
  });
  const page = await context.newPage();
  await page.setViewportSize({ width: WIDTH, height: HEIGHT });
  await page.goto(url);
  await page.waitForTimeout(500);

  console.log(`Running AI for ${TICKS} ticks (~${(TICKS * TICK_INTERVAL_MS / 1000).toFixed(1)}s)...`);
  for (let i = 0; i < TICKS; i++) {
    const start = Date.now();
    const { shuttle, meteorite } = await getGameCells(page);
    const key = chooseKey(shuttle, meteorite, i);
    await page.keyboard.press(PLAYWRIGHT_KEY[key]);
    const elapsed = Date.now() - start;
    await page.waitForTimeout(Math.max(10, TICK_INTERVAL_MS - elapsed));
  }

  await page.waitForTimeout(800);

  const video = page.video();
  await context.close();
  await browser.close();
  server.kill();

  const videoPath = await video.path();
  console.log(`Video saved: ${videoPath}`);

  const outPath = path.resolve(ROOT, 'demo.gif');
  console.log('Converting to GIF...');
  execSync(
    `ffmpeg -y -i "${videoPath}" ` +
    `-vf "fps=12,scale=${WIDTH}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" ` +
    `-loop 0 "${outPath}"`,
    { stdio: 'inherit' },
  );

  console.log(`Saved: ${outPath}`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
