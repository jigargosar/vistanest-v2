---
estimated_steps: 23
estimated_files: 2
skills_used: []
---

# T02: Wire navigation-mode keyboard handler with full shortcut map

Create a useKeyboardHandler custom hook that attaches a document-level keydown listener and dispatches navigation-mode shortcuts to core API functions. This task delivers the bulk of R003 (keyboard navigation).

The hook reads state.editingItemId to determine mode: when null, single keys are shortcuts; when non-null, keys should pass through to the input (edit mode handling is T03). The keydown handler must be inside a useEffect with proper cleanup to avoid double-binding in React 19 StrictMode.

Navigation-mode key map:
- j / ArrowDown → moveCursorDown(state, um)
- k / ArrowUp → moveCursorUp(state, um)
- o → insertBelow(state, um, cursorItemId) then startEditing(state, um, newId)
- O (Shift+o) → insertAbove(state, um, cursorItemId) then startEditing(state, um, newId)
- Tab → indentItem(state, um, cursorItemId) — must preventDefault()
- Shift+Tab → outdentItem(state, um, cursorItemId) — must preventDefault()
- Space → toggleComplete(state, um, cursorItemId) — must preventDefault()
- h / l → toggleCollapse(state, um, cursorItemId)
- Backspace → archiveItem(state, um, cursorItemId) only when item content is empty
- Enter → startEditing(state, um, cursorItemId)
- Ctrl+z → undo(um)
- Ctrl+Shift+z → redo(um)
- Ctrl+ArrowUp → moveItemUp(state, um, cursorItemId)
- Ctrl+ArrowDown → moveItemDown(state, um, cursorItemId)

Key constraints:
- preventDefault() on Tab, Space, and Shift+Tab to block browser defaults
- Read state.editingItemId imperatively inside the handler (MobX observable, but handler runs outside React render — just read the value directly, no autorun needed)
- Guard all API calls on cursorItemId being non-null
- The hook is called from App.tsx, not from individual item components
- archiveItem on Backspace: only when the cursor item's content is empty string

## Inputs

- ``src/core/api.ts` — all navigation API functions: moveCursorUp/Down, insertBelow/Above, indentItem, outdentItem, moveItemUp/Down, toggleComplete, toggleCollapse, archiveItem, startEditing, undo, redo`
- ``src/ui/context.ts` — useAppState() hook providing state and undoManager`
- ``src/ui/App.tsx` — from T01, renders OutlineView with context provider`

## Expected Output

- ``src/ui/useKeyboardHandler.ts` — custom hook with document keydown listener, full navigation-mode shortcut map, proper useEffect cleanup`
- ``src/ui/App.tsx` — updated to call useKeyboardHandler()`

## Verification

pnpm typecheck && pnpm test
