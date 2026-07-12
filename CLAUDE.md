# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Caroline's Art Lab** — a single-page, no-menu portfolio site styled as a technical/engineering drawing (graph-paper background, monospace annotations, drafting title blocks, registration marks). It hosts a growing set of interactive canvas pieces ("plates"), each turning a real photo into a generative structure that responds to cursor/touch. Deployed as a static site to GitHub Pages at `carolinevrauwdeunt-lab.github.io/art-lab`.

## Commands

```bash
npm install       # install deps
npm run dev        # local dev server (vite)
npm run build       # production build to dist/
npm run preview      # serve the production build locally
```

There is no test suite or linter configured. Verify changes by running `npm run build` and visually checking the result with `npm run preview` (or `npm run dev`) — these are canvas/animation pieces, so a successful build does not guarantee they render or respond to input correctly.

`vite.config.js` sets `base: "/art-lab/"` to match the GitHub Pages path. If the repo is ever renamed again, this must be updated to match, or the deployed asset URLs will 404.

## Architecture

### Page structure (`src/ArtLab.jsx` + `src/artlab.css`)

One long scrolling page, no navigation menu. Internal helper components in `ArtLab.jsx`:
- `Schematic` — the circuit-style link dividers between sections (used for external links: mail, Instagram, GitHub, LinkedIn, and an in-page `#about` anchor). These double as the site's only navigation.
- `Plate` — a reserved/placeholder specimen card (faint construction-geometry SVG + "PLATE RESERVED" text) for work not yet made.
- `LivePlate` — the wrapper for a finished, interactive piece. Takes `fig`, `title`, `medium`, and an optional `portrait` flag (switches the card to a 3:4 frame via `.plate-frame.portrait` instead of the default 4:3) so artwork isn't cropped to fit a fixed grid ratio.

The hero section is always the newest/flagship piece; plates below it are numbered `FIG. 00N` sequentially as they're added.

### The interactive-piece pattern

Each piece (`ParticleTulipHero.jsx`, `WireframeLionPlate.jsx`) follows the same two-stage pipeline, and any new piece should too:

1. **Offline data generation** (not part of the app's runtime/build): a source photo is analyzed once — via canvas pixel sampling in-browser (see `ParticleTulipHero`'s `buildSource`/particle-sampling code) or via an offline Python/PIL+numpy script (used for the lion mesh: edge magnitude + local texture detail → weighted grid sampling → Delaunay triangulation via scipy) — to produce a compact, baked dataset of positions (and for the mesh piece, connections). This is committed as a plain JS module exporting the data (`src/particleData.js`, `src/lionMeshData.js`), not regenerated at runtime. There is no script in this repo that re-runs this generation; if the source photo or sampling parameters change, the offline process has to be redone and the data module hand-replaced.
2. **Runtime rendering**: a React component draws to a `<canvas>` inside a `useEffect`, laying out the baked positions to fit the container's aspect ratio, animating a gentle idle drift (sin/cos per-point phase/amplitude), and pushing points away from the pointer within a radius with spring/damping physics (`SPRING`/`DAMPING` constants), settling back when the pointer moves on. `prefers-reduced-motion` short-circuits to a single static frame with no listeners attached.

The two existing pieces render visually different things (a photo re-expressed as loose particle dust vs. a photo re-expressed as a triangulated wireframe mesh with coordinate-labeled feature nodes) but share this same offline-sampling + spring-physics-canvas approach. A new piece should pick its own visual structure rather than reusing particles or a mesh verbatim — the pattern to reuse is the two-stage pipeline and the interaction physics, not the specific visual.

Source photos are committed directly (`src/tulip-source.jpg`, `src/lion-source.jpg`) and composited as a dimmed backdrop layer behind the canvas in each piece.

### CI/CD (`.github/workflows/`)

- `deploy.yml` — builds with Vite and deploys `dist/` to GitHub Pages via `actions/upload-pages-artifact` + `actions/deploy-pages`, on every push to `main`. GitHub Pages must have its source set to "GitHub Actions" in repo settings for this to work (a one-time manual setting, not something this workflow configures).
- `security.yml` — runs Gitleaks (secret scanning) and Trivy (filesystem vuln/misconfig scanning) on push/PR to `main` and weekly; both upload SARIF to code scanning.
- `dependabot.yml` — weekly update PRs for both npm and GitHub Actions dependencies. Dependabot PRs that touch the same workflow file in adjacent lines (e.g. two different action version bumps in `deploy.yml`) will conflict with each other on merge; resolve by merging `main` into the branch, manually reconciling both version bumps, and pushing before merging.
