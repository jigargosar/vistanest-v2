# M001: Core Outliner

**Gathered:** 2026-03-26
**Status:** Ready for planning

## Project Description

VistaNest is a keyboard-driven outliner web app — a Checkvist clone the user owns. Local-first, single-user, dark theme with amber accents. The core use case: brain dump thoughts fast, search for references later. All data lives in IndexedDB on the user's device.

## Why This Milestone

This is the foundation — without a working outliner, nothing else matters. The user needs to be able to create items, rearrange them in a tree, edit inline, undo mistakes, and have data persist across sessions. The visual design needs to match the spec so the app feels like a crafted tool, not a prototype.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Open the app in a browser and see a dark-themed outliner with amber accents, proper typography, topbar, and status bar
- Create, edit, rearrange, collapse, complete, and archive outline items entirely via keyboard
- Undo/redo any operation with cursor position preserved
- Close the browser and reopen it — all data is still there
- Export all data as a JSON file for backup

### Entry point / environment

- Entry point: `pnpm dev` → https://localhost:5173 (Vite dev server with basic SSL)
- Environment: local dev / browser
- Live dependencies involved: none (fully local, IndexedDB only)

## Completion Class

- Contract complete means: core API tests pass for all tree operations, undo/redo, archive, and cursor management
- Integration complete means: keyboard events wire through to core API and render correctly in the UI
- Operational complete means: data persists across page refresh via IndexedDB, JSON export produces valid downloadable file

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- User can create a multi-level outline with 10+ items across 3+ levels, rearrange them, complete some, archive some, undo/redo operations — all via keyboard only — and the data survives page refresh
- The visual design matches the spec: dark theme, amber accent, proper fonts (IBM Plex Sans, Space Grotesk, JetBrains Mono), topbar, status bar, styled item rows with selection highlighting
- JSON export downloads a file that contains the full outline data

## Risks and Unknowns

- MobX Keystone's undoMiddleware with attached state for cursor restore — the API exists but wiring cursor save/restore to undo steps may have edge cases
- Keystone's single-parent rule for tree manipulation — indent/outdent/move requires detach() before re-insert, which could have subtle ordering issues
- Font loading — three web fonts (IBM Plex Sans, Space Grotesk, JetBrains Mono) need to load without FOUT or layout shift
- Soft-delete interaction with undo — archiving an item then undoing should restore it seamlessly

## Existing Codebase / Prior Art

- `src/ui/App.tsx` — bare shell, renders "VistaNest" heading on dark background
- `src/index.tsx` — React entry point, renders App into #app div
- `src/global.css` — Tailwind v4 import only, no custom theme yet
- `vite.config.ts` — Vite + React + Tailwind v4 + basic SSL plugins
- `vitest.config.ts` — vitest with jsdom environment, globals
- `tsconfig.json` — strict mode, experimentalDecorators enabled for Keystone
- `docs/superpowers/specs/2026-03-25-vistanest-v1-design.md` — full v1 design spec (visual design, keyboard system, data architecture, item model)
- `docs/superpowers/plans/2026-03-25-vistanest-phase1.md` — Phase 1 implementation plan from prior tool

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R001 (Tree CRUD) — core model and API
- R002 (Tree Manipulation) — indent, outdent, move operations
- R003 (Keyboard Navigation) — keyboard-driven interaction
- R004 (Inline Editing) — Enter/Esc edit flow
- R005 (Undo/Redo) — undoMiddleware with cursor restore
- R006 (Visual Design) — dark theme, amber, fonts, layout
- R007 (IndexedDB Auto-Save) — persistence
- R008 (JSON Export) — data export
- R009 (Status Bar) — bottom bar UI
- R010 (Topbar) — top bar UI with placeholders
- R011 (Collapse/Expand) — subtree visibility
- R012 (Checkbox Completion) — toggle complete
- R013 (Soft-Delete) — archive instead of destroy

## Scope

### In Scope

- MobX Keystone model with OutlineItem and AppState
- Encapsulated core API (~15 functions) with comprehensive tests
- Undo/redo via Keystone undoMiddleware with cursor position restore
- Soft-delete (archive) instead of permanent deletion
- Keyboard navigation: j/k, o/O, Tab/Shift+Tab, Space, h/l, Enter, Esc, Backspace, Ctrl+Z/Ctrl+Shift+Z, Ctrl+Up/Ctrl+Down
- Inline editing with markdown-in, rendered-out
- Dark theme with amber accent, three-font typography
- Topbar with logo, search placeholder, disabled nav placeholders
- Status bar with mode, count, shortcut hints
- IndexedDB auto-save with debounce
- JSON export download
- Pre-populated demo list for onboarding

### Out of Scope / Non-Goals

- Double-letter keyboard combos (dd, ee, nn) — needs combo library, deferred to M002
- Command palette (Ctrl+Ctrl) — deferred to M002
- Full-text search — deferred to M002
- Focus/zen mode — deferred to M002
- Multiple lists — deferred to M002+
- Cross-device sync, mobile gestures, sharing, themes, due dates/tags

## Technical Constraints

- MobX Keystone requires `experimentalDecorators: true` in tsconfig (already set)
- Keystone's single-parent rule: items must be detach()'d before re-inserting in tree manipulation
- Tailwind v4 uses `@theme` directive for custom design tokens (not tailwind.config.js)
- Vite dev server uses basic SSL plugin (https://localhost:5173)
- IndexedDB is async — initial load must handle the empty-DB case gracefully

## Integration Points

- IndexedDB (via idb wrapper) — auto-save persistence
- Google Fonts CDN — IBM Plex Sans, Space Grotesk, JetBrains Mono
- Browser keyboard events — global keydown handler with context-aware routing

## Open Questions

- Demo list content — what items to pre-populate for onboarding (agent's discretion — model after Checkvist's welcome list)
- Archive UI — no restore UI in M001, archive is fire-and-forget until future milestone
