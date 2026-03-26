---
estimated_steps: 3
estimated_files: 2
skills_used: []
---

# T01: Define design tokens and load Google Fonts

Establish the complete design system foundation: Tailwind v4 @theme tokens in global.css and Google Fonts CDN links in index.html. Every subsequent task depends on these tokens being available as Tailwind utilities.

The design spec defines: dark background #0c0c0e, surface #1a1a1e, border #2a2a2e, text primary #e8e6e3, text secondary #a0a0a0, amber accent #e5a832 with lighter/darker shades. Three font families: IBM Plex Sans (body), Space Grotesk (headings/logo), JetBrains Mono (code/status).

Tailwind v4 uses @theme directive in CSS — no tailwind.config.js. Color tokens must use --color-* prefix, font tokens must use --font-* prefix.

## Inputs

- ``src/global.css` — existing file with only `@import "tailwindcss"``
- ``index.html` — needs Google Fonts <link> tags added to <head>`

## Expected Output

- ``src/global.css` — @theme block with full color palette and font-family tokens`
- ``index.html` — Google Fonts CDN links for IBM Plex Sans, Space Grotesk, JetBrains Mono`

## Verification

pnpm typecheck && pnpm test
