import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import React from 'react'
import {
  createAppState,
  insertBelow,
  setContent,
  _resetIdCounter,
} from '../core/api'
import { OutlineProvider } from './context'
import { useKeyboardHandler } from './useKeyboardHandler'
import type { AppState } from '../core/model'
import type { UndoManager } from 'mobx-keystone'

let state: AppState
let um: UndoManager

function fire(key: string, opts: Partial<KeyboardEventInit> = {}) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opts }))
}

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(OutlineProvider, { value: { state, undoManager: um } }, children)
}

function renderHandler() {
  return renderHook(() => useKeyboardHandler(), { wrapper })
}

/** Seed 3 root items: item-1, item-2, item-3; cursor on item-1. */
function seedThree() {
  const id1 = insertBelow(state, um)
  setContent(state, um, id1, 'one')
  const id2 = insertBelow(state, um, id1)
  setContent(state, um, id2, 'two')
  const id3 = insertBelow(state, um, id2)
  setContent(state, um, id3, 'three')
  state.setCursor(id1)
  um.clearUndo()
  return { id1, id2, id3 }
}

beforeEach(() => {
  _resetIdCounter()
  const ctx = createAppState()
  state = ctx.state
  um = ctx.undoManager
})

describe('useKeyboardHandler — navigation mode', () => {
  let cleanup: ReturnType<typeof renderHandler>

  afterEach(() => cleanup?.unmount())

  it('j / ArrowDown moves cursor down', () => {
    const { id2 } = seedThree()
    cleanup = renderHandler()
    fire('j')
    expect(state.cursorItemId).toBe(id2)
    fire('ArrowDown')
    expect(state.cursorItemId).toBe('item-3')
  })

  it('k / ArrowUp moves cursor up', () => {
    const { id1, id3 } = seedThree()
    state.setCursor(id3)
    cleanup = renderHandler()
    fire('k')
    expect(state.cursorItemId).toBe('item-2')
    fire('ArrowUp')
    expect(state.cursorItemId).toBe(id1)
  })

  it('o inserts below and starts editing', () => {
    seedThree()
    cleanup = renderHandler()
    fire('o')
    // New item should be created (item-4) after item-1
    expect(state.cursorItemId).toBe('item-4')
    expect(state.editingItemId).toBe('item-4')
    // The new item exists in the store
    const newItem = state.getItem('item-4')
    expect(newItem).toBeTruthy()
  })

  it('O (Shift+o) inserts above and starts editing', () => {
    const { id1: firstId } = seedThree()
    cleanup = renderHandler()
    fire('O', { shiftKey: true })
    expect(state.cursorItemId).toBe('item-4')
    expect(state.editingItemId).toBe('item-4')
    // Verify it's above id1 in visible order
    const visible = state.getVisibleItems()
    const newIdx = visible.findIndex((v) => v.id === 'item-4')
    const origIdx = visible.findIndex((v) => v.id === firstId)
    expect(newIdx).toBeLessThan(origIdx)
  })

  it('Tab indents, Shift+Tab outdents', () => {
    const { id2 } = seedThree()
    state.setCursor(id2)
    cleanup = renderHandler()
    fire('Tab')
    const item2 = state.getItem(id2)!
    expect(item2.parentId).toBe('item-1') // indented under item-1

    fire('Tab', { shiftKey: true })
    expect(state.getItem(id2)!.parentId).toBeNull() // back to root
  })

  it('Space toggles completion', () => {
    const { id1 } = seedThree()
    cleanup = renderHandler()
    expect(state.getItem(id1)!.isCompleted).toBe(false)
    fire(' ')
    expect(state.getItem(id1)!.isCompleted).toBe(true)
    fire(' ')
    expect(state.getItem(id1)!.isCompleted).toBe(false)
  })

  it('h / l toggles collapse', () => {
    const { id1 } = seedThree()
    cleanup = renderHandler()
    expect(state.getItem(id1)!.isCollapsed).toBe(false)
    fire('h')
    expect(state.getItem(id1)!.isCollapsed).toBe(true)
    fire('l')
    expect(state.getItem(id1)!.isCollapsed).toBe(false)
  })

  it('Backspace archives only when content is empty', () => {
    const { id1 } = seedThree()
    cleanup = renderHandler()
    // Item has content "one" — Backspace should NOT archive
    fire('Backspace')
    expect(state.getItem(id1)!.isArchived).toBe(false)

    // Clear content, then Backspace should archive
    setContent(state, um, id1, '')
    fire('Backspace')
    expect(state.getItem(id1)!.isArchived).toBe(true)
  })

  it('Enter starts editing', () => {
    seedThree()
    cleanup = renderHandler()
    expect(state.editingItemId).toBeNull()
    fire('Enter')
    expect(state.editingItemId).toBe('item-1')
  })

  it('Ctrl+z undoes, Ctrl+Shift+z redoes', () => {
    const { id1 } = seedThree()
    cleanup = renderHandler()
    // Toggle complete, then undo
    fire(' ') // Space → complete
    expect(state.getItem(id1)!.isCompleted).toBe(true)
    fire('z', { ctrlKey: true })
    expect(state.getItem(id1)!.isCompleted).toBe(false)
    fire('z', { ctrlKey: true, shiftKey: true })
    expect(state.getItem(id1)!.isCompleted).toBe(true)
  })

  it('Ctrl+ArrowUp/Down reorders items', () => {
    const { id1, id2 } = seedThree()
    state.setCursor(id2)
    cleanup = renderHandler()
    // Move item-2 up — it should swap with item-1
    fire('ArrowUp', { ctrlKey: true })
    const visible = state.getVisibleItems()
    expect(visible[0].id).toBe(id2)
    expect(visible[1].id).toBe(id1)
  })

  it('does not dispatch shortcuts when editingItemId is set', () => {
    const { id1 } = seedThree()
    cleanup = renderHandler()
    state.setEditing(id1) // enter edit mode
    fire('j')
    // Cursor should NOT have moved
    expect(state.cursorItemId).toBe(id1)
  })

  it('ignores navigation when cursorItemId is null', () => {
    seedThree()
    state.setCursor(null)
    cleanup = renderHandler()
    // These shouldn't throw
    fire('Tab')
    fire(' ')
    fire('Enter')
    fire('Backspace')
    fire('o')
    expect(state.cursorItemId).toBeNull()
  })

  it('cleans up listener on unmount', () => {
    seedThree()
    cleanup = renderHandler()
    cleanup.unmount()
    // After unmount, pressing j should NOT move cursor
    const before = state.cursorItemId
    fire('j')
    expect(state.cursorItemId).toBe(before)
  })
})
