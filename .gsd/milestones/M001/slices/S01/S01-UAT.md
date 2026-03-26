# S01: Keystone Model + Core API — UAT

**Milestone:** M001
**Written:** 2026-03-26T02:48:54.335Z

# S01: Keystone Model + Core API — UAT

**Milestone:** M001
**Written:** 2026-03-26

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: S01 is a pure model/API slice with no UI — all behavior is exercised through unit tests against the API surface.

## Preconditions

- Node.js 18+ and pnpm installed
- Dependencies installed (`pnpm install`)

## Smoke Test

Run `pnpm test` — all 57 tests should pass in under 5 seconds.

## Test Cases

### 1. CRUD Operations
Run `pnpm test -- --reporter=verbose` — 7 CRUD tests pass (create, insertBelow/Above, archive cascade, setContent).

### 2. Tree Manipulation
15 tests pass for indent (6), outdent with sibling re-parenting (5), moveUp/moveDown (4).

### 3. Cursor Navigation
8 tests pass — DFS traversal, collapsed subtree skipping, archived item skipping, boundary no-ops.

### 4. Undo/Redo
14 tests pass — every operation type undoes/redoes with cursor restore, LIFO ordering, compound atomicity.

### 5. Integration Workflow
1 test exercises realistic session: create 5 items, build hierarchy, collapse/expand, complete, archive+undo, move, multi-undo/redo.

### 6. Type Safety
`pnpm typecheck` exits 0 with no errors.

## Edge Cases

### Indent When Previous Sibling Is Collapsed
Item becomes child of collapsed sibling — collapse doesn't prevent indent.

### Outdent With Subsequent Siblings
Subsequent siblings become children of outdented item (standard outliner behavior).

### Archive With Deep Subtree
All descendants get isArchived=true. Undo restores all.

## Failure Signals

- Any test failure in `pnpm test`
- Type errors from `pnpm typecheck`

## Not Proven By This UAT

- UI rendering (S02), keyboard handling (S02), visual design (S03), persistence (S04), performance at scale
