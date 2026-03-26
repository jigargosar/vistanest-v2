---
estimated_steps: 8
estimated_files: 4
skills_used: []
---

# T02: Wire async App bootstrap with IDB loading, auto-save, and demo seed

Restructure `App.tsx` to load state from IndexedDB on mount (async), seed a rich demo list if IDB is empty (first-run experience), and wire `onSnapshot` with debounced auto-save (~2s). The demo seed should be a multi-level welcome outline with keyboard shortcut hints.

Key constraints:
- Show a loading state while IDB loads
- Attach `onSnapshot` listener AFTER initial load completes (prevents re-saving during load)
- Call `registerRootStore` + `setupUndo` on the loaded state, then `clearUndo()` so load isn't undoable
- Handle IDB load errors gracefully — fall back to demo seed with console.warn
- The `fromSnapshot<AppState>()` call needs the snapshot to include `$modelType` metadata

This task delivers R007 (auto-save / data survives refresh).

## Inputs

- ``src/core/persistence.ts` — saveState/loadState functions from T01`
- ``src/core/api.ts` — createAppState, setupUndo, and other API functions`
- ``src/core/model.ts` — AppState model for fromSnapshot usage`
- ``src/ui/App.tsx` — current synchronous bootstrap to restructure`

## Expected Output

- ``src/ui/App.tsx` — async bootstrap: load from IDB → seed if empty → render. onSnapshot auto-save wired with ~2s debounce. Loading state shown during IDB load.`
- ``src/core/api.ts` — new `loadAppState(snapshot)` function that calls fromSnapshot + registerRootStore + setupUndo`
- ``src/core/persistence.ts` — possible additions for snapshot type helpers if needed`
- ``src/core/persistence.test.ts` — additional tests for auto-save debounce behavior and demo seed on empty DB`

## Verification

pnpm test && pnpm typecheck
