# DevLog

Your wins, remembered.

DevLog is a personal engineering brag book. Log achievements quickly, keep original notes and evidence intact, and generate deterministic self-review summaries for a date range. Everything stays in your browser via `localStorage`—no backend, auth, or cloud sync.

## Stack

- React + TypeScript + Vite
- Plain CSS (no Tailwind or component libraries)
- Browser `localStorage` for persistence

## Run locally

```bash
npm install
npm run dev
```

The app serves at [http://127.0.0.1:4327](http://127.0.0.1:4327).

## Scripts

| Command           | Description                         |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start the Vite development server   |
| `npm run build`   | Typecheck and build for production  |
| `npm run preview` | Preview the production build        |
| `npm run lint`    | Run oxlint                          |

## Features

- **Dashboard** — counts, recent wins, quick capture
- **Quick capture** — create/edit with validation; delete with confirmation
- **Journal** — search, category filter, inclusive date range
- **Review Mode** — period summary from saved data only; copy or export Markdown
- **Backups** — versioned JSON export/import and full Markdown journal export

## Data

Achievements are stored under the key `devlog.achievements.v1`. Export JSON backups regularly if you care about long-term retention across browsers or devices.

## Privacy

All data stays on your device. Invalid imports are rejected without overwriting existing entries.
