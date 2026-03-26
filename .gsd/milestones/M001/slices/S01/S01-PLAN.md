# S01: Keystone Model + Core API

**Goal:** All tree operations work in tests — CRUD, indent/outdent, move, collapse, complete, archive, undo/redo with cursor restore. The core model and API are proven and ready for UI integration.
**Demo:** After this: After this: all tree operations work in tests — CRUD, indent/outdent, move, collapse, complete, archive, undo/redo with cursor restore. The riskiest technical unknowns (Keystone undo, single-parent tree ops, archive+undo composition) are proven.

## Tasks
- [x] **T01: Built OutlineItem/AppState Keystone models and complete core API with 13 passing CRUD+editing tests** — Build the complete data model and core API for the outliner. This is the foundation — every subsequent task and slice depends on these exports.

**Model (`src/core/model.ts`):**
- `OutlineItem` model with fields: `id` (idProp), `content` (string, default ''), `parentId` (string | null, default null), `sortOrder` (number, default 0), `isCompleted` (boolean, default false), `isCollapsed` (boolean, default false), `isArchived` (boolean, default false), `note` (string, default '')
- Each field gets a `@modelAction` setter: `setContent`, `setParentId`, `setSortOrder`, `setCompleted`, `setCollapsed`, `setArchived`, `setNote`
- `AppState` model with fields: `title` (string, default 'Untitled'), `items` (ObjectMap<OutlineItem>), `cursorItemId` (string | null, default null), `editingItemId` (string | null, default null)
- `@modelAction` setters: `setTitle`, `setCursor`, `setEditing`
- Query methods on AppState: `getItem(id)`, `getChildren(parentId)` (returns non-archived children sorted by sortOrder), `getSiblings(itemId)`, `getVisibleItems()` (recursive DFS respecting isCollapsed and isArchived)

**API (`src/core/api.ts`):**
- `createAppState()` — creates and registers root store, returns `{ state, undoManager }`
- `setupUndo(state)` — attaches undoMiddleware with `attachedState` for cursor/editing, returns UndoManager
- CRUD: `insertBelow(state, um, referenceId?)`, `insertAbove(state, um, referenceId?)`, `archiveItem(state, um, itemId)` (must cascade isArchived to all descendants), `setContent(state, um, itemId, content)`
- Editing: `startEditing(state, um, itemId)`, `stopEditing(state, um)`
- Tree ops: `indentItem(state, um, itemId)`, `outdentItem(state, um, itemId)`, `moveItemUp(state, um, itemId)`, `moveItemDown(state, um, itemId)`
- State: `toggleComplete(state, um, itemId)`, `toggleCollapse(state, um, itemId)`
- Navigation: `moveCursorUp(state, um)`, `moveCursorDown(state, um)`
- Undo: `undo(um)`, `redo(um)`
- Every user-facing function wraps mutations in `um.withGroup()` so compound operations are a single undo step
- `attachedState` in undoMiddleware saves/restores `cursorItemId` and `editingItemId`
- Cursor restore in undo callback uses `um.withoutUndo(() => state.setCursor(...))`

**Tests (`src/core/api.test.ts`):**
- Write tests for CRUD operations: createAppState returns valid state, insertBelow adds item and moves cursor, insertAbove adds item above reference, insertBelow with no items creates first item, archiveItem sets isArchived on target and all descendants, archiveItem moves cursor to nearest visible sibling, setContent updates item content
- Write tests for editing: startEditing/stopEditing set editingItemId correctly

**Key constraints from research:**
- `registerRootStore(state)` must be called before undo middleware works
- `ObjectMap` uses `.set(id, item)` / `.get(id)` / `.delete(id)` — snapshot has double-nesting `state.items.items`
- All mutations must be inside `@modelAction` methods
- `experimentalDecorators: true` is already in tsconfig
- `getChildren` must filter out archived items and sort by sortOrder
- `getVisibleItems` does recursive DFS: skip archived items, skip children of collapsed items
  - Estimate: 1h30m
  - Files: src/core/model.ts, src/core/api.ts, src/core/api.test.ts
  - Verify: pnpm typecheck && npx vitest run src/core/api.test.ts --reporter=verbose
- [x] **T02: Added 29 comprehensive tests for tree manipulation, navigation, and state operations plus fixed outdentItem sibling re-parenting** — Write thorough tests for the riskiest operations: indent/outdent (sort order recalculation, boundary conditions), move up/down, cursor navigation (especially with collapsed subtrees), toggleComplete, and toggleCollapse. These edge cases are where bugs will hide.

**Tests to add in `src/core/api.test.ts`:**

Indent tests:
- indentItem makes item the last child of its previous sibling (parentId changes, sortOrder is max+1 among new siblings)
- indentItem on first sibling (no previous sibling) is a no-op
- indentItem moves item's children along with it (children keep their parentId pointing to the indented item)
- indentItem cursor stays on the indented item

Outdent tests:
- outdentItem moves item to parent's parent, inserted after the old parent among grandparent's children
- outdentItem on top-level item (parentId === null) is a no-op
- outdentItem re-parents subsequent siblings of the outdented item as children of the outdented item
- outdentItem sort orders are recalculated correctly for all affected items

Move tests:
- moveItemUp swaps sortOrder with previous sibling
- moveItemUp on first sibling is a no-op
- moveItemDown swaps sortOrder with next sibling
- moveItemDown on last sibling is a no-op

Navigation tests:
- moveCursorDown moves to next visible item
- moveCursorUp moves to previous visible item
- moveCursorDown skips children of collapsed items
- moveCursorUp skips children of collapsed items
- moveCursorDown at last visible item is a no-op
- moveCursorUp at first visible item is a no-op
- cursor navigation skips archived items

State toggle tests:
- toggleComplete flips isCompleted
- toggleComplete on already-completed item uncompletes it
- toggleCollapse flips isCollapsed
- toggleCollapse on item with no children is a no-op or allowed (decide: allow it — collapse state is harmless on leaf nodes)

**Key edge cases to cover:**
- Indent when previous sibling is collapsed — item should still become its child
- Outdent with children — children of outdented item stay as its children
- Sort order gaps after multiple operations don't break ordering
- getVisibleItems correctly handles deeply nested collapsed trees (3+ levels)
  - Estimate: 1h
  - Files: src/core/api.test.ts
  - Verify: npx vitest run src/core/api.test.ts --reporter=verbose
- [x] **T03: Added 15 undo/redo tests and integration workflow test proving full API composition, plus migrated sortOrder to fraci fractional indexing** — Write undo/redo coverage for every operation and a large integration test that exercises a realistic user workflow. This is the capstone that proves the API composes correctly and retires the riskiest unknowns.

**Undo/redo tests to add in `src/core/api.test.ts`:**

- undo after insertBelow removes the item and restores cursor to previous position
- undo after archiveItem restores item (and descendants) with isArchived=false and restores cursor
- undo after indentItem restores original parentId and sortOrder
- undo after outdentItem restores original parentId and sortOrder
- undo after moveItemUp restores original sortOrder
- undo after toggleComplete restores original isCompleted
- undo after toggleCollapse restores original isCollapsed
- undo after setContent restores original content
- redo after undo re-applies the operation
- multiple undo steps work in correct LIFO order
- undo with no history is a no-op (doesn't throw)
- redo with no future is a no-op (doesn't throw)
- compound operations (insertBelow = addItem + setCursor) undo as one step
- cursor position is correctly restored on undo for every operation type

**Integration workflow test:**
A single large test that exercises a realistic session:
1. Create state, insert 5 items (A, B, C, D, E) at top level
2. Indent B and C under A (A has children B, C)
3. Indent D under C (C has child D)
4. Verify getVisibleItems returns correct order: A, B, C, D, E
5. Collapse A — verify getVisibleItems returns: A, E (B, C, D hidden)
6. Expand A — verify full list again
7. Complete item B — verify isCompleted
8. Archive item C — verify C and D are archived, visible items are A, B, E
9. Undo archive — verify C and D restored, cursor restored
10. Move E up — verify E is now before A (or after D, depending on top-level sort)
11. Undo 3 times — verify state rollback is consistent
12. Redo 2 times — verify state rolls forward correctly
13. Throughout: assert cursor is always pointing at a valid, visible, non-archived item

**Final verification: run full test suite and typecheck**
  - Estimate: 1h
  - Files: src/core/api.test.ts
  - Verify: pnpm typecheck && pnpm test
