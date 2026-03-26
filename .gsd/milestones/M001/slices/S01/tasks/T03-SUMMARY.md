---
id: T03
parent: S01
milestone: M001
provides: []
requires: []
affects: []
key_files: ["src/core/api.test.ts", "src/core/api.ts", "src/core/model.ts"]
key_decisions: ["Use fraci (fraciString with BASE62) for fractional indexing instead of sequential integers", "fraci sortOrder stored as plain string in Keystone model, cast to branded FractionalIndex type at API boundaries"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran pnpm typecheck (0 type errors, exit 0) and pnpm test (57/57 tests pass, exit 0)."
completed_at: 2026-03-26T02:45:31.643Z
blocker_discovered: false
---

# T03: Added 15 undo/redo tests and integration workflow test proving full API composition, plus migrated sortOrder to fraci fractional indexing

> Added 15 undo/redo tests and integration workflow test proving full API composition, plus migrated sortOrder to fraci fractional indexing

## What Happened
---
id: T03
parent: S01
milestone: M001
key_files:
  - src/core/api.test.ts
  - src/core/api.ts
  - src/core/model.ts
key_decisions:
  - Use fraci (fraciString with BASE62) for fractional indexing instead of sequential integers
  - fraci sortOrder stored as plain string in Keystone model, cast to branded FractionalIndex type at API boundaries
duration: ""
verification_result: passed
completed_at: 2026-03-26T02:45:31.646Z
blocker_discovered: false
---

# T03: Added 15 undo/redo tests and integration workflow test proving full API composition, plus migrated sortOrder to fraci fractional indexing

**Added 15 undo/redo tests and integration workflow test proving full API composition, plus migrated sortOrder to fraci fractional indexing**

## What Happened

Wrote 15 new tests covering undo/redo for every operation type (insertBelow, archiveItem, indentItem, outdentItem, moveItemUp, toggleComplete, toggleCollapse, setContent), plus redo, LIFO ordering, no-op safety, compound operation atomicity, and cursor restore. Added a large integration workflow test exercising a realistic session with cursor validity assertions throughout. Migrated sortOrder from sequential integers to fraci fractional indexing (fraciString with BASE62), eliminating renumberChildren and making ordering insert-only. All 57 tests pass with clean typecheck.

## Verification

Ran pnpm typecheck (0 type errors, exit 0) and pnpm test (57/57 tests pass, exit 0).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `pnpm typecheck` | 0 | ✅ pass | 3600ms |
| 2 | `pnpm test` | 0 | ✅ pass | 1380ms |


## Deviations

Migrated sortOrder from number to string (fraci fractional indexing) as requested by user — not in original task plan. Rewrote existing tests to use API functions instead of manual setParentId/setSortOrder calls.

## Known Issues

None.

## Files Created/Modified

- `src/core/api.test.ts`
- `src/core/api.ts`
- `src/core/model.ts`


## Deviations
Migrated sortOrder from number to string (fraci fractional indexing) as requested by user — not in original task plan. Rewrote existing tests to use API functions instead of manual setParentId/setSortOrder calls.

## Known Issues
None.
