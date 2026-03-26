---
estimated_steps: 9
estimated_files: 5
skills_used: []
---

# T01: Bootstrap React shell with MobX context and outline rendering

Create the React ↔ MobX wiring layer: a context provider for AppState/UndoManager, an OutlineView component that renders getVisibleItems() as a flat list, and an OutlineItemRow component that shows content with depth-based indentation and cursor highlighting. Add a getDepth() utility to model.ts. Seed an initial item so there's something to see. This proves the MobX observer pipeline works before adding keyboard interaction.

Components must be wrapped in mobx-react-lite observer() to re-render on MobX state changes. getVisibleItems() already returns a flat DFS-ordered list respecting collapse/archive, so rendering is a simple map — no recursive component tree needed. Depth-based left padding comes from walking the parentId chain via the new getDepth() utility.

Key constraints:
- All components reading MobX state must be observer() wrapped
- Use React context (not prop drilling) for state/undoManager
- Seed at least 3 items (2 root + 1 child) so depth indentation and cursor movement are visually verifiable
- Cursor highlight: apply a distinct background class to the item matching state.cursorItemId
- Collapse chevron: show a toggle indicator on items that have children
- Checkbox: show completed state visually (strikethrough or checkbox indicator)

## Inputs

- ``src/core/model.ts` — AppState and OutlineItem models with getVisibleItems(), getChildren(), getItem()`
- ``src/core/api.ts` — createAppState(), setupUndo(), insertBelow(), setContent() for seeding initial items`
- ``src/ui/App.tsx` — existing bare shell to be refactored`
- ``src/index.tsx` — app entry point (no changes needed, already renders App)`

## Expected Output

- ``src/ui/context.ts` — React context for { state: AppState, undoManager: UndoManager } with useAppState() hook`
- ``src/ui/OutlineView.tsx` — observer component rendering getVisibleItems() as flat list of OutlineItemRow`
- ``src/ui/OutlineItemRow.tsx` — observer component: depth padding, cursor highlight, collapse chevron, completion indicator, content display`
- ``src/ui/App.tsx` — refactored to bootstrap AppState/UndoManager, provide via context, seed initial items, render OutlineView`
- ``src/core/model.ts` — added getDepth(itemId) utility method to AppState`

## Verification

pnpm typecheck && pnpm test
