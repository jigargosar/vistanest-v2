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
  undo,
  redo,
} from './api'
import type { AppState } from './model'
import type { UndoManager } from 'mobx-keystone'

let state: AppState
let um: UndoManager

beforeEach(() => {
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
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
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
    const child = insertBelow(state, um, parent)
    // Indent child under parent
    indentItem(state, um, child)

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
    indentItem(state, um, child)

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

    // Indent b under a
    indentItem(state, um, b)
    // Now c is first root after a, indent c → child of a
    indentItem(state, um, c)

    const aChildren = state.getChildren(a)
    expect(aChildren.map((ch) => ch.id)).toEqual([b, c])
  })

  it('is a no-op on first sibling (no previous sibling)', () => {
    const a = insertBelow(state, um)
    insertBelow(state, um, a)
    indentItem(state, um, a) // a is first root — no-op

    expect(state.getItem(a)!.parentId).toBeNull()
  })

  it('moves item\'s children along with it', () => {
    // Build: A, B (root siblings), B has child C
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    const c = insertBelow(state, um, b)
    indentItem(state, um, c) // c becomes child of b

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
    indentItem(state, um, b) // b is child of a

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
    indentItem(state, um, b) // b under a
    indentItem(state, um, c) // c under b (c was first root after a, now... let me think)
    // After indenting b: roots are [a, c]. c's prev sibling is a, so indenting c puts it under a.
    // We need c under b. Let's indent again.
    // Now a has children [b, c]. c's prev sibling under a is b, so indenting c puts it under b.
    indentItem(state, um, c) // c under b

    outdentItem(state, um, b)
    // B is now root-level, C should still be B's child
    expect(state.getItem(b)!.parentId).toBeNull()
    expect(state.getItem(c)!.parentId).toBe(b)
  })

  it('re-parents subsequent siblings as children of outdented item', () => {
    // A has children B, C, D
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    const c = insertBelow(state, um, b)
    const d = insertBelow(state, um, c)
    // Indent B, C, D under A
    indentItem(state, um, b) // b under a
    indentItem(state, um, c) // c under a (prev root sibling is a)
    indentItem(state, um, d) // d under a (prev root sibling is a)

    // A has children [B, C, D]. Outdent C → D (subsequent sibling) becomes child of C
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

  it('sort orders are recalculated correctly for all affected items', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    const c = insertBelow(state, um, b)
    const d = insertBelow(state, um, c)
    // Indent B, C, D under A
    indentItem(state, um, b)
    indentItem(state, um, c)
    indentItem(state, um, d)

    // Outdent C — D becomes child of C
    outdentItem(state, um, c)

    expect(state.getItem(c)!.parentId).toBeNull()
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
    // A with child B, then C at root
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    const c = insertBelow(state, um, b)
    indentItem(state, um, b) // b under a
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
    // A, then B (collapsed) with child C, then D at root
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    const c = insertBelow(state, um, b)
    const d = insertBelow(state, um, c)
    indentItem(state, um, c) // c under b
    toggleCollapse(state, um, b) // collapse b, hiding c
    state.setCursor(d)

    moveCursorUp(state, um)
    expect(state.cursorItemId).toBe(b) // skips c
  })

  it('is a no-op at first visible item', () => {
    const a = insertBelow(state, um)
    insertBelow(state, um, a)
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
    // b under a, c under b, d under c
    indentItem(state, um, b)
    // After indent b: roots=[a,c,d], a has child [b]. c's prev root is a.
    indentItem(state, um, c) // c under a
    // a has children [b,c], roots=[a,d]. d's prev root is a.
    indentItem(state, um, d) // d under a
    // a has children [b,c,d]. Need d under c. d's prev sibling under a is c.
    indentItem(state, um, d) // d under c
    // Now c has child d, b is sibling of c under a. Need c under b.
    // c's prev sibling under a is b.
    indentItem(state, um, c) // c under b
    // Now: A → B → C → D

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

describe('getDepth', () => {
  it('returns 0 for root items', () => {
    const a = insertBelow(state, um)
    expect(state.getDepth(a)).toBe(0)
  })

  it('returns correct depth for nested items', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    const c = insertBelow(state, um, b)
    indentItem(state, um, b) // b under a — depth 1
    indentItem(state, um, c) // c under a
    indentItem(state, um, c) // c under b — depth 2

    expect(state.getDepth(a)).toBe(0)
    expect(state.getDepth(b)).toBe(1)
    expect(state.getDepth(c)).toBe(2)
  })

  it('returns 0 for unknown item', () => {
    expect(state.getDepth('nonexistent')).toBe(0)
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

// ---------------------------------------------------------------------------
// Undo / Redo
// ---------------------------------------------------------------------------

describe('undo/redo', () => {
  it('undo after insertBelow removes the item and restores cursor', () => {
    const a = insertBelow(state, um)
    expect(state.cursorItemId).toBe(a)

    const b = insertBelow(state, um, a)
    expect(state.cursorItemId).toBe(b)
    expect(state.getVisibleItems()).toHaveLength(2)

    undo(um)
    // b should be gone, cursor restored to a
    expect(state.getVisibleItems()).toHaveLength(1)
    expect(state.getItem(b)).toBeUndefined()
    expect(state.cursorItemId).toBe(a)
  })

  it('undo after archiveItem restores item (and descendants) with isArchived=false and restores cursor', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    // Make b a child of a
    indentItem(state, um, b)
    expect(state.getItem(b)!.parentId).toBe(a)

    state.setCursor(a)
    archiveItem(state, um, a)
    // Both archived
    expect(state.getItem(a)!.isArchived).toBe(true)
    expect(state.getItem(b)!.isArchived).toBe(true)
    expect(state.getVisibleItems()).toHaveLength(0)

    undo(um)
    // Both restored
    expect(state.getItem(a)!.isArchived).toBe(false)
    expect(state.getItem(b)!.isArchived).toBe(false)
    expect(state.getVisibleItems()).toHaveLength(2)
    // Cursor restored to a (was on a before archive)
    expect(state.cursorItemId).toBe(a)
  })

  it('undo after indentItem restores original parentId and sortOrder', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    const origParent = state.getItem(b)!.parentId
    const origSort = state.getItem(b)!.sortOrder

    indentItem(state, um, b)
    expect(state.getItem(b)!.parentId).toBe(a)

    undo(um)
    expect(state.getItem(b)!.parentId).toBe(origParent)
    expect(state.getItem(b)!.sortOrder).toBe(origSort)
  })

  it('undo after outdentItem restores original parentId and sortOrder', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    // Make b a child of a
    indentItem(state, um, b)
    const origParent = state.getItem(b)!.parentId
    const origSort = state.getItem(b)!.sortOrder

    outdentItem(state, um, b)
    expect(state.getItem(b)!.parentId).toBeNull()

    undo(um)
    expect(state.getItem(b)!.parentId).toBe(origParent)
    expect(state.getItem(b)!.sortOrder).toBe(origSort)
  })

  it('undo after moveItemUp restores original sortOrder', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    const origOrderA = state.getItem(a)!.sortOrder
    const origOrderB = state.getItem(b)!.sortOrder

    moveItemUp(state, um, b)
    expect(state.getChildren(null).map((i) => i.id)).toEqual([b, a])

    undo(um)
    expect(state.getItem(a)!.sortOrder).toBe(origOrderA)
    expect(state.getItem(b)!.sortOrder).toBe(origOrderB)
    expect(state.getChildren(null).map((i) => i.id)).toEqual([a, b])
  })

  it('undo after toggleComplete restores original isCompleted', () => {
    const id = insertBelow(state, um)
    expect(state.getItem(id)!.isCompleted).toBe(false)

    toggleComplete(state, um, id)
    expect(state.getItem(id)!.isCompleted).toBe(true)

    undo(um)
    expect(state.getItem(id)!.isCompleted).toBe(false)
  })

  it('undo after toggleCollapse restores original isCollapsed', () => {
    const id = insertBelow(state, um)
    expect(state.getItem(id)!.isCollapsed).toBe(false)

    toggleCollapse(state, um, id)
    expect(state.getItem(id)!.isCollapsed).toBe(true)

    undo(um)
    expect(state.getItem(id)!.isCollapsed).toBe(false)
  })

  it('undo after setContent restores original content', () => {
    const id = insertBelow(state, um)
    setContent(state, um, id, 'original')
    expect(state.getItem(id)!.content).toBe('original')

    setContent(state, um, id, 'modified')
    expect(state.getItem(id)!.content).toBe('modified')

    undo(um)
    expect(state.getItem(id)!.content).toBe('original')
  })

  it('redo after undo re-applies the operation', () => {
    const a = insertBelow(state, um)
    setContent(state, um, a, 'hello')

    undo(um) // undo setContent
    expect(state.getItem(a)!.content).toBe('')

    redo(um) // redo setContent
    expect(state.getItem(a)!.content).toBe('hello')
  })

  it('multiple undo steps work in correct LIFO order', () => {
    const a = insertBelow(state, um)
    setContent(state, um, a, 'step1')
    setContent(state, um, a, 'step2')
    setContent(state, um, a, 'step3')

    undo(um)
    expect(state.getItem(a)!.content).toBe('step2')
    undo(um)
    expect(state.getItem(a)!.content).toBe('step1')
    undo(um)
    expect(state.getItem(a)!.content).toBe('')
  })

  it('undo with no history is a no-op (doesn\'t throw)', () => {
    expect(() => undo(um)).not.toThrow()
    // State unchanged
    expect(state.getVisibleItems()).toHaveLength(0)
  })

  it('redo with no future is a no-op (doesn\'t throw)', () => {
    expect(() => redo(um)).not.toThrow()
    // State unchanged
    expect(state.getVisibleItems()).toHaveLength(0)
  })

  it('compound operations (insertBelow = addItem + setCursor) undo as one step', () => {
    const a = insertBelow(state, um)
    const b = insertBelow(state, um, a)
    // insertBelow creates item AND sets cursor — both should undo together
    expect(state.cursorItemId).toBe(b)
    expect(state.getVisibleItems()).toHaveLength(2)

    undo(um) // single undo should remove b AND restore cursor
    expect(state.getVisibleItems()).toHaveLength(1)
    expect(state.getItem(b)).toBeUndefined()
    expect(state.cursorItemId).toBe(a)
  })

  it('cursor position is correctly restored on undo for every operation type', () => {
    const a = insertBelow(state, um)
    setContent(state, um, a, 'A')
    const b = insertBelow(state, um, a)
    setContent(state, um, b, 'B')
    const c = insertBelow(state, um, b)
    setContent(state, um, c, 'C')

    // cursor is on c after inserts
    expect(state.cursorItemId).toBe(c)

    // indentItem — cursor stays on c
    indentItem(state, um, c) // c becomes child of b
    expect(state.cursorItemId).toBe(c)

    undo(um) // undo indent
    // cursor should be restored to c
    expect(state.cursorItemId).toBe(c)
    expect(state.getItem(c)!.parentId).toBeNull()

    // toggleComplete — cursor stays
    state.setCursor(b)
    toggleComplete(state, um, b)
    expect(state.cursorItemId).toBe(b)

    undo(um) // undo toggleComplete
    expect(state.cursorItemId).toBe(b)

    // moveItemUp — cursor stays
    moveItemUp(state, um, b)
    expect(state.cursorItemId).toBe(b)

    undo(um) // undo moveItemUp
    expect(state.cursorItemId).toBe(b)
  })
})

// ---------------------------------------------------------------------------
// Integration workflow
// ---------------------------------------------------------------------------

describe('integration workflow — realistic session', () => {
  it('exercises CRUD, tree ops, collapse, archive, undo/redo in a single session', () => {
    // 1. Create 5 top-level items A, B, C, D, E
    const a = insertBelow(state, um)
    setContent(state, um, a, 'A')
    const b = insertBelow(state, um, a)
    setContent(state, um, b, 'B')
    const c = insertBelow(state, um, b)
    setContent(state, um, c, 'C')
    const d = insertBelow(state, um, c)
    setContent(state, um, d, 'D')
    const e = insertBelow(state, um, d)
    setContent(state, um, e, 'E')

    expect(state.getVisibleItems().map((i) => i.content)).toEqual(['A', 'B', 'C', 'D', 'E'])
    expect(state.cursorItemId).toBe(e)

    // 2. Indent B and C under A
    indentItem(state, um, b) // B becomes child of A
    // After indenting B: roots=[A,C,D,E]. C's prev root is A.
    indentItem(state, um, c) // C becomes child of A (prev root sibling)
    expect(state.getItem(b)!.parentId).toBe(a)
    expect(state.getItem(c)!.parentId).toBe(a)

    // 3. Indent D under C
    // After step 2: roots=[A,D,E]. D's prev root is A, indent → child of A.
    indentItem(state, um, d) // D under A
    // A has children [B,C,D]. D's prev sibling under A is C.
    indentItem(state, um, d) // D under C

    expect(state.getItem(d)!.parentId).toBe(c)

    // 4. Verify getVisibleItems returns correct order: A, B, C, D, E
    expect(state.getVisibleItems().map((i) => i.content)).toEqual(['A', 'B', 'C', 'D', 'E'])

    // 5. Collapse A — verify only A and E visible
    toggleCollapse(state, um, a)
    expect(state.getVisibleItems().map((i) => i.content)).toEqual(['A', 'E'])

    // Cursor should be on a valid visible item
    const visIds5 = state.getVisibleItems().map((i) => i.id)
    expect(visIds5).toContain(state.cursorItemId)

    // 6. Expand A — verify full list again
    toggleCollapse(state, um, a)
    expect(state.getVisibleItems().map((i) => i.content)).toEqual(['A', 'B', 'C', 'D', 'E'])

    // 7. Complete item B — verify isCompleted
    toggleComplete(state, um, b)
    expect(state.getItem(b)!.isCompleted).toBe(true)

    // 8. Archive item C — verify C and D are archived, visible items are A, B, E
    archiveItem(state, um, c)
    expect(state.getItem(c)!.isArchived).toBe(true)
    expect(state.getItem(d)!.isArchived).toBe(true)
    expect(state.getVisibleItems().map((i) => i.content)).toEqual(['A', 'B', 'E'])

    // Cursor should be on a valid, visible, non-archived item
    const visAfterArchive = state.getVisibleItems().map((i) => i.id)
    expect(visAfterArchive).toContain(state.cursorItemId)

    // 9. Undo archive — verify C and D restored, cursor restored
    undo(um)
    expect(state.getItem(c)!.isArchived).toBe(false)
    expect(state.getItem(d)!.isArchived).toBe(false)
    expect(state.getVisibleItems().map((i) => i.content)).toEqual(['A', 'B', 'C', 'D', 'E'])
    const visAfterUndo = state.getVisibleItems().map((i) => i.id)
    expect(visAfterUndo).toContain(state.cursorItemId)

    // 10. Move E up — E should swap with A (prev root sibling)
    moveItemUp(state, um, e)
    const rootOrder = state.getChildren(null).map((i) => i.content)
    expect(rootOrder).toEqual(['E', 'A'])

    // Full visible list: E is before A's subtree
    const visAfterMove = state.getVisibleItems().map((i) => i.content)
    expect(visAfterMove[0]).toBe('E')
    expect(visAfterMove[1]).toBe('A')

    // 11. Undo 3 times — verify state rollback is consistent
    // Undo stack (top→bottom): moveItemUp, undo-archive (no — undo consumed archive entry),
    // Actually: after step 9 we undid archive, which pops archive from undo stack.
    // After step 10 (moveItemUp), undo stack top→bottom: moveItemUp, toggleComplete, toggleCollapse(expand), toggleCollapse(collapse), ...
    
    // undo moveItemUp
    undo(um)
    expect(state.getChildren(null).map((i) => i.content)).toEqual(['A', 'E'])

    // undo toggleComplete on B
    undo(um)
    expect(state.getItem(b)!.isCompleted).toBe(false)

    // undo toggleCollapse (the expand in step 6)
    undo(um)
    // A is now collapsed again
    expect(state.getItem(a)!.isCollapsed).toBe(true)
    expect(state.getVisibleItems().map((i) => i.content)).toEqual(['A', 'E'])

    // State should be consistent — cursor on valid item
    if (state.cursorItemId) {
      const cursorItem = state.getItem(state.cursorItemId)
      expect(cursorItem).toBeDefined()
    }

    // 12. Redo 2 times — verify state rolls forward correctly
    redo(um)
    // Re-applies toggleCollapse (expand A)
    expect(state.getItem(a)!.isCollapsed).toBe(false)
    expect(state.getVisibleItems().map((i) => i.content)).toEqual(['A', 'B', 'C', 'D', 'E'])

    redo(um)
    // Re-applies toggleComplete on B
    expect(state.getItem(b)!.isCompleted).toBe(true)

    // 13. Final assertion: cursor is always a valid item
    if (state.cursorItemId) {
      expect(state.getItem(state.cursorItemId)).toBeDefined()
    }
  })
})
