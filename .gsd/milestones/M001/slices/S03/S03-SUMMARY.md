---
id: S03
parent: M001
milestone: M001
provides:
  - Design system tokens available as Tailwind utilities
  - Three-zone layout shell (fixed topbar, scrollable content, fixed status bar)
  - Themed item rows with amber selection, SVG icons, edit input glow
requires:
  - slice: S02
    provides: Functional keyboard-driven outliner with OutlineItemRow, OutlineView, and App components
affects:
  - S04
key_files:
  - src/global.css
  - index.html
  - src/ui/Topbar.tsx
  - src/ui/StatusBar.tsx
  - src/ui/App.tsx
  - src/ui/OutlineItemRow.tsx
  - src/ui/OutlineView.tsx
key_decisions:
  - Used hex colors in @theme rather than oklch for exact design spec match
  - z-20 for fixed bars — above content, below future modals
  - StatusBar derives counts inline via items.values() iteration — no computed getters added to AppState
  - border-l-2 with border-transparent on non-selected rows to prevent layout shift
  - Inline SVG icons rather than an icon library dependency
patterns_established:
  - Tailwind v4 @theme tokens as single source of truth for design values
  - Fixed topbar + scrollable content + fixed status bar three-zone layout
  - border-transparent placeholder pattern to prevent layout shift on selection
observability_surfaces:
  - StatusBar shows live mode indicator (NAVIGATE/EDIT) and item counts — runtime state diagnostic
drill_down_paths:
  - .gsd/milestones/M001/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S03/tasks/T02-SUMMARY.md
  - .gsd/milestones/M001/slices/S03/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-26T03:20:45.397Z
blocker_discovered: false
---

# S03: Visual Design + Layout

**Dark theme with amber accents, three-zone layout (topbar/content/status bar), themed item rows with SVG icons and selection highlighting — app matches the design spec.**

## What Happened

Three tasks built up the visual layer in dependency order. T01 laid the design system foundation: Tailwind v4 @theme block in global.css with 8 color tokens and 3 font-family tokens, plus Google Fonts CDN links in index.html. T02 created Topbar.tsx (Space Grotesk amber logo, disabled search/nav placeholders, help button, avatar) and StatusBar.tsx (MobX observer showing NAVIGATE/EDIT mode, item counts, shortcut hints), then restructured App.tsx into the three-zone fixed-bar layout. T03 applied the full visual theme to OutlineItemRow (26px indent, 36px min height, amber border-l-2 selection, inline SVG chevrons and checkboxes, amber edit input glow) and OutlineView (font-body, centered 900px container). All changes were CSS/className-only — no behavioral modifications. One test assertion updated to match new edit input classes.

## Verification

pnpm typecheck — 0 errors. pnpm test — 81/81 tests pass across 3 test files (api, keyboard handler, item row). Each task independently verified before proceeding.

## Requirements Advanced

- R006 — Full dark theme with amber accent, three font families, centered 900px layout — all spec requirements delivered
- R009 — Fixed status bar with mode indicator, item counts, and contextual shortcut hints
- R010 — Fixed topbar with logo, search placeholder, nav placeholders, help button, avatar

## Requirements Validated

- R006 — Design tokens match spec colors exactly. Three font families loaded via CDN. Centered 900px layout. Amber accents on selection, checkboxes, edit input. 81 tests pass.
- R009 — StatusBar.tsx is MobX observer showing NAVIGATE/EDIT mode, non-archived count, completed count, shortcut hints. Fixed bottom with JetBrains Mono.
- R010 — Topbar.tsx renders Space Grotesk amber logo, disabled search with / hint, disabled Due/Tags/Lists, help button, avatar. Fixed top.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

One test assertion in OutlineItemRow.test.tsx updated to match new themed edit input classes (border-none → border border-amber). Necessary mechanical change, not behavioral.

## Known Limitations

Topbar search and nav links are non-functional placeholders (by design for M001). Font loading depends on Google Fonts CDN with no offline fallback. StatusBar counts iterate all items on every render — fine for hundreds but would need optimization at scale.

## Follow-ups

None.

## Files Created/Modified

- `src/global.css` — Added @theme block with 8 color tokens and 3 font-family tokens
- `index.html` — Added Google Fonts CDN preconnect hints and stylesheet links
- `src/ui/Topbar.tsx` — New component: fixed header with logo, search placeholder, nav placeholders
- `src/ui/StatusBar.tsx` — New component: MobX observer showing mode, counts, shortcut hints
- `src/ui/App.tsx` — Restructured to three-zone layout with fixed bars and padded content
- `src/ui/OutlineItemRow.tsx` — Full design theme: amber selection, SVG icons, styled checkboxes, edit glow
- `src/ui/OutlineView.tsx` — Body font, centered 900px container
- `src/ui/OutlineItemRow.test.tsx` — Updated edit input class assertion to match new themed styles
