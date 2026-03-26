---
id: T02
parent: S03
milestone: M001
provides: []
requires: []
affects: []
key_files: ["src/ui/Topbar.tsx", "src/ui/StatusBar.tsx", "src/ui/App.tsx"]
key_decisions: ["Used z-20 for both fixed bars to stay above content without conflicting with future modals", "StatusBar derives counts inline via items.values() iteration — no computed getters added to AppState", "Topbar search input and nav links are disabled placeholders — no event handlers wired"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "pnpm typecheck passed (tsc --noEmit, zero errors). pnpm test passed (81/81 tests across 3 files). No regressions from layout restructuring."
completed_at: 2026-03-26T03:15:21.818Z
blocker_discovered: false
---

# T02: Built three-zone layout shell with fixed Topbar (Space Grotesk logo, search/nav placeholders) and MobX-observed StatusBar (mode indicator, item counts, keyboard hints)

> Built three-zone layout shell with fixed Topbar (Space Grotesk logo, search/nav placeholders) and MobX-observed StatusBar (mode indicator, item counts, keyboard hints)

## What Happened
---
id: T02
parent: S03
milestone: M001
key_files:
  - src/ui/Topbar.tsx
  - src/ui/StatusBar.tsx
  - src/ui/App.tsx
key_decisions:
  - Used z-20 for both fixed bars to stay above content without conflicting with future modals
  - StatusBar derives counts inline via items.values() iteration — no computed getters added to AppState
  - Topbar search input and nav links are disabled placeholders — no event handlers wired
duration: ""
verification_result: passed
completed_at: 2026-03-26T03:15:21.824Z
blocker_discovered: false
---

# T02: Built three-zone layout shell with fixed Topbar (Space Grotesk logo, search/nav placeholders) and MobX-observed StatusBar (mode indicator, item counts, keyboard hints)

**Built three-zone layout shell with fixed Topbar (Space Grotesk logo, search/nav placeholders) and MobX-observed StatusBar (mode indicator, item counts, keyboard hints)**

## What Happened

Created Topbar.tsx with Space Grotesk amber logo, disabled search input with / kbd hint, disabled Due/Tags/Lists nav links, help button, and avatar placeholder. Created StatusBar.tsx as a MobX observer reading editingItemId for NAVIGATE/EDIT mode, iterating items.values() for non-archived and completed counts, and showing contextual shortcut hints. Restructured App.tsx into fixed topbar → scrollable 900px-centered content area → fixed status bar, preserving all existing logic unchanged.

## Verification

pnpm typecheck passed (tsc --noEmit, zero errors). pnpm test passed (81/81 tests across 3 files). No regressions from layout restructuring.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `pnpm typecheck` | 0 | ✅ pass | 3400ms |
| 2 | `pnpm test` | 0 | ✅ pass | 3400ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/ui/Topbar.tsx`
- `src/ui/StatusBar.tsx`
- `src/ui/App.tsx`


## Deviations
None.

## Known Issues
None.
