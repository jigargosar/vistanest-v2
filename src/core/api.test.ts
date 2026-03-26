import { describe, it, expect, beforeEach } from 'vitest'
import {
  createAppState,
  insertBelow,
  insertAbove,
  archiveItem,
  setContent,
  startEditing,
  stopEditing,
  indentItem,
  outdentItem,
  moveItemUp,
  moveItemDown,
  toggleComplete,
  toggleCollapse,
  moveCursorUp,
  moveCursorDown,
  _resetIdCounter,
} from './api'
import type { AppState } from './model'
import type { UndoManager } from 'mobx-keystone'

let state: AppState
let um: UndoManager

beforeEach(() => {
  _resetIdCounter()
  const result = createAppState()
  state = result.state
  um = result.undoManager
})

describe('createAppState', () => {
  it('returns a valid state with defaults', () => {
    expect(state.title).toBe('Untitled')
    expect(state.cursorItemId).toBeNull()
    expect(state.editingItemId).toBeNull()
    expect(state.getVisibleItems()).toHaveLength(0)
  })
})

describe('CRUD - insertBelow', () => {
  it('creates first root item when state is empty', () => {
    const id = insertBelow(state, um)
    expect(id).toBe('item-1')
    expect(state.getItem(id)).toBeDefined()
    expect(state.getItem(id)!.parentId).toBeNull()
    expect(state.cursorItemId).toBe(id)
  })

  it('adds item below reference and moves cursor', () => {
    const first = insertBelow(state, um)
    const second = insertBelow(state, um, first)
    expect(state.getVisibleItems().map((i) => i.id)).toEqual([first, second])
    expect(state.cursorItemId).toBe(second)
  })

  it('inserts between existing items and bumps sortOrders', () => {
    const a = insertBelow(state, um)
    const c = insertBelow(state, um, a)
    const b = insertBelow(state, um, a) // insert between a and c
    const ids = state.getVisibleItems().map((i) => i.id)
    expect(ids).toEqual([a, b, c])
  })
})

describe('CRUD - insertAbove', () => {
  it('inserts above a reference item', () => {
    const first = insertBelow(state, um)
    const above = insertAbove(state, um, first)
    const ids = state.getVisibleItems().map((i) => i.id)
    expect(ids).toEqual([above, first])
    expect(state.cursorItemId).toBe(above)
  })

  it('inserts as first root when no reference', () => {
    const a = insertBelow(state, um)
    const b = insertAbove(state, um) // no ref, becomes first root
    const ids = state.getVisibleItems().map((i) => i.id)
    expect(ids).toEqual([b, a])
  })
})

describe('CRUD - archiveItem', () => {
  it('sets isArchived on target and all descendants', () => {
    const parent = insertBelow(state, um)
    // Make a child of parent
    const child = insertBelow(state, um, parent)
    // Indent child under parent
    const childItem = state.getItem(child)!
    childItem.setParentId(parent)
    childItem.setSortOrder(0)

    archiveItem(state, um, parent)
    expect(state.getItem(parent)!.isArchived).toBe(true)
    expect(state.getItem(child)!.isArchived).toBe(true)
  })

  it('moves cursor to nearest visible sibling after archive', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    const c = insertBelow(state, um, b)

    // Cursor is on c, archive b — cursor should go to c (next sibling)
    state.setCursor(b)
    archiveItem(state, um, b)
    expect(state.cursorItemId).toBe(c)
  })

  it('moves cursor to previous sibling when archiving last item', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)

    state.setCursor(b)
    archiveItem(state, um, b)
    expect(state.cursorItemId).toBe(a)
  })

  it('moves cursor to parent when archiving only child', () => {
    const parent = insertBelow(state, um)
    const child = insertBelow(state, um, parent)
    const childItem = state.getItem(child)!
    childItem.setParentId(parent)
    childItem.setSortOrder(0)

    state.setCursor(child)
    archiveItem(state, um, child)
    expect(state.cursorItemId).toBe(parent)
  })
})

describe('CRUD - setContent', () => {
  it('updates item content', () => {
    const id = insertBelow(state, um)
    setContent(state, um, id, 'Hello world')
    expect(state.getItem(id)!.content).toBe('Hello world')
  })
})

describe('Editing', () => {
  it('startEditing sets editingItemId and cursor', () => {
    const id = insertBelow(state, um)
    startEditing(state, um, id)
    expect(state.editingItemId).toBe(id)
    expect(state.cursorItemId).toBe(id)
  })

  it('stopEditing clears editingItemId', () => {
    const id = insertBelow(state, um)
    startEditing(state, um, id)
    stopEditing(state, um)
    expect(state.editingItemId).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Helper: build a tree quickly from a flat spec
// Each entry: [id-label, parentIndex | null]
// Returns array of item IDs in insertion order
// ---------------------------------------------------------------------------
function buildTree(
  st: AppState,
  u: UndoManager,
  specs: { content?: string; parent?: string }[],
): string[] {
  const ids: string[] = []
  for (const spec of specs) {
    const id = insertBelow(st, u)
    if (spec.content) setContent(st, u, id, spec.content)
    if (spec.parent) {
      const item = st.getItem(id)!
      item.setParentId(spec.parent)
      const siblings = st.getChildren(spec.parent)
      item.setSortOrder(siblings.length - 1) // last child (it's already counted)
    }
    ids.push(id)
  }
  return ids
}

// ---------------------------------------------------------------------------
// Indent
// ---------------------------------------------------------------------------

describe('indentItem', () => {
  it('makes item the last child of its previous sibling', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    indentItem(state, um, b)

    const bItem = state.getItem(b)!
    expect(bItem.parentId).toBe(a)
    // b should be the only child of a
    const aChildren = state.getChildren(a)
    expect(aChildren.map((c) => c.id)).toEqual([b])
  })

  it('places indented item after existing children of previous sibling', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    const c = insertBelow(state, um, b)

    // Make b a child of a manually
    state.getItem(b)!.setParentId(a)
    state.getItem(b)!.setSortOrder(0)

    // Now c is a root sibling of a, indent c → should become last child of a
    indentItem(state, um, c)

    const cItem = state.getItem(c)!
    expect(cItem.parentId).toBe(a)
    const aChildren = state.getChildren(a)
    expect(aChildren.map((ch) => ch.id)).toEqual([b, c])
  })

  it('is a no-op on first sibling (no previous sibling)', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    indentItem(state, um, a) // a is first root — no-op

    expect(state.getItem(a)!.parentId).toBeNull()
  })

  it('moves item\'s children along with it', () => {
    // Build: A, B (root siblings), B has child C
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    const c = insertBelow(state, um, b)
    state.getItem(c)!.setParentId(b)
    state.getItem(c)!.setSortOrder(0)

    // Indent B under A — C should stay as B's child
    indentItem(state, um, b)
    expect(state.getItem(b)!.parentId).toBe(a)
    expect(state.getItem(c)!.parentId).toBe(b)
  })

  it('cursor stays on the indented item', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    state.setCursor(b)
    indentItem(state, um, b)
    expect(state.cursorItemId).toBe(b)
  })

  it('works when previous sibling is collapsed', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    toggleCollapse(state, um, a) // collapse a
    indentItem(state, um, b)

    expect(state.getItem(b)!.parentId).toBe(a)
  })
})

// ---------------------------------------------------------------------------
// Outdent
// ---------------------------------------------------------------------------

describe('outdentItem', () => {
  it('moves item to parent\'s parent, after old parent', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    // Make b a child of a
    state.getItem(b)!.setParentId(a)
    state.getItem(b)!.setSortOrder(0)

    outdentItem(state, um, b)

    expect(state.getItem(b)!.parentId).toBeNull() // now root
    // b should appear after a in root order
    const rootIds = state.getChildren(null).map((c) => c.id)
    const aIdx = rootIds.indexOf(a)
    const bIdx = rootIds.indexOf(b)
    expect(bIdx).toBeGreaterThan(aIdx)
  })

  it('is a no-op on top-level item', () => {
    const a = insertBelow(state, um)
    outdentItem(state, um, a)
    expect(state.getItem(a)!.parentId).toBeNull()
  })

  it('children of outdented item stay as its children', () => {
    // A → B → C  (C is child of B, B is child of A)
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    const c = insertBelow(state, um, b)
    state.getItem(b)!.setParentId(a)
    state.getItem(b)!.setSortOrder(0)
    state.getItem(c)!.setParentId(b)
    state.getItem(c)!.setSortOrder(0)

    outdentItem(state, um, b)
    // B is now root-level, C should still be B's child
    expect(state.getItem(b)!.parentId).toBeNull()
    expect(state.getItem(c)!.parentId).toBe(b)
  })

  it('sort orders are recalculated correctly for all affected items', () => {
    // A has children B, C, D
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    const c = insertBelow(state, um, b)
    const d = insertBelow(state, um, c)
    state.getItem(b)!.setParentId(a)
    state.getItem(b)!.setSortOrder(0)
    state.getItem(c)!.setParentId(a)
    state.getItem(c)!.setSortOrder(1)
    state.getItem(d)!.setParentId(a)
    state.getItem(d)!.setSortOrder(2)

    // Outdent C — it moves to root after A, D (subsequent sibling) becomes child of C
    outdentItem(state, um, c)

    // Only B remains as child of A
    const aChildren = state.getChildren(a)
    expect(aChildren.map((ch) => ch.id)).toEqual([b])

    // D is now child of C (re-parented subsequent sibling)
    expect(state.getItem(d)!.parentId).toBe(c)

    // C is at root after A
    const roots = state.getChildren(null)
    const aIdx = roots.findIndex((r) => r.id === a)
    const cIdx = roots.findIndex((r) => r.id === c)
    expect(cIdx).toBeGreaterThan(aIdx)
  })

  it('re-parents subsequent siblings as children of outdented item', () => {
    // A has children B, C, D. Outdent C → D should become child of C per task spec
    // BUT: looking at the actual API, outdentItem does NOT re-parent subsequent siblings.
    // The current implementation just outdents the single item. Let's verify actual behavior.
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    const c = insertBelow(state, um, b)
    const d = insertBelow(state, um, c)
    state.getItem(b)!.setParentId(a)
    state.getItem(b)!.setSortOrder(0)
    state.getItem(c)!.setParentId(a)
    state.getItem(c)!.setSortOrder(1)
    state.getItem(d)!.setParentId(a)
    state.getItem(d)!.setSortOrder(2)

    outdentItem(state, um, c)

    // Current behavior: D stays under A, C goes to root
    // The task plan says "re-parents subsequent siblings" — we need to implement this
    // if not already done. Let me check what actually happens:
    expect(state.getItem(c)!.parentId).toBeNull()
    // D should be re-parented under C per standard outliner behavior
    expect(state.getItem(d)!.parentId).toBe(c)
  })
})

// ---------------------------------------------------------------------------
// Move up / down
// ---------------------------------------------------------------------------

describe('moveItemUp', () => {
  it('swaps sortOrder with previous sibling', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    const c = insertBelow(state, um, b)
    moveItemUp(state, um, c)

    const rootItems = state.getChildren(null).map((i) => i.id)
    expect(rootItems).toEqual([a, c, b])
  })

  it('is a no-op on first sibling', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    moveItemUp(state, um, a)
    const rootItems = state.getChildren(null).map((i) => i.id)
    expect(rootItems).toEqual([a, b])
  })
})

describe('moveItemDown', () => {
  it('swaps sortOrder with next sibling', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    const c = insertBelow(state, um, b)
    moveItemDown(state, um, a)

    const rootItems = state.getChildren(null).map((i) => i.id)
    expect(rootItems).toEqual([b, a, c])
  })

  it('is a no-op on last sibling', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    moveItemDown(state, um, b)
    const rootItems = state.getChildren(null).map((i) => i.id)
    expect(rootItems).toEqual([a, b])
  })
})

// ---------------------------------------------------------------------------
// Cursor navigation
// ---------------------------------------------------------------------------

describe('moveCursorDown', () => {
  it('moves to next visible item', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    state.setCursor(a)
    moveCursorDown(state, um)
    expect(state.cursorItemId).toBe(b)
  })

  it('skips children of collapsed items', () => {
    // A (collapsed) → child B, then C at root
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    const c = insertBelow(state, um, b)
    state.getItem(b)!.setParentId(a)
    state.getItem(b)!.setSortOrder(0)
    toggleCollapse(state, um, a) // collapse a, hiding b
    state.setCursor(a)

    moveCursorDown(state, um)
    expect(state.cursorItemId).toBe(c)
  })

  it('is a no-op at last visible item', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    state.setCursor(b)
    moveCursorDown(state, um)
    expect(state.cursorItemId).toBe(b)
  })

  it('skips archived items', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    const c = insertBelow(state, um, b)
    archiveItem(state, um, b)
    state.setCursor(a)
    moveCursorDown(state, um)
    expect(state.cursorItemId).toBe(c)
  })
})

describe('moveCursorUp', () => {
  it('moves to previous visible item', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    state.setCursor(b)
    moveCursorUp(state, um)
    expect(state.cursorItemId).toBe(a)
  })

  it('skips children of collapsed items', () => {
    // A, then B (collapsed) → child C, then D at root
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    const c = insertBelow(state, um, b)
    const d = insertBelow(state, um, c)
    state.getItem(c)!.setParentId(b)
    state.getItem(c)!.setSortOrder(0)
    toggleCollapse(state, um, b) // collapse b, hiding c
    state.setCursor(d)

    moveCursorUp(state, um)
    expect(state.cursorItemId).toBe(b) // skips c
  })

  it('is a no-op at first visible item', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    state.setCursor(a)
    moveCursorUp(state, um)
    expect(state.cursorItemId).toBe(a)
  })

  it('skips archived items', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    const c = insertBelow(state, um, b)
    archiveItem(state, um, b)
    state.setCursor(c)
    moveCursorUp(state, um)
    expect(state.cursorItemId).toBe(a)
  })
})

// ---------------------------------------------------------------------------
// State toggles
// ---------------------------------------------------------------------------

describe('toggleComplete', () => {
  it('flips isCompleted from false to true', () => {
    const id = insertBelow(state, um)
    expect(state.getItem(id)!.isCompleted).toBe(false)
    toggleComplete(state, um, id)
    expect(state.getItem(id)!.isCompleted).toBe(true)
  })

  it('uncompletes an already-completed item', () => {
    const id = insertBelow(state, um)
    toggleComplete(state, um, id) // true
    toggleComplete(state, um, id) // false
    expect(state.getItem(id)!.isCompleted).toBe(false)
  })
})

describe('toggleCollapse', () => {
  it('flips isCollapsed', () => {
    const id = insertBelow(state, um)
    expect(state.getItem(id)!.isCollapsed).toBe(false)
    toggleCollapse(state, um, id)
    expect(state.getItem(id)!.isCollapsed).toBe(true)
    toggleCollapse(state, um, id)
    expect(state.getItem(id)!.isCollapsed).toBe(false)
  })

  it('is allowed on leaf nodes (harmless)', () => {
    const id = insertBelow(state, um) // no children
    toggleCollapse(state, um, id)
    expect(state.getItem(id)!.isCollapsed).toBe(true) // stored even though no kids
  })
})

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('getVisibleItems — deep collapse', () => {
  it('handles deeply nested collapsed trees (3+ levels)', () => {
    // Build: A → B → C → D (each is child of previous)
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    const c = insertBelow(state, um, b)
    const d = insertBelow(state, um, c)
    state.getItem(b)!.setParentId(a)
    state.getItem(b)!.setSortOrder(0)
    state.getItem(c)!.setParentId(b)
    state.getItem(c)!.setSortOrder(0)
    state.getItem(d)!.setParentId(c)
    state.getItem(d)!.setSortOrder(0)

    // All expanded: A, B, C, D all visible
    expect(state.getVisibleItems().map((i) => i.id)).toEqual([a, b, c, d])

    // Collapse A → only A visible
    toggleCollapse(state, um, a)
    expect(state.getVisibleItems().map((i) => i.id)).toEqual([a])

    // Expand A, collapse B → A and B visible
    toggleCollapse(state, um, a)
    toggleCollapse(state, um, b)
    expect(state.getVisibleItems().map((i) => i.id)).toEqual([a, b])
  })
})

describe('sort order stability', () => {
  it('operations don\'t create ordering bugs after multiple indent/outdent cycles', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    const c = insertBelow(state, um, b)

    // Indent B under A
    indentItem(state, um, b)
    // Indent C under A (C is now first root after A, indent → child of A)
    indentItem(state, um, c)

    // Both B and C are children of A
    const aChildren = state.getChildren(a)
    expect(aChildren.map((ch) => ch.id)).toContain(b)
    expect(aChildren.map((ch) => ch.id)).toContain(c)

    // Outdent B back to root
    outdentItem(state, um, b)
    expect(state.getItem(b)!.parentId).toBeNull()

    // Visible order should be consistent
    const visible = state.getVisibleItems()
    expect(visible.length).toBe(3) // a, c (under a), b
    // All items still accessible
    expect(visible.map((i) => i.id)).toContain(a)
    expect(visible.map((i) => i.id)).toContain(b)
    expect(visible.map((i) => i.id)).toContain(c)
  })
})
