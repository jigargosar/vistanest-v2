---
estimated_steps: 2
estimated_files: 5
skills_used: []
---

# T01: Create persistence module, switch to UUID IDs, and write round-trip tests

Create `src/core/persistence.ts` with IndexedDB open/save/load using the `idb` package (already installed). Switch `generateId()` from sequential `item-N` to `crypto.randomUUID()` to prevent ID collisions after reload. Fix the one test assertion in `api.test.ts` that checks `toBe('item-1')`. Install `fake-indexeddb` as dev dependency and write persistence round-trip tests.

This is the foundation — auto-save, loading, and export all depend on this module working correctly.

## Inputs

- ``src/core/api.ts` — contains `generateId()` and `createAppState()` that need modification`
- ``src/core/model.ts` — AppState and OutlineItem models (read-only, needed for snapshot types)`
- ``src/core/api.test.ts` — has one `toBe('item-1')` assertion to fix`
- ``package.json` — needs `fake-indexeddb` added as dev dependency`

## Expected Output

- ``src/core/persistence.ts` — new module with openDB, saveState, loadState functions using idb wrapper`
- ``src/core/persistence.test.ts` — round-trip tests: save snapshot → load → compare; load from empty DB returns null; error handling`
- ``src/core/api.ts` — generateId switched to crypto.randomUUID(), _resetIdCounter removed or made no-op`
- ``src/core/api.test.ts` — fixed toBe('item-1') assertion to not assert literal ID string`
- ``package.json` — fake-indexeddb added to devDependencies`

## Verification

pnpm test && pnpm typecheck
