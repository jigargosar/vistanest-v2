import { describe, it, expect, beforeEach } from 'vitest'
import {
  createAppState,
  insertBelow,
  insertAbove,
  archiveItem,
  setContent,
  startEditing,
  stopEditing,
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
