# S03: Visual Design + Layout — Research

**Date:** 2026-03-26

## Summary

S03 applies a specific design system to an already-functional but unstyled outliner. The design spec (`docs/superpowers/specs/2026-03-25-vistanest-v1-design.md`) defines every visual detail: dark theme with amber `#e5a832`, three Google Fonts (IBM Plex Sans body, Space Grotesk headings/logo, JetBrains Mono code/status), single-column ~900px centered layout, topbar with logo and placeholder nav, status bar with mode/counts/hints, and styled item rows with amber selection highlight and checkboxes.

The existing UI (App.tsx, OutlineView.tsx, OutlineItemRow.tsx) is fully functional from S02 — keyboard navigation, inline editing, tree operations all work. The components use minimal inline Tailwind classes (bg-[#0c0c0e], text-[#e8e6e3], hardcoded 24px indent). No design tokens, no fonts, no layout structure beyond a bare div wrapper.

This is straightforward CSS/component work with no risky unknowns. Tailwind v4 `@theme` handles design tokens natively (no JS config). Google Fonts CDN handles font loading. The three target requirements (R006 visual design, R009 status bar, R010 topbar) are well-specified.

## Recommendation

Build bottom-up: design tokens and fonts first (global.css), then layout shell (topbar + status bar + content area), then styled item rows. This order lets every subsequent task inherit the theme. Keep the topbar and status bar as new components; restyle OutlineItemRow in place.

Font loading: use Google Fonts CDN `<link>` tags in index.html with `display=swap` for no-FOUT rendering. Three `@font-face` families, declared in `@theme` as Tailwind font tokens.

Status bar needs item counts. AppState has no count methods — derive counts inline via `state.items.values()` iteration in the StatusBar component. MobX reactivity handles updates automatically via `observer()`.

## Implementation Landscape

### Key Files

- `src/global.css` — Currently just `@import "tailwindcss"`. Needs `@theme` block with full color palette (bg, surface, border, text, amber accent shades), font-family tokens, and any custom spacing values.
- `index.html` — Needs Google Fonts `<link>` tags for IBM Plex Sans (400, 500, 600), Space Grotesk (500, 700), JetBrains Mono (400).
- `src/ui/App.tsx` — Currently renders a bare div with heading + OutlineView. Needs restructuring into topbar → content area → status bar layout. The h1 and seed function stay; the layout wrapper changes.
- `src/ui/OutlineView.tsx` — Currently `font-mono text-sm`. Needs restyling to use body font, proper text size, centered column layout.
- `src/ui/OutlineItemRow.tsx` — Currently uses hardcoded 24px indent, basic bg-white/10 cursor highlight, text chevrons (▶/▼), text checkboxes (☑/☐). Needs: 26px indent per level, 36px min height, 16px text, amber left border + subtle amber bg for selected, proper SVG or icon chevrons, styled checkboxes (amber checked, muted unchecked), amber border+glow for edit input.
- `src/ui/Topbar.tsx` — **New file.** Logo (text-based with Space Grotesk, amber accent), search placeholder (non-functional input with `/` hint), disabled Due/Tags/Lists nav placeholders, help button, avatar placeholder.
- `src/ui/StatusBar.tsx` — **New file.** Fixed bottom bar showing: mode indicator (NAVIGATE/EDIT), total item count, completed count, contextual shortcut hints. JetBrains Mono font. Reads from AppState via useAppState().

### Build Order

1. **Design tokens + fonts** (global.css + index.html) — Everything downstream depends on the theme being defined. Font loading in index.html, `@theme` tokens in global.css. Quick to build, unblocks all styling work. Verify: fonts render in browser, Tailwind utilities like `bg-surface`, `text-amber`, `font-body` work.

2. **Layout shell + Topbar + StatusBar** (App.tsx + new components) — Restructure App.tsx into three-zone layout: fixed topbar, scrollable content area, fixed status bar. Build Topbar.tsx and StatusBar.tsx as new observer components. Verify: layout renders with correct structure, topbar shows logo and placeholders, status bar shows mode and counts.

3. **Styled item rows** (OutlineItemRow.tsx + OutlineView.tsx) — Apply theme to existing components: item height, indent, selection highlight, chevrons, checkboxes, edit input glow. This is the highest-touch task — most visual detail lives here. Verify: items render at correct size, selection shows amber highlight, edit mode shows amber glow, completed items have proper styling.

### Verification Approach

- `pnpm typecheck` — no type errors after component changes
- `pnpm test` — all 81 existing tests still pass (no behavioral changes, only styling)
- Visual verification in browser (`pnpm dev`) — dark theme renders, fonts load, topbar/status bar visible, item rows styled correctly with selection highlighting and edit glow
- Specifically verify: (1) three fonts load without FOUT, (2) amber accent visible on selected items and checkboxes, (3) status bar shows correct counts, (4) topbar has logo and disabled placeholders, (5) edit input has amber border+glow

## Constraints

- Tailwind v4 uses `@theme` directive in CSS for design tokens — no `tailwind.config.js` (the project doesn't have one, and v4 doesn't use it)
- Indent per level must change from 24px to 26px per the design spec
- Google Fonts are loaded via CDN — no npm package needed
- `display=swap` on font links prevents invisible text during load (FOUT over FOIT)
- Existing test assertions reference DOM structure and class names — styling changes that alter element structure could break tests. The S02 tests use `data-testid="inline-edit-input"` and check content/state, not classes, so restyling should be safe. Verify by running tests after each task.
- AppState has no computed count properties — StatusBar must derive counts by iterating `state.items.values()`. This is fine for performance (hundreds of items max) and MobX tracks the access automatically.

## Common Pitfalls

- **Tailwind v4 @theme variable naming** — Color tokens must use `--color-*` prefix to generate `bg-*`, `text-*` utilities. Font tokens must use `--font-*` prefix for `font-*` utilities. Missing prefix = no utility generated.
- **Google Fonts weight selection** — Request only needed weights (400, 500, 600 for Plex Sans; 500, 700 for Space Grotesk; 400 for JetBrains Mono). Over-requesting adds latency; under-requesting causes faux bold.
- **Fixed positioning for topbar/status bar** — Use `fixed top-0` / `fixed bottom-0` with `z-10`+, and add matching padding to the content area so items aren't hidden behind them. Easy to forget the content padding offset.
- **Edit input focus ring** — The existing edit input uses `outline-none`. The amber glow should be a custom `box-shadow` or `ring` utility, not a browser outline, to match the design spec's "amber border + glow" description.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Tailwind CSS | wshobson/agents@tailwind-design-system (24.1K installs) | available — not needed, @theme usage is straightforward |
| Frontend Design | frontend-design | installed — useful for design polish principles but this slice follows a strict spec |
