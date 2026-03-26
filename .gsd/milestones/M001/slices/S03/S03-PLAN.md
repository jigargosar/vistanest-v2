# S03: Visual Design + Layout

**Goal:** App matches the design spec — dark theme with amber accents, IBM Plex Sans / Space Grotesk / JetBrains Mono typography, topbar with logo and nav placeholders, status bar with mode and counts, styled item rows with selection highlighting and checkboxes. Centered ~900px single-column layout.
**Demo:** After this: After this: app matches the design spec — dark theme with amber accents, IBM Plex Sans / Space Grotesk / JetBrains Mono typography, topbar with logo and nav placeholders, status bar with mode and counts, styled item rows with selection highlighting and checkboxes.

## Tasks
- [x] **T01: Added Tailwind v4 @theme design tokens (colors, fonts) and Google Fonts CDN links for IBM Plex Sans, Space Grotesk, JetBrains Mono** — Establish the complete design system foundation: Tailwind v4 @theme tokens in global.css and Google Fonts CDN links in index.html. Every subsequent task depends on these tokens being available as Tailwind utilities.

The design spec defines: dark background #0c0c0e, surface #1a1a1e, border #2a2a2e, text primary #e8e6e3, text secondary #a0a0a0, amber accent #e5a832 with lighter/darker shades. Three font families: IBM Plex Sans (body), Space Grotesk (headings/logo), JetBrains Mono (code/status).

Tailwind v4 uses @theme directive in CSS — no tailwind.config.js. Color tokens must use --color-* prefix, font tokens must use --font-* prefix.
  - Estimate: 20m
  - Files: src/global.css, index.html
  - Verify: pnpm typecheck && pnpm test
- [x] **T02: Built three-zone layout shell with fixed Topbar (Space Grotesk logo, search/nav placeholders) and MobX-observed StatusBar (mode indicator, item counts, keyboard hints)** — Create the two new layout components (Topbar, StatusBar) and restructure App.tsx into a three-zone layout: fixed topbar, scrollable content area with padding offsets, fixed bottom status bar.

**Topbar.tsx**: Space Grotesk logo text with amber accent, search placeholder input with / hint (non-functional), disabled Due/Tags/Lists nav links, help button (? icon), avatar placeholder circle. Fixed at top with z-10+.

**StatusBar.tsx**: MobX observer component. Fixed bottom bar with JetBrains Mono font. Shows: mode indicator reading state.editingItemId (non-null = 'EDIT', null = 'NAVIGATE'), total non-archived item count via iterating state.items.values(), completed count, and contextual shortcut hints (e.g. 'j/k navigate • o insert • Enter edit'). Derive counts inline — AppState has no count methods. MobX tracks the iteration automatically.

**App.tsx**: Restructure from bare div wrapper to: fixed Topbar at top → main content area with top/bottom padding to clear fixed bars → fixed StatusBar at bottom. Keep KeyboardHandlerHost, OutlineProvider, and seed logic unchanged.

This task closes R009 (status bar) and R010 (topbar).
  - Estimate: 45m
  - Files: src/ui/Topbar.tsx, src/ui/StatusBar.tsx, src/ui/App.tsx
  - Verify: pnpm typecheck && pnpm test
- [x] **T03: Applied full design theme to OutlineItemRow (amber selection border, SVG chevrons/checkboxes, edit input glow) and OutlineView (centered 900px body-font container)** — Apply the full design theme to OutlineItemRow.tsx and OutlineView.tsx. This is the highest-touch visual task — most design detail lives in item rendering.

**OutlineView.tsx**: Replace font-mono text-sm with body font (font-body), proper text size (text-base / 16px). Wrap items in a centered max-w-[900px] container with appropriate horizontal padding.

**OutlineItemRow.tsx changes**:
- Indent: change from `depth * 24` to `depth * 26` per design spec
- Row height: add min-h-[36px] for 36px minimum height
- Selection highlight: replace bg-white/10 with amber left border (border-l-2 border-amber) + subtle amber background (bg-amber/5 or similar) when isCursor is true
- Collapse chevrons: replace text ▶/▼ with proper SVG chevron icons (inline SVG, right-pointing and down-pointing), sized to match checkboxes
- Checkboxes: replace ☑/☐ text with styled checkbox elements — amber fill when completed, muted border when unchecked
- Edit input: add amber border + glow effect (border-amber + ring/box-shadow with amber color) instead of bare outline-none. Same font as body text.
- Completed items: line-through with reduced opacity (already exists, verify it uses theme colors)
- Empty state text: use theme text-secondary color

All changes are CSS/className only — no behavioral changes. The data-testid='inline-edit-input' attribute and all event handlers must remain untouched to keep existing tests passing.
  - Estimate: 45m
  - Files: src/ui/OutlineItemRow.tsx, src/ui/OutlineView.tsx
  - Verify: pnpm typecheck && pnpm test
