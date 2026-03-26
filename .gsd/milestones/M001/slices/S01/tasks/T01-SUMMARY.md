---
id: T01
parent: S01
milestone: M001
provides: []
requires: []
affects: []
key_files: ["src/core/model.ts", "src/core/api.ts", "src/core/api.test.ts"]
key_decisions: ["Sequential integer ID generator with test reset for determinism", "renumberChildren helper to prevent sortOrder drift after indent/outdent", "All API functions take (state, um, ...args) signature for uniform undo grouping"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran pnpm typecheck (0 type errors) and npx vitest run src/core/api.test.ts --reporter=verbose (13/13 tests pass). Both exit code 0."
completed_at: 2026-03-26T02:33:57.350Z
blocker_discovered: false
---

# T01: Built OutlineItem/AppState Keystone models and complete core API with 13 passing CRUD+editing tests

> Built OutlineItem/AppState Keystone models and complete core API with 13 passing CRUD+editing tests

## What Happened
---
id: T01
parent: S01
milestone: M001
key_files:
  - src/core/model.ts
  - src/core/api.ts
  - src/core/api.test.ts
key_decisions:
  - Sequential integer ID generator with test reset for determinism
  - renumberChildren helper to prevent sortOrder drift after indent/outdent
  - All API functions take (state, um, ...args) signature for uniform undo grouping
duration: ""
verification_result: passed
completed_at: 2026-03-26T02:33:57.352Z
blocker_discovered: false
---

# T01: Built OutlineItem/AppState Keystone models and complete core API with 13 passing CRUD+editing tests

**Built OutlineItem/AppState Keystone models and complete core API with 13 passing CRUD+editing tests**

## What Happened

Created the foundation data model and API layer for the outliner. OutlineItem model with id, content, parentId, sortOrder, isCompleted, isCollapsed, isArchived, note — each with @modelAction setter. AppState model with title, items (ObjectMap), cursorItemId, editingItemId — plus query methods getItem, getChildren (filtered/sorted), getSiblings, getVisibleItems (recursive DFS). Full API: createAppState, insertBelow, insertAbove, archiveItem (cascading), setContent, startEditing/stopEditing, indentItem/outdentItem, moveItemUp/moveItemDown, toggleComplete/toggleCollapse, moveCursorUp/moveCursorDown, undo/redo. All operations wrapped in um.withGroup(). Undo middleware uses attachedState for cursor/editing restore. 13 tests cover all CRUD and editing operations. Fixed a sortOrder mutation-ordering bug in insertAbove.

## Verification

Ran pnpm typecheck (0 type errors) and npx vitest run src/core/api.test.ts --reporter=verbose (13/13 tests pass). Both exit code 0.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `pnpm typecheck` | 0 | ✅ pass | 2900ms |
| 2 | `npx vitest run src/core/api.test.ts --reporter=verbose` | 0 | ✅ pass | 1300ms |


## Deviations

Fixed insertAbove sortOrder computation — captured refOrder before bumping siblings to avoid mutation-ordering bug.

## Known Issues

None.

## Files Created/Modified

- `src/core/model.ts`
- `src/core/api.ts`
- `src/core/api.test.ts`


## Deviations
Fixed insertAbove sortOrder computation — captured refOrder before bumping siblings to avoid mutation-ordering bug.

## Known Issues
None.
