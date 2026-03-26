# S02: Keyboard-Driven Interaction — Research

**Date:** 2026-03-26

## Summary

S02 wires the proven core API (15+ functions, 57 tests) into a React UI with keyboard-driven interaction. The work is straightforward React + MobX integration — no unfamiliar technology, no risky integrations. The core API already handles all state mutations, cursor management, and undo/redo; the UI layer is a thin shell that renders observable state and dispatches keyboard events to API calls.

The primary requirements are **R003** (keyboard navigation: j/k, o/O, Tab, Space, Ctrl+Z) and **R004** (inline editing: Enter/Esc). Both are well-defined in the design spec and map directly to existing API functions. The keyboard handler needs two contexts: navigation mode (single keys → API calls) and edit mode (typing, only Enter/Esc intercepted). No keyboard combo library is needed for S02's scope — double-letter combos are deferred to M002.

The rendering model is simpler than it might appear: `getVisibleItems()` already returns a flattened DFS-ordered list (respecting collapse state and archive filtering), so the outline renders as a flat `map()` with depth-based indentation — no recursive component tree.

## Recommendation

Build as three units: (1) React shell with MobX wiring + basic item rendering, (2) keyboard handler for navigation mode, (3) edit mode with inline input. Each builds on the previous and can be verified independently in the browser.

Use a document-level `keydown` listener (not a library) for keyboard handling. The context switch between navigation and edit mode is driven by `state.editingItemId` — when null, single keys are shortcuts; when non-null, keys type text. This is the simplest approach for S02's scope and avoids adding a dependency for functionality that doesn't need it.

For inline editing, track input value in local React state during the edit session, then commit to `setContent()` on exit (Enter/Esc/blur) as a single undo group. This avoids per-keystroke undo entries and matches standard outliner editing behavior.

Skip `@testing-library/react` — it's not installed and the slice verification is browser-based. The core API is already thoroughly tested; the UI layer's job is wiring, best verified by interactive browser testing.

## Implementation Landscape

### Key Files

- `src/core/model.ts` — AppState and OutlineItem Keystone models. Read-only for S02 — provides `getVisibleItems()`, `getChildren()`, `cursorItemId`, `editingItemId`. May need a `getDepth(itemId)` utility (walk parentId chain to root).
- `src/core/api.ts` — All 15+ API functions. S02 calls these from the keyboard handler: `moveCursorUp/Down`, `insertBelow/Above`, `indentItem`, `outdentItem`, `moveItemUp/Down`, `toggleComplete`, `toggleCollapse`, `archiveItem`, `startEditing`, `stopEditing`, `setContent`, `undo`, `redo`. The `createAppState()` bootstrap is the entry point.
- `src/ui/App.tsx` — Currently a bare shell. Becomes the root: creates AppState + UndoManager, provides via React context, attaches document-level keyboard handler, renders OutlineView.
- `src/ui/OutlineView.tsx` — **New.** Renders `state.getVisibleItems()` as a flat list of OutlineItemRow components. Each item gets depth-based left padding.
- `src/ui/OutlineItemRow.tsx` — **New.** Single item row: indent padding, collapse chevron (if has children), checkbox, content display (text or input in edit mode), cursor highlight (background color on selected item).
- `src/ui/context.ts` — **New.** React context for `{ state: AppState, um: UndoManager }`. Small file, used by all UI components.
- `src/ui/useKeyboardHandler.ts` — **New.** Custom hook: `useEffect` with document `keydown` listener. Reads `state.editingItemId` to determine mode. Returns nothing — side-effect only.

### Keyboard Mapping (Navigation Mode — editingItemId is null)

| Key | Action | API Call |
|-----|--------|----------|
| `j` / `ArrowDown` | Cursor down | `moveCursorDown(state, um)` |
| `k` / `ArrowUp` | Cursor up | `moveCursorUp(state, um)` |
| `o` | Insert below + edit | `insertBelow(state, um, cursorItemId)` → `startEditing(state, um, newId)` |
| `O` (Shift+o) | Insert above + edit | `insertAbove(state, um, cursorItemId)` → `startEditing(state, um, newId)` |
| `Tab` | Indent | `indentItem(state, um, cursorItemId)` — must `preventDefault()` |
| `Shift+Tab` | Outdent | `outdentItem(state, um, cursorItemId)` — must `preventDefault()` |
| `Space` | Toggle complete | `toggleComplete(state, um, cursorItemId)` — must `preventDefault()` |
| `h` / `l` | Toggle collapse | `toggleCollapse(state, um, cursorItemId)` |
| `Backspace` | Archive (if empty content) | `archiveItem(state, um, cursorItemId)` — only when item content is empty |
| `Enter` | Start editing | `startEditing(state, um, cursorItemId)` |
| `Ctrl+z` | Undo | `undo(um)` |
| `Ctrl+Shift+z` | Redo | `redo(um)` |
| `Ctrl+ArrowUp` | Move item up | `moveItemUp(state, um, cursorItemId)` |
| `Ctrl+ArrowDown` | Move item down | `moveItemDown(state, um, cursorItemId)` |

### Keyboard Mapping (Edit Mode — editingItemId is non-null)

| Key | Action |
|-----|--------|
| `Escape` | Commit content → `setContent()` → `stopEditing()` |
| `Enter` | Commit content → `setContent()` → `stopEditing()` → `insertBelow()` → `startEditing(newId)` |
| All others | Normal text input — do not intercept |

### Build Order

1. **React shell + context + basic rendering** — Create `context.ts`, refactor `App.tsx` to bootstrap AppState/UndoManager and provide via context, create `OutlineView.tsx` and `OutlineItemRow.tsx` that render visible items with cursor highlight. Add a `getDepth()` utility. Seed one initial item so there's something to see. **Verify:** `pnpm dev` shows a list of items with cursor highlighting.

2. **Keyboard handler (navigation mode)** — Create `useKeyboardHandler.ts` with the full navigation-mode key map. Wire into App. **Verify:** j/k moves cursor, o inserts below, Tab indents, Space completes, Ctrl+Z undoes — all in browser.

3. **Edit mode** — Add edit state to `OutlineItemRow` (input field when `editingItemId` matches, auto-focus, local value state). Add edit-mode handling to keyboard handler (Enter/Esc in edit context). **Verify:** Enter opens edit, type text, Esc saves, Enter in edit creates new item below in edit mode.

This order de-risks progressively: step 1 proves MobX→React rendering works, step 2 proves keyboard→API wiring, step 3 adds the most complex interaction (input focus management, content commit timing).

### Verification Approach

Primary verification is **browser-based interactive testing** via `pnpm dev`:

1. Open app → see outline items rendered with cursor on first item
2. Press j/k → cursor moves up/down through visible items
3. Press o → new item appears below, enters edit mode
4. Type text → text appears in input
5. Press Esc → text saved, exits to navigation mode
6. Press Enter on item → enters edit mode
7. Press Enter while editing → saves, creates new item below in edit mode
8. Press Tab → item indents (becomes child of previous sibling)
9. Press Shift+Tab → item outdents
10. Press Space → item toggles complete state (visual indicator)
11. Press Backspace on empty item → item archived, cursor moves
12. Press Ctrl+Z → last operation undone
13. Press Ctrl+Shift+Z → operation redone

Secondary: `pnpm typecheck` passes with 0 errors. Existing 57 core tests still pass (`pnpm test`).

## Constraints

- `mobx-react-lite` `observer()` requires components to be wrapped — all components reading MobX state must be observer components, or they won't re-render on state changes.
- `experimentalDecorators: true` is already set in tsconfig (required by Keystone).
- The keyboard handler must `preventDefault()` on Tab (browser would move focus) and Space (browser would scroll). Other keys like j/k don't need it in navigation mode.
- React 19 `StrictMode` double-invokes effects in dev — the keyboard handler `useEffect` cleanup must properly remove the listener to avoid double-binding.
- `editingItemId` in AppState is a MobX observable — reading it inside the keydown handler requires either accessing it directly (since the handler runs outside React render) or using `autorun`/reaction. The simplest approach: read `state.editingItemId` inside the handler closure — MobX tracks it because it's accessed during the handler call, but since `useEffect` doesn't auto-track, the handler should just read the current value imperatively on each keydown.

## Common Pitfalls

- **MobX observer boundary** — If a parent component is an observer but a child isn't, the child won't re-render when its props (derived from MobX state) change. Every component that reads observable state — even indirectly via props derived from observables — should be an observer, OR the parent should read the values and pass primitives.
- **Input focus management** — When entering edit mode, the input must auto-focus. Using `useEffect` + `ref.current.focus()` can race with React's render cycle. Use a `ref` callback or `autoFocus` prop. The ref callback approach (`ref={el => el?.focus()}`) is most reliable.
- **Tab key in edit mode** — Tab should indent in navigation mode but should be allowed to work normally (or be handled for indentation) in edit mode. For S02, simplest approach: Tab in edit mode is ignored (normal browser behavior — leaves the field). Can be enhanced later.
- **Undo during editing** — If the user presses Ctrl+Z while editing, it should undo the last navigation-mode action, not the in-progress text. Since we track edit content in local React state and only commit on save, Ctrl+Z during edit naturally undoes the last committed action. This is correct behavior.
