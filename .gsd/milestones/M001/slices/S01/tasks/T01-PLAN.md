---
estimated_steps: 29
estimated_files: 3
skills_used: []
---

# T01: Define Keystone models and implement full core API with CRUD tests

Build the complete data model and core API for the outliner. This is the foundation — every subsequent task and slice depends on these exports.

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

## Inputs

- `package.json`
- `tsconfig.json`
- `vitest.config.ts`

## Expected Output

- `src/core/model.ts`
- `src/core/api.ts`
- `src/core/api.test.ts`

## Verification

pnpm typecheck && npx vitest run src/core/api.test.ts --reporter=verbose
