---
id: M001
title: "Core Outliner"
status: complete
completed_at: 2026-03-26T03:42:51.198Z
key_decisions:
  - D003: Flat ObjectMap with parentId/sortOrder instead of nested children array
  - D004: Cascading archive to all descendants
  - D005: Outdent re-parents subsequent siblings as children of outdented item
  - D006: fraci fractional indexing for sortOrder — insert-only, no renumbering
  - React context (not prop drilling) for AppState/UndoManager distribution
  - Flat list rendering via getVisibleItems() — no recursive component tree
  - Document-level keyboard handler with centralized dispatch
  - Double-commit guard on blur to prevent stale content writes
  - Tailwind v4 @theme tokens as single source of truth for design values
  - crypto.randomUUID() for collision-free IDs across sessions
  - fromSnapshot for hydration instead of applySnapshot — supports registerRootStore
  - Full Keystone snapshot under single IDB key for persistence simplicity
key_files:
  - src/core/model.ts
  - src/core/api.ts
  - src/core/api.test.ts
  - src/core/persistence.ts
  - src/core/persistence.test.ts
  - src/ui/App.tsx
  - src/ui/OutlineView.tsx
  - src/ui/OutlineItemRow.tsx
  - src/ui/OutlineItemRow.test.tsx
  - src/ui/useKeyboardHandler.ts
  - src/ui/useKeyboardHandler.test.tsx
  - src/ui/KeyboardHandlerHost.tsx
  - src/ui/context.ts
  - src/ui/Topbar.tsx
  - src/ui/StatusBar.tsx
  - src/global.css
  - index.html
lessons_learned:
  - Keystone's single-parent rule means detach() before re-insert in all tree manipulation — caught early in S01/T02 when outdent tests failed without sibling re-parenting
  - Fractional indexing (fraci) eliminates sortOrder renumbering entirely — worth the migration cost in S01/T03
  - Switching from sequential to UUID IDs mid-milestone causes cascading test breakage — better to start with UUIDs from day one
  - Ref callbacks (not useEffect) are the right pattern for auto-focus on mount — avoids timing issues with React rendering
  - MobX observer components + getVisibleItems() flat list renders cleanly without recursive component trees — simpler mental model than tree-shaped components
  - The (state, um, ...args) API signature pattern kept all 15+ functions uniform and made undo grouping consistent
---

# M001: Core Outliner

**Delivered a fully functional keyboard-driven outliner with tree operations, undo/redo, dark theme with amber accents, IndexedDB persistence, and JSON export — 91 tests passing, 13 requirements validated.**

## What Happened

M001 built the complete foundation of VistaNest across four slices in dependency order.

S01 (Keystone Model + Core API) established the data layer: OutlineItem and AppState MobX Keystone models with a flat ObjectMap structure using fractional indexing (fraci) for sort order. A 15+ function API covers CRUD, indent/outdent, move, collapse, complete, archive, and undo/redo with cursor restore via attachedState middleware. 57 tests proved every operation including edge cases like outdent sibling re-parenting and cascading archive with full undo restore.

S02 (Keyboard-Driven Interaction) wired the API to the browser: React context for state distribution, observer components rendering a flat list from getVisibleItems(), a document-level keyboard handler dispatching 16 navigation-mode shortcuts, and inline edit mode with Enter/Esc/blur commit paths. 21 additional tests (14 keyboard + 7 edit mode) validated the full interaction surface.

S03 (Visual Design + Layout) applied the design spec: Tailwind v4 @theme tokens with 8 color values and 3 font families, Google Fonts CDN integration, three-zone layout (fixed topbar, scrollable content, fixed status bar), and themed item rows with amber selection highlighting, SVG icons, and edit input glow. Pure CSS/className changes — no behavioral modifications needed.

S04 (Persistence + Export) completed the milestone: IndexedDB persistence via idb wrapper with 2s debounced auto-save wired through onSnapshot, async App bootstrap with IDB load and demo seed fallback, JSON export download from Topbar, and a switch from sequential IDs to crypto.randomUUID() for cross-session safety. 10 persistence tests completed the 91-test suite.

The milestone delivered exactly what the vision described: a working keyboard-driven outliner enough to try on one device and give feedback.

## Success Criteria Results

### 1. Multi-level outline creation and manipulation via keyboard with persistence
**PASS** — S01 proves tree operations (57 tests), S02 proves keyboard-only interaction (14 keyboard + 7 edit tests), S04 proves IndexedDB auto-save with data surviving page refresh (10 persistence tests). Demo seed creates 10+ items across 3+ levels for first-time users.

### 2. Visual design matches spec
**PASS** — S03 delivers dark theme (#0a0a0a background), amber accent (#e5a832), IBM Plex Sans body, Space Grotesk headings, JetBrains Mono status bar, centered 900px layout, topbar with logo and nav placeholders, status bar with mode/counts/shortcut hints, styled item rows with amber selection and checkboxes.

### 3. JSON export downloads full outline data
**PASS** — S04's downloadExportJson creates JSON Blob from getSnapshot, triggers download via hidden anchor. Unit test verifies createElement → createObjectURL → click → cleanup flow. Filename: vistanest-export-YYYY-MM-DD.json.

## Definition of Done Results

- [x] All 4 slices complete (S01 ✅, S02 ✅, S03 ✅, S04 ✅)
- [x] All slice summaries exist (S01-SUMMARY.md, S02-SUMMARY.md, S03-SUMMARY.md, S04-SUMMARY.md)
- [x] All slice UATs exist (S01-UAT.md, S02-UAT.md, S03-UAT.md, S04-UAT.md)
- [x] 91 tests pass across 4 test files (60 api + 10 persistence + 14 keyboard + 7 item row)
- [x] Zero TypeScript errors (tsc --noEmit clean)
- [x] 29 source files created with 5,296 lines of code
- [x] Cross-slice integration verified: S02 consumes S01 API, S03 styles S02 components, S04 persists S01 model snapshots

## Requirement Outcomes

All 13 in-scope requirements transitioned from Active → Validated:

- **R001** (Tree CRUD) → Validated — 57 tests prove insertBelow/insertAbove, getItem/getChildren/getVisibleItems, setContent, archiveItem with cascade
- **R002** (Tree Manipulation) → Validated — 15 tests prove indent (6), outdent with sibling re-parenting (5), moveUp/moveDown (4)
- **R003** (Keyboard Navigation) → Validated — 14 tests prove all 16 navigation-mode shortcuts
- **R004** (Inline Editing) → Validated — 7 tests prove Enter/Esc/blur commit, auto-focus, double-commit guard
- **R005** (Undo/Redo) → Validated — 14 tests prove cursor restore via attachedState for all operation types
- **R006** (Visual Design) → Validated — @theme tokens match spec, 3 fonts loaded, 900px centered layout, amber accents
- **R007** (Auto-Save) → Validated — onSnapshot → debounced saveState (2s), 10 persistence tests
- **R008** (JSON Export) → Validated — downloadExportJson with Blob+createObjectURL, unit test verifies flow
- **R009** (Status Bar) → Validated — MobX observer showing mode, counts, shortcut hints
- **R010** (Topbar) → Validated — Logo, search placeholder, disabled nav, help button, avatar
- **R011** (Collapse/Expand) → Validated — toggleCollapse + cursor navigation + deep nesting tests
- **R012** (Checkbox Completion) → Validated — toggleComplete with undo tests
- **R013** (Soft-Delete) → Validated — archiveItem cascade + full undo restore tests

Deferred requirements (R020-R026) remain deferred for M002+. Out-of-scope constraints (R030-R034) unchanged.

## Deviations

S01: Fixed insertAbove sortOrder mutation-ordering bug (T01), fixed outdentItem sibling re-parenting (T02), migrated sortOrder from integers to fraci (T03 — user-requested). S02: Added KeyboardHandlerHost wrapper component not in original plan — required by React context pattern. S03: One test assertion updated for themed CSS classes. S04: Switched generateId from sequential to UUID — cascading test fixes across 4 files.

## Follow-ups

M002 queued requirements: search (R020), hoisting (R021), command palette (R022), shortcut overlay (R023), double-letter combos (R024), back/forward navigation (R025), multiple lists (R026). No import functionality exists yet — export is one-way. No visual save indicator. Font loading has no offline fallback. StatusBar counts iterate all items per render — would need optimization at scale.
