---
estimated_steps: 35
estimated_files: 1
skills_used: []
---

# T02: Add comprehensive tests for tree manipulation, navigation, and state operations

Write thorough tests for the riskiest operations: indent/outdent (sort order recalculation, boundary conditions), move up/down, cursor navigation (especially with collapsed subtrees), toggleComplete, and toggleCollapse. These edge cases are where bugs will hide.

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

## Inputs

- `src/core/model.ts`
- `src/core/api.ts`
- `src/core/api.test.ts`

## Expected Output

- `src/core/api.test.ts`

## Verification

npx vitest run src/core/api.test.ts --reporter=verbose
