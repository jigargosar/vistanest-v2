---
id: T02
parent: S04
milestone: M001
provides: []
requires: []
affects: []
key_files: ["src/ui/App.tsx", "src/core/api.ts", "src/core/persistence.test.ts"]
key_decisions: ["Used fromSnapshot<AppState> for hydration instead of applySnapshot — creates fresh tree cleanly supporting registerRootStore", "Wired onSnapshot listener AFTER bootstrap to prevent re-saving during load", "Rich demo seed with keyboard shortcut hints under Welcome and Try-it-out sections"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran pnpm test — all 90 tests pass (60 api, 9 persistence, 14 keyboard, 7 outline row). Ran pnpm typecheck — zero type errors."
completed_at: 2026-03-26T03:33:25.407Z
blocker_discovered: false
---

# T02: Wired async App bootstrap with IDB loading, debounced auto-save, and rich demo seed for first-time users

> Wired async App bootstrap with IDB loading, debounced auto-save, and rich demo seed for first-time users

## What Happened
---
id: T02
parent: S04
milestone: M001
key_files:
  - src/ui/App.tsx
  - src/core/api.ts
  - src/core/persistence.test.ts
key_decisions:
  - Used fromSnapshot<AppState> for hydration instead of applySnapshot — creates fresh tree cleanly supporting registerRootStore
  - Wired onSnapshot listener AFTER bootstrap to prevent re-saving during load
  - Rich demo seed with keyboard shortcut hints under Welcome and Try-it-out sections
duration: ""
verification_result: passed
completed_at: 2026-03-26T03:33:25.413Z
blocker_discovered: false
---

# T02: Wired async App bootstrap with IDB loading, debounced auto-save, and rich demo seed for first-time users

**Wired async App bootstrap with IDB loading, debounced auto-save, and rich demo seed for first-time users**

## What Happened

Added loadAppState(snapshot) to api.ts using fromSnapshot for clean hydration from saved snapshots. Rewrote App.tsx from synchronous useMemo to async useEffect bootstrap: loads from IDB, falls back to demo seed on empty/error, shows loading spinner, then wires onSnapshot with 2s debounced auto-save. Demo seed creates a multi-level outline with keyboard shortcut hints. Added 3 new persistence tests for the hydration path.

## Verification

Ran pnpm test — all 90 tests pass (60 api, 9 persistence, 14 keyboard, 7 outline row). Ran pnpm typecheck — zero type errors.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `pnpm test` | 0 | ✅ pass | 3480ms |
| 2 | `pnpm typecheck` | 0 | ✅ pass | 4200ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/ui/App.tsx`
- `src/core/api.ts`
- `src/core/persistence.test.ts`


## Deviations
None.

## Known Issues
None.
