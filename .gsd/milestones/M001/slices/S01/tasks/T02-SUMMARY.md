---
id: T02
parent: S01
milestone: M001
provides: []
requires: []
affects: []
key_files: ["src/core/api.test.ts", "src/core/api.ts"]
key_decisions: ["outdentItem re-parents subsequent siblings as children of the outdented item, matching standard outliner behavior", "toggleCollapse is allowed on leaf nodes — collapse state is harmless and simplifies the API"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran npx vitest run src/core/api.test.ts --reporter=verbose — all 42 tests pass (13 from T01 + 29 new)."
completed_at: 2026-03-26T02:36:58.565Z
blocker_discovered: false
---

# T02: Added 29 comprehensive tests for tree manipulation, navigation, and state operations plus fixed outdentItem sibling re-parenting

> Added 29 comprehensive tests for tree manipulation, navigation, and state operations plus fixed outdentItem sibling re-parenting

## What Happened
---
id: T02
parent: S01
milestone: M001
key_files:
  - src/core/api.test.ts
  - src/core/api.ts
key_decisions:
  - outdentItem re-parents subsequent siblings as children of the outdented item, matching standard outliner behavior
  - toggleCollapse is allowed on leaf nodes — collapse state is harmless and simplifies the API
duration: ""
verification_result: passed
completed_at: 2026-03-26T02:36:58.567Z
blocker_discovered: false
---

# T02: Added 29 comprehensive tests for tree manipulation, navigation, and state operations plus fixed outdentItem sibling re-parenting

**Added 29 comprehensive tests for tree manipulation, navigation, and state operations plus fixed outdentItem sibling re-parenting**

## What Happened

Wrote comprehensive tests for the riskiest tree operations: 6 indent tests, 5 outdent tests, 4 move tests, 8 cursor navigation tests, 4 toggle tests, 1 deep collapse test, and 1 sort order stability test. The outdent sibling re-parenting test revealed that outdentItem was not re-parenting subsequent siblings — fixed the implementation to match standard outliner behavior (WorkFlowy, Dynalist). All 42 tests pass.

## Verification

Ran npx vitest run src/core/api.test.ts --reporter=verbose — all 42 tests pass (13 from T01 + 29 new).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx vitest run src/core/api.test.ts --reporter=verbose` | 0 | ✅ pass | 1490ms |


## Deviations

Fixed outdentItem in api.ts to re-parent subsequent siblings as children of the outdented item — test exposed missing behavior from T01. Adjusted sort order test expectations to match corrected behavior.

## Known Issues

None.

## Files Created/Modified

- `src/core/api.test.ts`
- `src/core/api.ts`


## Deviations
Fixed outdentItem in api.ts to re-parent subsequent siblings as children of the outdented item — test exposed missing behavior from T01. Adjusted sort order test expectations to match corrected behavior.

## Known Issues
None.
