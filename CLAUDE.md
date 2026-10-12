# CLAUDE.md

CS171 group project, dashboard-prototype milestone: two coordinated-view prototypes for **The Evolution of LLM Value**, built from the Sketch-phase sheets in `../llm-sketchbook/`. Scaffold copied from `../cs171-labs/lab4/billboard-dashboard`.

## Commands

```sh
npm install
npm run dev      # http://localhost:5173  ->  /p1 and /p2
npm run build
npm run build:pages   # static single-file pages -> docs/ (GitHub Pages), commit docs/ after
```

Live: https://xiakuanhao.github.io/llm-value-dashboards/ (`/p1/`, `/p2/`). Pages serves `main:/docs`. Each page takes a `root` prop ('/' in the app, relative in `standalone/*.js`) so nav links work in both.

## Stack and conventions

- SvelteKit 3 / Svelte 5 (runes forced in `vite.config.js`) / Vite 8, plain JS.
- Import alias is `#lib`, not `$lib`.
- D3 v7 for scales, axes, brushes. Svelte renders data marks with `{#each}`; D3 only touches axis/brush `<g>`s.

## Data

`src/lib/llm_models.json` is exported from `../llm-sketchbook/lib/data.js` (calibrated seed set, 453 models, 2023–2026; ids de-duplicated on export; bundled, not fetched). Loaded by `loadLLM()` in `src/lib/data.js`, which also holds the shared rules: `isHandMeDown` (later, ≥ intelligence, cheaper) and `monthlyCost` (80% input / 20% output tokens).

## Coordination rules

Every shared value lives in the page and has exactly one writer. **Filter = remove + recompute; Link = highlight only.** Every interaction says which one it is in the UI.

- **/p1** (sketches 1 + 4 + 2): `dateRange` FILTER written by Staircase brush → HandMeDowns. `selectedId` LINK written by Reigns click → Staircase + HandMeDowns. Reigns and Staircase share one time axis.
- **/p2** (sketches 5 + 3): shared filters (provider, license, min intelligence, years) remove from both views; `box` FILTER written by SpeedPrice 2-D brush → CostWall; `hoveredId` LINK written by CostWall hover → SpeedPrice.

Brush sources always receive the full (pre-brush) set so the brush stays usable.
