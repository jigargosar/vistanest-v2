# S04: Persistence + Export

**Goal:** Data survives page refresh via IndexedDB auto-save. User can export all data as a JSON file download. First-time users see a pre-populated demo list.
**Demo:** After this: After this: data survives page refresh via IndexedDB auto-save. User can export all data as a JSON file download. First-time users see a pre-populated demo list.

## Tasks
- [x] **T01: Created IndexedDB persistence module with save/load/export, switched to UUID IDs, and fixed all tests across 4 files** — Create `src/core/persistence.ts` with IndexedDB open/save/load using the `idb` package (already installed). Switch `generateId()` from sequential `item-N` to `crypto.randomUUID()` to prevent ID collisions after reload. Fix the one test assertion in `api.test.ts` that checks `toBe('item-1')`. Install `fake-indexeddb` as dev dependency and write persistence round-trip tests.

This is the foundation — auto-save, loading, and export all depend on this module working correctly.
  - Estimate: 45m
  - Files: src/core/persistence.ts, src/core/persistence.test.ts, src/core/api.ts, src/core/api.test.ts, package.json
  - Verify: pnpm test && pnpm typecheck
- [x] **T02: Wired async App bootstrap with IDB loading, debounced auto-save, and rich demo seed for first-time users** — Restructure `App.tsx` to load state from IndexedDB on mount (async), seed a rich demo list if IDB is empty (first-run experience), and wire `onSnapshot` with debounced auto-save (~2s). The demo seed should be a multi-level welcome outline with keyboard shortcut hints.

Key constraints:
- Show a loading state while IDB loads
- Attach `onSnapshot` listener AFTER initial load completes (prevents re-saving during load)
- Call `registerRootStore` + `setupUndo` on the loaded state, then `clearUndo()` so load isn't undoable
- Handle IDB load errors gracefully — fall back to demo seed with console.warn
- The `fromSnapshot<AppState>()` call needs the snapshot to include `$modelType` metadata

This task delivers R007 (auto-save / data survives refresh).
  - Estimate: 1h
  - Files: src/ui/App.tsx, src/core/api.ts, src/core/persistence.ts, src/core/persistence.test.ts
  - Verify: pnpm test && pnpm typecheck
- [x] **T03: Added downloadExportJson to persistence.ts and wired an Export button with download icon in the Topbar — all 91 tests pass, zero type errors** — Add an `exportJson` function to `persistence.ts` that creates a JSON Blob from `getSnapshot(state)` and triggers a browser download. Wire it to an Export button in the Topbar. Write a unit test for the export function.

This task delivers R008 (JSON export).

The export button should:
- Be placed in the Topbar next to the help button
- Use a download icon or text label
- Call `getSnapshot(state)` → JSON.stringify → Blob → URL.createObjectURL → click hidden anchor
- File name: `vistanest-export-{ISO date}.json`

Final verification: run full test suite and typecheck to confirm all existing + new tests pass.
  - Estimate: 30m
  - Files: src/core/persistence.ts, src/core/persistence.test.ts, src/ui/Topbar.tsx, src/ui/context.ts
  - Verify: pnpm test && pnpm typecheck
