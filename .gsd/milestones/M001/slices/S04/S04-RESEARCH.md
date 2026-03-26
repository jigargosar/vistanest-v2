# S04: Persistence + Export — Research

**Date:** 2026-03-26

## Summary

This slice adds IndexedDB auto-save, JSON export, and a first-run demo list. All three features are straightforward applications of well-understood patterns to the existing codebase.

MobX Keystone provides `getSnapshot(state)` and `fromSnapshot<AppState>(snapshot)` for lossless serialization — the snapshot is a plain JSON object containing all items, cursor, editing state, and title. The `idb` package (already installed) wraps IndexedDB with a promise-based API. Auto-save wires `onSnapshot(state, callback)` to a debounced IDB write. JSON export converts the same snapshot to a downloadable file. The demo list replaces the current hardcoded seed with a richer Checkvist-style welcome outline.

The main integration concerns are: (1) the App bootstrap must become async (load from IDB → seed if empty → render), (2) the sequential `generateId()` counter will collide after reload and needs to switch to UUIDs or a scan-and-advance strategy, and (3) `fake-indexeddb` is required for testing since jsdom doesn't provide IndexedDB.

## Recommendation

Build in three tasks: (1) persistence module (`src/core/persistence.ts`) handling IDB open/save/load and the ID generation fix, (2) App.tsx restructure for async loading with demo seed, (3) JSON export button + wiring. Each task is independently testable.

Use `crypto.randomUUID()` instead of sequential IDs — it's zero-state, collision-free, and requires no scan-on-load logic. This is a small change in `api.ts` (`generateId` becomes `() => crypto.randomUUID()`) but affects test assertions that match `item-1`, `item-2` patterns. Tests should stop asserting exact IDs and instead capture the returned ID.

## Implementation Landscape

### Key Files

- `src/core/api.ts` — `createAppState()` is the bootstrap function. `generateId()` needs to switch from sequential to UUID. Need a new `loadAppState(snapshot)` that calls `fromSnapshot<AppState>()` + `registerRootStore()` + `setupUndo()`.
- `src/core/model.ts` — `AppState` and `OutlineItem` models. No changes needed — `idProp` accepts any string, and all fields are already plain serializable types.
- `src/ui/App.tsx` — Currently uses `useMemo(() => seedInitialItems(), [])` for synchronous initialization. Must become async: show a loading state, attempt IDB load, seed if empty, then render the outline. The `onSnapshot` listener for auto-save should be set up here (or in a dedicated hook).
- `src/ui/context.ts` — No changes needed. `AppContext` interface already holds `{ state, undoManager }`.
- `src/core/persistence.ts` — **New file.** Houses `openDB`, `saveState(snapshot)`, `loadState()`, and `exportJson(snapshot)` functions.
- `src/core/api.test.ts` — 60 tests reference `item-1`, `item-2` etc. in assertions. These need updating after the UUID switch. Most tests capture the return value of `insertBelow`/`insertAbove` already, so the fix is mostly removing string-literal ID comparisons.

### Build Order

1. **T01: Persistence module + ID fix** — Create `src/core/persistence.ts` with IDB open/save/load. Switch `generateId()` to `crypto.randomUUID()`. Fix any broken test assertions. Install `fake-indexeddb` as a dev dependency. Write persistence round-trip tests (save snapshot → load → compare). This unblocks everything — auto-save and loading both depend on it.

2. **T02: Async App bootstrap + auto-save + demo seed** — Restructure `App.tsx` to load from IDB on mount (async), seed demo list if IDB is empty, wire `onSnapshot` with debounced auto-save (~2s). The demo list should be a richer version of the current seed — a welcome outline with keyboard shortcut hints across 2-3 levels. Add a loading state while IDB loads.

3. **T03: JSON export** — Add an export function that creates a Blob from `getSnapshot(state)`, generates a download link, and triggers it. Wire to a button in the Topbar or a keyboard shortcut. Test the export function produces valid JSON matching the snapshot shape.

### Verification Approach

- **Persistence round-trip**: Test that `saveState(getSnapshot(state))` → `loadState()` returns an identical snapshot. Use `fake-indexeddb` in vitest.
- **Auto-save**: Functional test — mutate state, wait for debounce, verify IDB contains updated snapshot.
- **UUID IDs**: Existing 60 core API tests must still pass after the `generateId` change. Run `pnpm test`.
- **JSON export**: Unit test that `exportJson` produces valid JSON string matching snapshot structure. Browser verification that clicking export triggers a download.
- **Demo seed**: Verify first load (empty IDB) shows the demo list. Second load (after mutations) shows persisted data, not demo.
- **Full cycle**: `pnpm test` — all tests pass (existing 81 + new persistence/export tests). `pnpm typecheck` clean.

## Constraints

- `jsdom` (vitest environment) does not provide IndexedDB — `fake-indexeddb` must be installed and configured as a vitest setup file or imported in test files.
- `crypto.randomUUID()` is available in modern browsers and Node 19+. In jsdom/vitest it should be available via Node's `crypto` global. If not, a polyfill or `globalThis.crypto` mock may be needed.
- The `onSnapshot` callback fires synchronously on every MobX action. The debounce must be outside the MobX transaction to avoid triggering IDB writes mid-batch.

## Common Pitfalls

- **ID counter collision after reload** — The current `generateId()` resets `_nextId = 1` on page load. If items `item-1` through `item-10` exist in IDB and the user creates a new item after reload, it gets `item-1` again → ObjectMap key collision. Switching to UUID eliminates this entirely.
- **Double onSnapshot during load** — When applying a loaded snapshot, `onSnapshot` fires, which would immediately re-save to IDB. The auto-save listener should be attached *after* the initial load completes, or use a flag to skip the first emission.
- **Undo manager and loaded state** — After loading from IDB, the undo history is empty (correct — we don't persist undo history). But `setupUndo` must be called *after* `registerRootStore` on the loaded state, and `clearUndo()` should be called to ensure no residual entries from the `fromSnapshot` process.
- **Test ID assertions** — Many existing tests assert `item.id === 'item-3'`. After switching to UUID these will break. Fix by capturing returned IDs and asserting on those, not string literals.

## Open Risks

- `fromSnapshot<AppState>()` may require the exact `$modelType` metadata in the snapshot. If snapshots are stored without it (or with a version mismatch after code changes), loading will fail. Need to handle this gracefully — fall back to demo seed on parse error.
- Future model schema changes (adding fields to OutlineItem) may break loading of old snapshots. Not a problem for M001 since there's no deployed version yet, but worth noting for future migration planning.
