# S02: Keyboard-Driven Interaction

**Goal:** User can navigate and manipulate an outline entirely via keyboard in the browser — j/k cursor, o/O insert, Tab/Shift+Tab indent/outdent, Space complete, h/l collapse, Backspace archive, Ctrl+Z undo, Enter/Esc edit mode — with the UI rendering MobX state reactively.
**Demo:** After this: After this: user can navigate with j/k, insert items with o/O, edit inline with Enter/Esc, indent with Tab, complete with Space, archive with Backspace on empty, undo with Ctrl+Z — all in the browser. UI is functional but unstyled.

## Tasks
- [x] **T01: Added React ↔ MobX wiring layer with context provider, OutlineView/OutlineItemRow observer components, getDepth() utility, and seeded initial items** — Create the React ↔ MobX wiring layer: a context provider for AppState/UndoManager, an OutlineView component that renders getVisibleItems() as a flat list, and an OutlineItemRow component that shows content with depth-based indentation and cursor highlighting. Add a getDepth() utility to model.ts. Seed an initial item so there's something to see. This proves the MobX observer pipeline works before adding keyboard interaction.

Components must be wrapped in mobx-react-lite observer() to re-render on MobX state changes. getVisibleItems() already returns a flat DFS-ordered list respecting collapse/archive, so rendering is a simple map — no recursive component tree needed. Depth-based left padding comes from walking the parentId chain via the new getDepth() utility.

Key constraints:
- All components reading MobX state must be observer() wrapped
- Use React context (not prop drilling) for state/undoManager
- Seed at least 3 items (2 root + 1 child) so depth indentation and cursor movement are visually verifiable
- Cursor highlight: apply a distinct background class to the item matching state.cursorItemId
- Collapse chevron: show a toggle indicator on items that have children
- Checkbox: show completed state visually (strikethrough or checkbox indicator)
  - Estimate: 45m
  - Files: src/ui/context.ts, src/ui/OutlineView.tsx, src/ui/OutlineItemRow.tsx, src/ui/App.tsx, src/core/model.ts
  - Verify: pnpm typecheck && pnpm test
- [x] **T02: Created useKeyboardHandler hook with document-level keydown listener dispatching 16 navigation-mode shortcuts to core API, plus 14 tests covering all keybindings** — Create a useKeyboardHandler custom hook that attaches a document-level keydown listener and dispatches navigation-mode shortcuts to core API functions. This task delivers the bulk of R003 (keyboard navigation).

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
  - Estimate: 40m
  - Files: src/ui/useKeyboardHandler.ts, src/ui/App.tsx
  - Verify: pnpm typecheck && pnpm test
- [x] **T03: Add inline edit mode to OutlineItemRow with Enter/Esc/blur commit flow and 7 tests** — Add edit mode to OutlineItemRow and update the keyboard handler to handle edit-mode keys. This task closes R004 (inline editing).

When state.editingItemId matches the item's ID, OutlineItemRow renders an <input> instead of static text. The input:
- Auto-focuses on mount (use ref callback: ref={el => el?.focus()})
- Tracks value in local React state (useState), initialized from item.content
- On Escape: commit content via setContent(state, um, itemId, localValue), then stopEditing(state, um)
- On Enter: commit content, stopEditing, then insertBelow(state, um, itemId) + startEditing(state, um, newId) — creating a new item below in edit mode
- On blur: commit content, stopEditing — handles clicking away

The keyboard handler (useKeyboardHandler) needs edit-mode awareness:
- When editingItemId is non-null, the handler should NOT intercept regular keys (they go to the input)
- Only intercept Escape and Enter in edit mode (they trigger the commit flow above)
- Actually, Escape and Enter are handled by the input's onKeyDown, not the document handler — the document handler just needs to bail early when editingItemId is non-null

Key constraints:
- Content commit is a single undo group: setContent + stopEditing in one withGroup, or done as separate calls (setContent already wraps in withGroup, stopEditing does too — this is fine, they'll be separate undo entries but that's acceptable for S02)
- Enter in edit mode must: (1) save current content, (2) stop editing, (3) insert new item below, (4) start editing new item. The new item ID comes from insertBelow's return value.
- Ctrl+Z while editing should be allowed through to the input (browser undo for text) — the document handler already bails when editingItemId is set, so this works naturally
- The input should have no border/background to look inline (minimal styling — full design is S03)
  - Estimate: 40m
  - Files: src/ui/OutlineItemRow.tsx, src/ui/useKeyboardHandler.ts
  - Verify: pnpm typecheck && pnpm test
