# Minesweeper — Playable Demo

[![Coverage](https://codecov.io/gh/jquinter/nuxt-101-minesweeper/branch/main/graph/badge.svg)](https://codecov.io/gh/jquinter/nuxt-101-minesweeper)
[![Codecov](https://img.shields.io/codecov/c/github/jquinter/nuxt-101-minesweeper?logo=codecov&logoColor=white)](https://codecov.io/gh/jquinter/nuxt-101-minesweeper)

A small Minesweeper-style demo built with Nuxt + Vue 3. This is a minimal, first-playable version used for learning and experimentation.

## What it is
- A simple grid-based minesweeper board rendered with Vue components.
- Left-click a cell to reveal it. If the cell contains a mine the game ends.
- Revealed cells show a number indicating how many adjacent mines are nearby.

Notes: flagging via right-click is not implemented in this first version; the UI contains flagged state but no user input to toggle it yet.

## How to play
1. Start the dev server (see below).
2. Open the app in your browser.
3. Click any cell to reveal it.
4. Try to reveal all non-mine cells without clicking a mine.

## Development / Run
Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

By default Nuxt's dev server will open at a local port such as `http://localhost:3000` or an alternative if 3000 is in use (Nuxt prints the port). If you see HMR/WebSocket port conflicts ("Port 24678 is already in use"), either stop the other process using that port or restart the dev server.

## Files of interest
- `app/components/Board.vue` — board logic and layout
- `app/components/Cell.vue` — single-cell display
- `app/app.vue` — application entry mounting the `Board` component

## Known issues & next steps
- Flagging cells (user input for `isFlagged`) is not implemented.
- Improve responsive styling and cell sizing.
- Add a restart button and win/lose screens.

Enjoy! If you want, I can implement flags, a restart button, or polished UI next.
# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
