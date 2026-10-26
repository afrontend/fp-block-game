# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, OpenCode, pi, …) working in this repository.
`CLAUDE.md` only imports this file (`@AGENTS.md`); edit this file, not `CLAUDE.md`.

## What this is

`fp-block-game` is the React web frontend for the Block game, deployed to GitHub Pages at https://afrontend.github.io/fp-block-game. It sits in the afrontend game stack:

```
fp-panel (npm) → fp-block (npm, game logic) → fp-block-game (this repo)
```

All game rules live in the `fp-block` npm package; this repo only renders state and maps input. Fix rule bugs in `fp-block`, publish, then bump the dependency here (or `npm link` while iterating).

## Commands

```sh
npm start           # Vite dev server
npm run build       # production build → dist/
npm run preview     # serve the built dist/
npm test            # vitest run (jsdom)
npm run screenshot  # Playwright screenshot (scripts/screenshot.js)
npm run demo        # Playwright + ffmpeg demo GIF (scripts/demo.js)
npm run deploy      # manual fallback: build + gh-pages -d dist
```

## Deployment (CI)

Pushing to `master` runs GitHub Actions:

- `deploy.yml` — `npm ci` → `npm test` (gate) → `npm run build` → publish `dist/` to the `gh-pages` branch
- `screenshot.yml` / `demo.yml` — regenerate `screenshot.png` / `demo.gif` and upload them to the `screenshots` GitHub release (README images point there)

`vite.config.js` sets `base: '/fp-block-game/'`; keep it in sync with the Pages path.

## Layout

- `src/App.jsx` — the whole game UI
- `src/utils/keyMap.js` — keyCode → key symbol (`left`/`right`/`up` = fire/`space` = pause, plus app keys `save`, `load`, `debug`, `help`)
- `src/*.test.jsx`, `src/utils/*.test.js` — vitest + Testing Library; setup in `src/setupTests.js`
- `scripts/` — Playwright screenshot/demo scripts used by CI

## App.jsx pattern

1. `useState(() => fpBlock.init({ rows, columns, missileCooldownTicks }))` — game state
2. `setInterval(() => setGameState(s => fpBlock.tick(s)), fpBlock.getTickInterval(state))` — game loop; a 3-2-1 countdown runs before it starts
3. `keyboard-handler` `keyPressed` → `getKeySymbol` → `fpBlock.key(symbol, state)`; `S`/`L` quick save/load via `serializeState`/`restoreState`, `H` help overlay, `D` debug
4. `fpBlock.join(state).flat()` → `{ color }` cells rendered as memoized `<div class="block">` (`'grey'` = empty)
5. Touch: swipe / tap detection on the container element
