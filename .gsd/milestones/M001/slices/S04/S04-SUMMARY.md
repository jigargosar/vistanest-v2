---
id: S04
parent: M001
milestone: M001
provides:
  - IndexedDB persistence module (save/load/export)
  - Auto-save wired via onSnapshot with 2s debounce
  - JSON export download from Topbar
  - Demo seed for first-time users
requires:
  - slice: S02
    provides: Keyboard-driven UI with AppState/OutlineItem model and core API
affects:
  []
key_files:
  - src/core/persistence.ts
  - src/core/persistence.test.ts
  - src/core/api.ts
  - src/ui/App.tsx
  - src/ui/Topbar.tsx
key_decisions:
  - Switched from sequential item-N IDs to crypto.randomUUID() for collision-free IDs across sessions
  - Used fromSnapshot for hydration instead of applySnapshot — creates fresh tree supporting registerRootStore
  - Persistence stores full Keystone snapshot under a single IDB key for simplicity
  - Export uses Blob + createObjectURL + hidden anchor pattern
patterns_established:
  - IDB persistence via idb wrapper with typed DBSchema
  - Async App bootstrap — load from IDB, fallback to seed, wire listeners after load
  - Demo seed function using core API with cleared undo history
observability_surfaces:
  - console.warn on auto-save failure
  - console.warn on IDB load failure with fallback to demo seed
drill_down_paths:
  - .gsd/milestones/M001/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S04/tasks/T02-SUMMARY.md
  - .gsd/milestones/M001/slices/S04/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-26T03:39:07.917Z
blocker_discovered: false
---

# S04: Persistence + Export

**IndexedDB auto-save with 2s debounce, JSON file export from Topbar, and rich demo seed for first-time users — data survives page refresh, user can always get their data out.**

## What Happened

Built the persistence layer in three tasks. T01 created src/core/persistence.ts with openDB, saveState, loadState, applyLoadedSnapshot, and exportStateAsJSON using the idb wrapper with a typed DBSchema. Switched generateId() from sequential item-N to crypto.randomUUID() to prevent ID collisions across sessions, fixing cascading test breakage across 4 files. T02 rewired App.tsx from synchronous useMemo to async useEffect bootstrap: loads from IDB, falls back to rich demo seed on empty/error, shows loading spinner, wires onSnapshot with 2s debounced auto-save after bootstrap completes. Used fromSnapshot for clean hydration supporting registerRootStore. T03 added downloadExportJson with Blob+createObjectURL+hidden anchor pattern, wired Export button with download icon in Topbar.

## Verification

All 91 tests pass across 4 test files (60 api, 10 persistence, 14 keyboard, 7 outline row). Zero TypeScript errors. Persistence tests cover round-trip save/load, empty DB, JSON export, snapshot hydration, and download flow.

## Requirements Advanced

- R007 — Auto-save implemented via onSnapshot + debounced saveState to IndexedDB. Data survives page refresh.
- R008 — downloadExportJson creates JSON Blob and triggers browser download. Export button in Topbar.

## Requirements Validated

- R007 — 10 persistence tests covering round-trip save/load, snapshot hydration, empty DB fallback. App.tsx wires onSnapshot → debounced saveState.
- R008 — Unit test verifies full download flow (createElement, createObjectURL, anchor.click, cleanup). Export button wired in Topbar.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T01 required fixing _resetIdCounter references and hardcoded item-N ID assertions in useKeyboardHandler.test.tsx and OutlineItemRow.test.tsx — direct consequence of switching to UUIDs.

## Known Limitations

No import functionality — export is one-way. Auto-save stores entire snapshot as a single blob (no incremental persistence). No visual indicator of save status.

## Follow-ups

None — this is the final slice of M001.

## Files Created/Modified

- `src/core/persistence.ts` — IndexedDB persistence module — open, save, load, export, download
- `src/core/persistence.test.ts` — 10 tests covering round-trip, hydration, export, download
- `src/core/api.ts` — Switched generateId to crypto.randomUUID(), added loadAppState for hydration
- `src/core/api.test.ts` — Fixed hardcoded item-N ID assertions
- `src/ui/App.tsx` — Async bootstrap with IDB load, demo seed fallback, debounced auto-save
- `src/ui/Topbar.tsx` — Added Export button with download icon
- `src/ui/useKeyboardHandler.test.tsx` — Fixed _resetIdCounter removal
- `src/ui/OutlineItemRow.test.tsx` — Fixed _resetIdCounter removal
- `package.json` — Added fake-indexeddb dev dependency
