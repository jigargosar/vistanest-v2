---
estimated_steps: 16
estimated_files: 2
skills_used: []
---

# T03: Implement inline edit mode with Enter/Esc/blur commit flow

Add edit mode to OutlineItemRow and update the keyboard handler to handle edit-mode keys. This task closes R004 (inline editing).

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

## Inputs

- ``src/ui/OutlineItemRow.tsx` — from T01, currently renders static content text`
- ``src/ui/useKeyboardHandler.ts` — from T02, handles navigation-mode keys`
- ``src/core/api.ts` — setContent, startEditing, stopEditing, insertBelow`
- ``src/ui/context.ts` — useAppState() hook`

## Expected Output

- ``src/ui/OutlineItemRow.tsx` — updated with conditional input rendering, auto-focus, Enter/Esc/blur handlers, local value state`
- ``src/ui/useKeyboardHandler.ts` — updated to skip navigation shortcuts when editingItemId is non-null`

## Verification

pnpm typecheck && pnpm test
