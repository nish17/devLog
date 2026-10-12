# DevLog

Your wins, remembered.

DevLog is a personal engineering brag book. Log achievements quickly, keep original notes and evidence intact, and generate deterministic self-review summaries for a date range. Everything stays in your browser via `localStorage`—no backend, auth, or cloud sync.

## Stack

- React + TypeScript + Vite
- Plain CSS (no Tailwind or component libraries)
- Browser `localStorage` for persistence
- Optional local [Ollama](https://ollama.com) for AI review drafts

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
- **Journal** — search, category filter, inclusive date range; icon Edit/Delete actions
- **Dark mode** — header toggle; preference saved in `localStorage` (`devlog.theme.v1`); system preference used when unset
- **Review Mode** — period summary from saved data only; copy or export Markdown / Obsidian Markdown; optional Ollama AI draft
- **Backups** — versioned JSON export/import, Markdown journal export, and Obsidian-friendly Markdown export

## Dark mode

Use the **Dark** / **Light** control in the site header. The choice persists across reloads. If you have never toggled it, DevLog follows `prefers-color-scheme`.

## Obsidian export

On **Backups**, choose **Download Obsidian Markdown**. On **Review Mode**, use **Export Obsidian Markdown**. Exports include YAML frontmatter (`title`, `date`, `tags`), category tags, and wikilink-safe headings. JSON and plain Markdown exports remain available.

## Optional Ollama AI summary

1. Install and run [Ollama](https://ollama.com) locally.
2. Pull a model (default: `qwen2.5:3b`):

   ```bash
   ollama pull qwen2.5:3b
   ```

3. Open **Review Mode**, enable **Use Ollama to draft a summary**, optionally change the model name, then click **Generate AI summary**.

The prompt is grounded only on achievements in the selected period. Original evidence links always appear in the UI alongside any AI text. If Ollama is down, the model is missing, or the request times out, DevLog keeps the deterministic template review.

### CORS / Vite proxy

`npm run dev` and `npm run preview` proxy `/ollama` → `http://127.0.0.1:11434`, so the browser does not need direct CORS access during local Vite use.

If you call Ollama from another origin (or without the proxy), allow your app origin:

```bash
# macOS / Linux example for the Vite dev server
export OLLAMA_ORIGINS="http://127.0.0.1:4327,http://localhost:4327"
ollama serve
```

See [Ollama FAQ — how do I configure OLLAMA_ORIGINS?](https://github.com/ollama/ollama/blob/main/docs/faq.md) for details.

## Data

Achievements are stored under the key `devlog.achievements.v1`. Theme preference: `devlog.theme.v1`. Ollama model preference: `devlog.ollama.model.v1`. Export JSON backups regularly if you care about long-term retention across browsers or devices.

## Privacy

All data stays on your device. Optional AI summaries are sent only to local Ollama when you opt in. Invalid imports are rejected without overwriting existing entries.
