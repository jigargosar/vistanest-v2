# S01: Keystone Model + Core API — Research

**Date:** 2026-03-26

## Summary

The design spec proposes nested `children: OutlineItem[]` for the tree structure. After spiking both approaches, **a flat `ObjectMap<OutlineItem>` with `parentId`/`sortOrder` fields is strictly superior** — it eliminates Keystone's single-parent `detach()` problem, produces sync-friendly ID-keyed patches instead of fragile array-index patches, and simplifies every tree operation to a property mutation.

All core mechanics were proven in spike tests (15 tests, all passing):
- Flat ObjectMap CRUD with `parentId`-based tree traversal
- `undoMiddleware` with `attachedState` for cursor/editing state restore
- `withGroup` batching compound operations (insert+cursor, indent, archive+cursor) into single undo steps
- Sync-friendly patches: `onPatches` emits paths like `["items","items","<itemId>"]` — string-keyed, not array-indexed
- Archive (soft-delete) composes cleanly with undo — archive then undo restores the item seamlessly

The `isCollapsed` flag lives on each item rather than a separate `collapsedIds` array — this is simpler, one fewer prop on AppState, and means collapse state is per-item (sync-friendly: no set-merge conflicts).

## Recommendation

Use the flat ObjectMap model with the encapsulated core API pattern from the phase 1 plan. Deviate from the spec in three ways:

1. **Flat map, not nested children** — `items: ObjectMap<OutlineItem>` with `parentId: string | null` and `sortOrder: number` instead of `children: OutlineItem[]`. This eliminates `detach()` entirely and makes patches sync-friendly.
2. **`isCollapsed` on item, not `collapsedIds` array** — simpler, per-item, no set data structure.
3. **Core API functions take `(state, undoManager)` and use `um.withGroup()`** — every user-facing operation (insertBelow, indent, archive, etc.) batches all mutations into a single undo step.

The UndoManager should **not** be stored in the model tree (keep it in-memory only) — undo history is session-local and should not be persisted or synced.

## Implementation Landscape

### Key Files

- `src/core/model.ts` — Keystone models: `OutlineItem` (with `id`, `content`, `parentId`, `sortOrder`, `isCompleted`, `isCollapsed`, `isArchived`, `note`) and `AppState` (with `title`, `items: ObjectMap<OutlineItem>`, `cursorItemId`, `editingItemId`). Each model has `@modelAction` setters for its own fields. `AppState` has computed-style methods: `getChildren(parentId)`, `getVisibleItems()`, `getSiblings(itemId)`, `getItem(id)`.
- `src/core/api.ts` — Encapsulated core API: ~15 exported functions. Each takes `(state, um)` and uses `um.withGroup()`. Functions: `createAppState`, `insertBelow`, `insertAbove`, `archiveItem`, `indentItem`, `outdentItem`, `moveItemUp`, `moveItemDown`, `moveCursorUp`, `moveCursorDown`, `toggleComplete`, `toggleCollapse`, `setContent`, `startEditing`, `stopEditing`, `undo`, `redo`. Also a `setupUndo(state)` factory that returns the `UndoManager`.
- `src/core/api.test.ts` — Comprehensive tests for every API function. Tests cover: happy path, edge cases (can't indent first item, can't outdent top-level, move at boundary), cursor invariants (cursor always valid after any operation), undo/redo for each operation, archive+undo composition.

### Build Order

**Task 1: Model definitions** (`model.ts`) — Define `OutlineItem` and `AppState` with all fields and `@modelAction` setters. This is the foundation everything depends on. Verification: typecheck passes.

**Task 2: Core API + tests — CRUD operations** (`api.ts`, `api.test.ts`) — Implement `createAppState`, `setupUndo`, `insertBelow`, `insertAbove`, `archiveItem`, `setContent`, `startEditing`, `stopEditing`. Write tests for each. This proves the fundamental read/write cycle and the undo pattern.

**Task 3: Core API + tests — tree manipulation** — Implement `indentItem`, `outdentItem`, `moveItemUp`, `moveItemDown`. These are the riskiest operations (sort order recalculation, boundary conditions). Write comprehensive tests including edge cases.

**Task 4: Core API + tests — navigation and state** — Implement `moveCursorUp`, `moveCursorDown`, `toggleComplete`, `toggleCollapse`, `undo`, `redo`. These are straightforward but need tests confirming cursor behavior with collapsed subtrees.

**Task 5: Integration test** — One large test that exercises a realistic workflow: create items, build a tree, indent/outdent, complete some, archive some, undo/redo multiple times, verify cursor state throughout. This proves the API hangs together.

**Why this order:** Task 1 is prerequisite for everything. Tasks 2-4 can technically be built in any order, but CRUD first lets Task 3 build on tested insert/archive. Task 5 is the integration proof that retires the riskiest unknowns.

### Verification Approach

```bash
# All tests pass
pnpm test

# Type checking passes
pnpm typecheck

# Specific test file
npx vitest run src/core/api.test.ts --reporter=verbose
```

Expected: 30+ tests covering every core API function, all passing. No browser needed — this slice is pure model/logic.

## Constraints

- `experimentalDecorators: true` is required in tsconfig for `@model` and `@modelAction` decorators — already set.
- All data mutations must happen inside `@modelAction` methods — Keystone throws if you mutate outside an action.
- `registerRootStore(state)` must be called exactly once per AppState instance before undo middleware or snapshots work.
- `ObjectMap` snapshots have a double-nesting: `state.items` is the ObjectMap, `state.items.items` is the underlying Record in the snapshot. This is a Keystone internal detail — the API surface uses `state.items.get(id)` / `state.items.set(id, item)`.
- The `attachedState.restore()` callback runs outside model actions — must wrap cursor restore in `um.withoutUndo(() => { state.setCursor(...) })`.

## Common Pitfalls

- **Forgetting `withGroup` on compound operations** — Without it, `insertBelow` (which does addItem + setCursor) would be two separate undo steps. Every user-facing API function must wrap in `um.withGroup()`.
- **Sort order gaps accumulating** — After many inserts/deletes, sort orders get sparse (0, 1, 5, 12...). This is fine for ordering but could eventually hit large numbers. A `rebalanceSortOrders` utility might be useful later but is not needed for M001.
- **Cursor pointing at archived item after undo of a subsequent operation** — If you archive item A, then insert item B, then undo insert B, the cursor should return to the item before B, not to archived A. The `attachedState` save/restore handles this because cursor is saved per-undo-step, but edge cases around archived items need test coverage.
- **`getVisibleItems` is O(n) per call** — It iterates all items and recursively builds the visible list. Fine for hundreds of items. For thousands, consider a cached computed. Not a concern for M001.

## Open Risks

- **Sort order recalculation on indent/outdent** — When indenting, the item becomes the last child of its new parent. When outdenting, it inserts after its old parent among the parent's siblings. Both require bumping sort orders of subsequent siblings. The spike proved the basic case, but multi-item moves (e.g., indent with children) need careful sort order management.
- **Archive cascading to children** — The spec says "archive an item." If item A has children B and C, does archiving A hide B and C too? With the flat map + `getChildren(parentId)` approach, children of an archived item are still in the map with `parentId` pointing to the archived item — `getChildren` filters by `isArchived` on the item itself, not on parents. So children of archived items would still appear if someone navigated to them. Decision needed: archive should probably cascade to descendants, or `getChildren` should walk up the parent chain. Recommend: cascade `isArchived` to all descendants in the `archiveItem` API function.
- **`idProp` format** — Keystone generates IDs like `"0-LTONjjCHgIg-ELQ3YdKmM"`. For sync, we may want UUIDs or ULIDs instead. `idProp` accepts custom ID generators. Not blocking for M001 but worth noting for sync milestone.

## Sources

- MobX Keystone docs: undoMiddleware with attachedState (source: [undoMiddleware.mdx](https://github.com/xaviergonz/mobx-keystone/blob/master/apps/site/docs/actionMiddlewares/undoMiddleware.mdx))
- MobX Keystone docs: ObjectMap collection model (source: [mapsSetsDates.mdx](https://github.com/xaviergonz/mobx-keystone/blob/master/apps/site/docs/mapsSetsDates.mdx))
- MobX Keystone docs: tree structure, detach, findParent (source: [treeLikeStructure.mdx](https://github.com/xaviergonz/mobx-keystone/blob/master/apps/site/docs/treeLikeStructure.mdx))
- MobX Keystone docs: patches, onPatches, JSON Patch format (source: [patches.mdx](https://github.com/xaviergonz/mobx-keystone/blob/master/apps/site/docs/patches.mdx))
- Spike tests: 15 passing tests validating flat ObjectMap + undo + patches approach (run locally, deleted after validation)
