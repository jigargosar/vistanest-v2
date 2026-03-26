---
estimated_steps: 5
estimated_files: 3
skills_used: []
---

# T02: Build layout shell with Topbar and StatusBar components

Create the two new layout components (Topbar, StatusBar) and restructure App.tsx into a three-zone layout: fixed topbar, scrollable content area with padding offsets, fixed bottom status bar.

**Topbar.tsx**: Space Grotesk logo text with amber accent, search placeholder input with / hint (non-functional), disabled Due/Tags/Lists nav links, help button (? icon), avatar placeholder circle. Fixed at top with z-10+.

**StatusBar.tsx**: MobX observer component. Fixed bottom bar with JetBrains Mono font. Shows: mode indicator reading state.editingItemId (non-null = 'EDIT', null = 'NAVIGATE'), total non-archived item count via iterating state.items.values(), completed count, and contextual shortcut hints (e.g. 'j/k navigate • o insert • Enter edit'). Derive counts inline — AppState has no count methods. MobX tracks the iteration automatically.

**App.tsx**: Restructure from bare div wrapper to: fixed Topbar at top → main content area with top/bottom padding to clear fixed bars → fixed StatusBar at bottom. Keep KeyboardHandlerHost, OutlineProvider, and seed logic unchanged.

This task closes R009 (status bar) and R010 (topbar).

## Inputs

- ``src/ui/App.tsx` — current bare div layout to restructure`
- ``src/ui/context.ts` — useAppState() hook for StatusBar to read state`
- ``src/core/model.ts` — AppState shape (items, cursorItemId, editingItemId)`
- ``src/global.css` — design tokens from T01`

## Expected Output

- ``src/ui/Topbar.tsx` — new fixed topbar component with logo, search, nav placeholders`
- ``src/ui/StatusBar.tsx` — new fixed status bar component showing mode, counts, hints`
- ``src/ui/App.tsx` — restructured three-zone layout composing Topbar, content, StatusBar`

## Verification

pnpm typecheck && pnpm test
