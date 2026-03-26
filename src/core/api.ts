import { registerRootStore, undoMiddleware, UndoManager } from 'mobx-keystone'
import { AppState, OutlineItem, sortOrderFraci, type SortOrderIndex } from './model'

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

/** Create a fresh AppState, register it as root store, attach undo. */
export function createAppState(): { state: AppState; undoManager: UndoManager } {
  const state = new AppState({})
  registerRootStore(state)
  const undoManager = setupUndo(state)
  return { state, undoManager }
}

/** Attach undo middleware with cursor/editing as attached state. */
export function setupUndo(state: AppState): UndoManager {
  return undoMiddleware(state, undefined, {
    attachedState: {
      save() {
        return {
          cursorItemId: state.cursorItemId,
          editingItemId: state.editingItemId,
        }
      },
      restore(saved: { cursorItemId: string | null; editingItemId: string | null }) {
        // Restore cursor/editing without recording to undo stack
        state.setCursor(saved.cursorItemId)
        state.setEditing(saved.editingItemId)
      },
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _nextId = 1
/** Generate a unique ID for new items. Deterministic in tests. */
export function generateId(): string {
  return `item-${_nextId++}`
}

/** Reset ID counter — for tests only. */
export function _resetIdCounter() {
  _nextId = 1
}

/**
 * Generate a fractional index key between two existing keys.
 * Wraps fraci's generator protocol — returns the first yielded value.
 */
function keyBetween(a: SortOrderIndex | null, b: SortOrderIndex | null): string {
  const [key] = sortOrderFraci.generateKeyBetween(a, b)
  return key as string
}

/**
 * Get the last sort key among children of a parent, or null if no children.
 */
function lastKey(state: AppState, parentId: string | null): SortOrderIndex | null {
  const children = state.getChildren(parentId)
  if (children.length === 0) return null
  return children[children.length - 1].sortOrder as SortOrderIndex
}

/**
 * Get the first sort key among children of a parent, or null if no children.
 */
function firstKey(state: AppState, parentId: string | null): SortOrderIndex | null {
  const children = state.getChildren(parentId)
  if (children.length === 0) return null
  return children[0].sortOrder as SortOrderIndex
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

/**
 * Insert a new item below referenceId (same parent, next sortOrder).
 * If referenceId is undefined or state is empty, inserts as first root item.
 * Returns the new item's ID.
 */
export function insertBelow(
  state: AppState,
  um: UndoManager,
  referenceId?: string,
): string {
  return um.withGroup('insertBelow', () => {
    const id = generateId()
    const newItem = new OutlineItem({ id })

    if (!referenceId) {
      // Insert as last root child
      const last = lastKey(state, null)
      newItem.setSortOrder(keyBetween(last, null))
      newItem.setParentId(null)
    } else {
      const ref = state.getItem(referenceId)
      if (!ref) throw new Error(`insertBelow: reference item ${referenceId} not found`)
      const siblings = state.getChildren(ref.parentId)
      const refIndex = siblings.findIndex((s) => s.id === referenceId)
      const nextKey = refIndex < siblings.length - 1
        ? siblings[refIndex + 1].sortOrder as SortOrderIndex
        : null
      newItem.setParentId(ref.parentId)
      newItem.setSortOrder(keyBetween(ref.sortOrder as SortOrderIndex, nextKey))
    }

    state.items.set(id, newItem)
    state.setCursor(id)
    return id
  })
}

/**
 * Insert a new item above referenceId (same parent, previous sortOrder).
 * Returns the new item's ID.
 */
export function insertAbove(
  state: AppState,
  um: UndoManager,
  referenceId?: string,
): string {
  return um.withGroup('insertAbove', () => {
    const id = generateId()
    const newItem = new OutlineItem({ id })

    if (!referenceId) {
      // Insert as first root child
      const first = firstKey(state, null)
      newItem.setParentId(null)
      newItem.setSortOrder(keyBetween(null, first))
    } else {
      const ref = state.getItem(referenceId)
      if (!ref) throw new Error(`insertAbove: reference item ${referenceId} not found`)
      const siblings = state.getChildren(ref.parentId)
      const refIndex = siblings.findIndex((s) => s.id === referenceId)
      const prevKey = refIndex > 0
        ? siblings[refIndex - 1].sortOrder as SortOrderIndex
        : null
      newItem.setParentId(ref.parentId)
      newItem.setSortOrder(keyBetween(prevKey, ref.sortOrder as SortOrderIndex))
    }

    state.items.set(id, newItem)
    state.setCursor(id)
    return id
  })
}

/**
 * Archive an item and all its descendants recursively.
 * Moves cursor to nearest visible sibling/parent.
 */
export function archiveItem(state: AppState, um: UndoManager, itemId: string) {
  um.withGroup('archiveItem', () => {
    const item = state.getItem(itemId)
    if (!item) throw new Error(`archiveItem: item ${itemId} not found`)

    // Find a cursor target before archiving
    const siblings = state.getSiblings(itemId)
    const idx = siblings.findIndex((s) => s.id === itemId)
    let nextCursor: string | null = null
    // Try next sibling, then previous sibling, then parent
    if (idx < siblings.length - 1) {
      nextCursor = siblings[idx + 1].id
    } else if (idx > 0) {
      nextCursor = siblings[idx - 1].id
    } else {
      nextCursor = item.parentId
    }

    // Cascade archive to all descendants
    const archiveRecursive = (id: string) => {
      const target = state.getItem(id)
      if (!target) return
      target.setArchived(true)
      // Archive all children (including already-archived ones, to be thorough)
      for (const child of state.items.values()) {
        if (child.parentId === id) {
          archiveRecursive(child.id)
        }
      }
    }
    archiveRecursive(itemId)

    state.setCursor(nextCursor)
  })
}

/** Update an item's content. */
export function setContent(
  state: AppState,
  um: UndoManager,
  itemId: string,
  content: string,
) {
  um.withGroup('setContent', () => {
    const item = state.getItem(itemId)
    if (!item) throw new Error(`setContent: item ${itemId} not found`)
    item.setContent(content)
  })
}

// ---------------------------------------------------------------------------
// Editing
// ---------------------------------------------------------------------------

export function startEditing(state: AppState, um: UndoManager, itemId: string) {
  um.withGroup('startEditing', () => {
    state.setEditing(itemId)
    state.setCursor(itemId)
  })
}

export function stopEditing(state: AppState, um: UndoManager) {
  um.withGroup('stopEditing', () => {
    state.setEditing(null)
  })
}

// ---------------------------------------------------------------------------
// Tree operations
// ---------------------------------------------------------------------------

/**
 * Indent: make item a child of its previous sibling.
 * No-op if item is first among siblings.
 */
export function indentItem(state: AppState, um: UndoManager, itemId: string) {
  um.withGroup('indentItem', () => {
    const item = state.getItem(itemId)
    if (!item) return
    const siblings = state.getChildren(item.parentId)
    const idx = siblings.findIndex((s) => s.id === itemId)
    if (idx <= 0) return // Can't indent first child

    const newParent = siblings[idx - 1]
    // Place as last child of new parent
    const last = lastKey(state, newParent.id)
    item.setParentId(newParent.id)
    item.setSortOrder(keyBetween(last, null))
  })
}

/**
 * Outdent: move item up one level, placing it after its current parent.
 * Subsequent siblings of the outdented item become its children (standard outliner behavior).
 * No-op if item is at root level.
 */
export function outdentItem(state: AppState, um: UndoManager, itemId: string) {
  um.withGroup('outdentItem', () => {
    const item = state.getItem(itemId)
    if (!item || item.parentId === null) return // Can't outdent root

    const oldParentId = item.parentId
    const parent = state.getItem(oldParentId)
    if (!parent) return

    const oldSiblings = state.getChildren(oldParentId)
    const itemIdx = oldSiblings.findIndex((s) => s.id === itemId)

    // Re-parent subsequent siblings as children of the outdented item
    const existingChildren = state.getChildren(itemId)
    let prevChildKey = existingChildren.length > 0
      ? existingChildren[existingChildren.length - 1].sortOrder as SortOrderIndex
      : null
    for (let i = itemIdx + 1; i < oldSiblings.length; i++) {
      const newKey = keyBetween(prevChildKey, null)
      oldSiblings[i].setParentId(itemId)
      oldSiblings[i].setSortOrder(newKey)
      prevChildKey = newKey as SortOrderIndex
    }

    const grandparentId = parent.parentId
    const parentSiblings = state.getChildren(grandparentId)
    const parentIdx = parentSiblings.findIndex((s) => s.id === parent.id)

    // Place outdented item right after its old parent in grandparent's children
    const nextKey = parentIdx < parentSiblings.length - 1
      ? parentSiblings[parentIdx + 1].sortOrder as SortOrderIndex
      : null
    item.setParentId(grandparentId)
    item.setSortOrder(keyBetween(parent.sortOrder as SortOrderIndex, nextKey))
  })
}

/**
 * Move item up among its siblings. No-op if already first.
 */
export function moveItemUp(state: AppState, um: UndoManager, itemId: string) {
  um.withGroup('moveItemUp', () => {
    const item = state.getItem(itemId)
    if (!item) return
    const siblings = state.getChildren(item.parentId)
    const idx = siblings.findIndex((s) => s.id === itemId)
    if (idx <= 0) return

    // Swap sort orders between item and its previous sibling
    const above = siblings[idx - 1]
    const aboveOrder = above.sortOrder
    above.setSortOrder(item.sortOrder)
    item.setSortOrder(aboveOrder)
  })
}

/**
 * Move item down among its siblings. No-op if already last.
 */
export function moveItemDown(state: AppState, um: UndoManager, itemId: string) {
  um.withGroup('moveItemDown', () => {
    const item = state.getItem(itemId)
    if (!item) return
    const siblings = state.getChildren(item.parentId)
    const idx = siblings.findIndex((s) => s.id === itemId)
    if (idx < 0 || idx >= siblings.length - 1) return

    // Swap sort orders between item and its next sibling
    const below = siblings[idx + 1]
    const belowOrder = below.sortOrder
    below.setSortOrder(item.sortOrder)
    item.setSortOrder(belowOrder)
  })
}

// ---------------------------------------------------------------------------
// State toggles
// ---------------------------------------------------------------------------

export function toggleComplete(state: AppState, um: UndoManager, itemId: string) {
  um.withGroup('toggleComplete', () => {
    const item = state.getItem(itemId)
    if (!item) return
    item.setCompleted(!item.isCompleted)
  })
}

export function toggleCollapse(state: AppState, um: UndoManager, itemId: string) {
  um.withGroup('toggleCollapse', () => {
    const item = state.getItem(itemId)
    if (!item) return
    item.setCollapsed(!item.isCollapsed)
  })
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export function moveCursorUp(state: AppState, um: UndoManager) {
  um.withGroup('moveCursorUp', () => {
    const visible = state.getVisibleItems()
    if (visible.length === 0) return
    const idx = visible.findIndex((v) => v.id === state.cursorItemId)
    if (idx <= 0) {
      state.setCursor(visible[0].id)
    } else {
      state.setCursor(visible[idx - 1].id)
    }
  })
}

export function moveCursorDown(state: AppState, um: UndoManager) {
  um.withGroup('moveCursorDown', () => {
    const visible = state.getVisibleItems()
    if (visible.length === 0) return
    const idx = visible.findIndex((v) => v.id === state.cursorItemId)
    if (idx < 0 || idx >= visible.length - 1) {
      state.setCursor(visible[visible.length - 1].id)
    } else {
      state.setCursor(visible[idx + 1].id)
    }
  })
}

// ---------------------------------------------------------------------------
// Undo / Redo
// ---------------------------------------------------------------------------

export function undo(um: UndoManager) {
  if (um.canUndo) um.undo()
}

export function redo(um: UndoManager) {
  if (um.canRedo) um.redo()
}
