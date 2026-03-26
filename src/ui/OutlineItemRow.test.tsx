import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import {
  createAppState,
  insertBelow,
  setContent,
  startEditing,
  _resetIdCounter,
} from '../core/api'
import { OutlineProvider } from './context'
import { OutlineItemRow } from './OutlineItemRow'
import type { AppState } from '../core/model'
import type { UndoManager } from 'mobx-keystone'

let state: AppState
let um: UndoManager

function renderRow(itemId: string) {
  const item = state.getItem(itemId)!
  return render(
    React.createElement(
      OutlineProvider,
      { value: { state, undoManager: um } },
      React.createElement(OutlineItemRow, { item }),
    ),
  )
}

beforeEach(() => {
  _resetIdCounter()
  const ctx = createAppState()
  state = ctx.state
  um = ctx.undoManager
})

describe('OutlineItemRow — edit mode', () => {
  it('renders static text when not editing', () => {
    const id = insertBelow(state, um)
    setContent(state, um, id, 'hello')
    um.clearUndo()

    renderRow(id)
    expect(screen.queryByTestId('inline-edit-input')).toBeNull()
    expect(screen.getByText('hello')).toBeTruthy()
  })

  it('renders an input when editingItemId matches', () => {
    const id = insertBelow(state, um)
    setContent(state, um, id, 'hello')
    startEditing(state, um, id)
    um.clearUndo()

    renderRow(id)
    const input = screen.getByTestId('inline-edit-input') as HTMLInputElement
    expect(input).toBeTruthy()
    expect(input.value).toBe('hello')
  })

  it('Escape commits content and stops editing', () => {
    const id = insertBelow(state, um)
    setContent(state, um, id, 'original')
    startEditing(state, um, id)
    um.clearUndo()

    renderRow(id)
    const input = screen.getByTestId('inline-edit-input') as HTMLInputElement

    // Type new content
    fireEvent.change(input, { target: { value: 'updated' } })
    expect(input.value).toBe('updated')

    // Press Escape
    fireEvent.keyDown(input, { key: 'Escape' })

    // Content committed, editing stopped
    expect(state.getItem(id)!.content).toBe('updated')
    expect(state.editingItemId).toBeNull()
  })

  it('Enter commits content, stops editing, inserts below, and starts editing new item', () => {
    const id = insertBelow(state, um)
    setContent(state, um, id, 'first')
    startEditing(state, um, id)
    um.clearUndo()

    renderRow(id)
    const input = screen.getByTestId('inline-edit-input') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'first-edited' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    // Original item updated
    expect(state.getItem(id)!.content).toBe('first-edited')
    // A new item was inserted and is now being edited
    expect(state.editingItemId).not.toBeNull()
    expect(state.editingItemId).not.toBe(id)
    // The new item exists with empty content
    const newItem = state.getItem(state.editingItemId!)
    expect(newItem).toBeTruthy()
    expect(newItem!.content).toBe('')
    // Cursor moved to the new item
    expect(state.cursorItemId).toBe(state.editingItemId)
  })

  it('blur commits content and stops editing', () => {
    const id = insertBelow(state, um)
    setContent(state, um, id, 'before')
    startEditing(state, um, id)
    um.clearUndo()

    renderRow(id)
    const input = screen.getByTestId('inline-edit-input') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'after-blur' } })
    fireEvent.blur(input)

    expect(state.getItem(id)!.content).toBe('after-blur')
    expect(state.editingItemId).toBeNull()
  })

  it('blur does not double-commit after Escape already committed', () => {
    const id = insertBelow(state, um)
    setContent(state, um, id, 'original')
    startEditing(state, um, id)
    um.clearUndo()

    renderRow(id)
    const input = screen.getByTestId('inline-edit-input') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'esc-value' } })
    fireEvent.keyDown(input, { key: 'Escape' })

    // editingItemId is now null; blur fires after but should be a no-op
    fireEvent.blur(input)

    expect(state.getItem(id)!.content).toBe('esc-value')
    expect(state.editingItemId).toBeNull()
  })

  it('input has themed styling with amber border and transparent background', () => {
    const id = insertBelow(state, um)
    startEditing(state, um, id)

    renderRow(id)
    const input = screen.getByTestId('inline-edit-input') as HTMLInputElement
    expect(input.className).toContain('bg-transparent')
    expect(input.className).toContain('border-amber')
    expect(input.className).toContain('outline-none')
    expect(input.className).toContain('font-body')
  })
})
