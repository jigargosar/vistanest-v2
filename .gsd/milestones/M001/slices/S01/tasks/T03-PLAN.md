---
estimated_steps: 32
estimated_files: 1
skills_used: []
---

# T03: Add undo/redo tests and integration workflow test

Write undo/redo coverage for every operation and a large integration test that exercises a realistic user workflow. This is the capstone that proves the API composes correctly and retires the riskiest unknowns.

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

## Inputs

- `src/core/model.ts`
- `src/core/api.ts`
- `src/core/api.test.ts`

## Expected Output

- `src/core/api.test.ts`

## Verification

pnpm typecheck && pnpm test
