---
id: S01
parent: M001
milestone: M001
provides:
  - Core data model: OutlineItem and AppState Keystone models
  - Complete API: 15+ functions covering CRUD, tree ops, navigation, editing, undo/redo
  - Proven undo/redo with cursor restore via attachedState middleware
  - Fractional indexing (fraci) for sortOrder
  - 57 passing tests as regression safety net
requires:
  []
affects:
  - S02
  - S03
  - S04
key_files:
  - src/core/model.ts
  - src/core/api.ts
  - src/core/api.test.ts
key_decisions:
  - Flat ObjectMap with parentId/sortOrder instead of nested children array (D003)
  - Cascading archive to all descendants (D004)
  - Outdent re-parents subsequent siblings as children of outdented item (D005)
  - fraci fractional indexing for sortOrder (D006)
  - All API functions use (state, um, ...args) signature for uniform undo grouping
  - toggleCollapse allowed on leaf nodes
patterns_established:
  - API function signature: (state, um, ...args) with um.withGroup() wrapping
  - Cursor/editing restore via attachedState in undo middleware
  - fraci sortOrder: stored as string in model, cast to branded FractionalIndex at API boundaries
  - Test pattern: createAppState() + resetIdCounter() in beforeEach for determinism
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M001/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-26T02:48:54.335Z
blocker_discovered: false
---

# S01: Keystone Model + Core API

**Built complete outliner data model and API with 57 passing tests — CRUD, indent/outdent, move, collapse, complete, archive, undo/redo with cursor restore, all on fraci fractional indexing.**

## What Happened

T01 built the foundation: OutlineItem model (id, content, parentId, sortOrder, isCompleted, isCollapsed, isArchived, note) and AppState model (title, items ObjectMap, cursorItemId, editingItemId) with query methods. Full API landed with 15+ functions covering CRUD, tree ops, navigation, editing, and undo/redo. All operations wrap in um.withGroup() for atomic undo. 13 tests validated CRUD and editing. A sortOrder mutation-ordering bug in insertAbove was caught and fixed.

T02 added 29 tests for the riskiest operations: indent (6), outdent (5), move (4), cursor navigation (8), toggles (4), deep collapse (1), sort order stability (1). Outdent tests exposed missing sibling re-parenting — fixed to match standard outliner behavior (WorkFlowy/Dynalist pattern).

T03 added 15 undo/redo tests covering every operation type plus a large integration workflow test. Migrated sortOrder from sequential integers to fraci fractional indexing, eliminating renumberChildren and making ordering insert-only. All 57 tests pass with clean typecheck.

## Verification

pnpm typecheck — 0 type errors (exit 0). pnpm test — 57/57 tests pass (exit 0). Test coverage spans CRUD (7), editing (2), indent (6), outdent (5), move (4), cursor navigation (8), toggles (4), deep collapse (1), sort order stability (1), undo/redo (14), integration workflow (1), additional edge cases (4).

## Requirements Advanced

- R001 — Validated — 57 passing tests prove CRUD on tree structure
- R002 — Validated — 15 tests prove indent/outdent/move with undo
- R005 — Validated — 14 undo/redo tests prove cursor restore for all ops
- R011 — Validated — collapse/expand proven with navigation and deep nesting
- R012 — Validated — toggleComplete proven with undo
- R013 — Validated — archive with cascade and full undo restore proven

## Requirements Validated

- R001 — 57 passing tests prove CRUD operations
- R002 — 15 tests prove indent/outdent/move
- R005 — 14 undo/redo tests with cursor restore
- R011 — Collapse/expand with navigation tests
- R012 — toggleComplete with undo tests
- R013 — archiveItem cascade + undo restore tests

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Fixed insertAbove sortOrder computation (mutation-ordering bug) in T01. Fixed outdentItem to re-parent subsequent siblings in T02. Migrated sortOrder from integer to fraci fractional indexing in T03 (user-requested).

## Known Limitations

getChildren/getVisibleItems are O(n) scans — fine for hundreds of items, would need indexing for thousands. No persistence layer yet (S04). No UI integration (S02).

## Follow-ups

None.

## Files Created/Modified

- `src/core/model.ts` — OutlineItem and AppState Keystone models with all fields, setters, and query methods
- `src/core/api.ts` — Complete API: createAppState, setupUndo, CRUD, tree ops, navigation, editing, undo/redo
- `src/core/api.test.ts` — 57 tests covering all operations, edge cases, undo/redo, and integration workflow
