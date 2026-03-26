# Knowledge

## K001: fraci generateKeyBetween returns a Generator, not a value
- `const [key] = fraci.generateKeyBetween(a, b)` — destructure the first yielded value
- The branded `FractionalIndex` type requires casting when storing as plain string in Keystone models: `key as string` going in, `sortOrder as SortOrderIndex` coming out
- String comparison (`<`, `>`) gives correct ordering for fraci-generated keys

## K002: All core API functions use (state, um, ...args) signature
- Every user-facing API function takes `(state: AppState, um: UndoManager, ...args)` and wraps mutations in `um.withGroup()`
- This ensures compound operations (e.g. insertBelow = create item + set sortOrder + move cursor) undo as a single step
- Cursor/editing state is restored via `attachedState` in the undo middleware — no manual cursor save/restore needed
- Follow this pattern for any new API functions added in later slices

## K003: mobx-keystone undo stack and undo() interaction
- Calling `um.undo()` pops the last entry from the undo stack and pushes it to the redo stack
- An undo of operation X is NOT itself recorded as a new undo entry — it restores state and moves X to redo
- When tracing undo chains in tests, count backwards from the top of the undo stack, not from the last user action

## K004: React hooks that need MobX context require a wrapper component
- A component that creates and provides a React context (e.g. `<OutlineProvider>`) cannot also call `useContext()` for that same context — the provider isn't in its own ancestor tree
- Solution: introduce a thin wrapper component (e.g. `KeyboardHandlerHost`) rendered inside the provider that calls the hook consuming the context
- This pattern recurs any time a hook needs state from a context that's created in the same top-level component

## K005: Edit-mode blur handler needs double-commit guard
- When Escape or Enter already commits content and calls `stopEditing()`, the input unmounts and fires a blur event
- Without a guard (`if (state.editingItemId !== itemId) return`), blur re-commits stale content
- Always check whether the item is still being edited before committing in blur handlers

## K006: Use border-transparent on non-selected rows to prevent layout shift
- When using a visible border (e.g. `border-l-2 border-amber`) on selected items, non-selected items must have `border-l-2 border-transparent` — not no border at all
- Without the transparent border, toggling selection adds/removes 2px of space, causing all item content to shift horizontally
- This applies to any conditional border used for selection/focus indicators

## K007: Use fromSnapshot (not applySnapshot) when hydrating from IndexedDB
- `fromSnapshot<AppState>(snapshot)` creates a fresh Keystone tree — use this for initial load
- `applySnapshot` mutates an existing tree and conflicts with `registerRootStore` + undo middleware setup
- The snapshot from IDB must include `$modelType` metadata (Keystone adds this automatically via `getSnapshot`)
- After hydrating: `registerRootStore(state)` → `setupUndo(state)` → `clearUndo()` → wire `onSnapshot` listener
- Wire `onSnapshot` AFTER bootstrap completes to prevent re-saving during the load itself

## K008: UUID IDs require dynamic test assertions
- After switching from sequential `item-N` to `crypto.randomUUID()`, tests cannot use hardcoded ID strings
- Pattern: capture the ID from the returned value (`const id = insertBelow(...)`) then assert against that
- Any test using `toBe('item-1')` or similar will break — use `toBeDefined()` + dynamic references instead
