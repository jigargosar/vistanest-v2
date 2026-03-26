/**
 * Integration tests exercising full user workflows through the rendered UI.
 *
 * These cover the interaction flows tested manually in the browser:
 * navigation, insertion, editing, completion, collapse, indent/outdent,
 * archive, undo/redo, and rapid-fire Enter item creation.
 *
 * Each test renders the full component tree (OutlineProvider → KeyboardHandlerHost
 * → OutlineView) so that keyboard events flow through the real dispatch path
 * and MobX reactions trigger real re-renders.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'
import {
  createAppState,
  insertBelow,
  setContent,
  indentItem,
} from '../core/api'
import { OutlineProvider } from './context'
import { OutlineView } from './OutlineView'
import { KeyboardHandlerHost } from './KeyboardHandlerHost'
import type { AppState } from '../core/model'
import type { UndoManager } from 'mobx-keystone'

let state: AppState
let um: UndoManager

function renderApp() {
  return render(
    React.createElement(
      OutlineProvider,
      { value: { state, undoManager: um } },
      React.createElement(KeyboardHandlerHost),
      React.createElement(OutlineView),
    ),
  )
}

/** fire() wrapped in act() so MobX observer re-renders before assertions */
function fire(key: string, opts: Partial<KeyboardEventInit> = {}) {
  act(() => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts }),
    )
  })
}

/** Seed: Welcome (root, has children) → child1, child2; standalone (root) */
function seedOutline() {
  const welcome = insertBelow(state, um)
  setContent(state, um, welcome, 'Welcome')

  const child1 = insertBelow(state, um, welcome)
  setContent(state, um, child1, 'Child one')
  indentItem(state, um, child1) // child of Welcome

  const child2 = insertBelow(state, um, child1)
  setContent(state, um, child2, 'Child two')
  // child2 is also a child of Welcome (insertBelow after child1 under Welcome)

  const standalone = insertBelow(state, um, welcome)
  setContent(state, um, standalone, 'Standalone')
  // standalone is a root-level item after Welcome (not indented)

  state.setCursor(welcome)
  um.clearUndo()
  return { welcome, child1, child2, standalone }
}

/** Get all visible item text contents in order */
function visibleTexts(): string[] {
  return state.getVisibleItems().map((item) => item.content)
}

beforeEach(() => {
  const ctx = createAppState()
  state = ctx.state
  um = ctx.undoManager
})

describe('Integration — full user workflows', () => {
  it('j/k navigation moves cursor through visible items', () => {
    const { welcome, child1, child2, standalone } = seedOutline()
    renderApp()

    expect(state.cursorItemId).toBe(welcome)

    fire('j')
    expect(state.cursorItemId).toBe(child1)

    fire('j')
    expect(state.cursorItemId).toBe(child2)

    fire('j')
    expect(state.cursorItemId).toBe(standalone)

    // k goes back up
    fire('k')
    expect(state.cursorItemId).toBe(child2)

    fire('k')
    expect(state.cursorItemId).toBe(child1)

    fire('k')
    expect(state.cursorItemId).toBe(welcome)

    // k at top stays at top
    fire('k')
    expect(state.cursorItemId).toBe(welcome)
  })

  it('j skips collapsed children', () => {
    const { welcome, standalone } = seedOutline()
    renderApp()

    // Collapse Welcome — children should be hidden
    fire('h')
    expect(state.getItem(welcome)!.isCollapsed).toBe(true)

    // j should jump from Welcome directly to Standalone
    fire('j')
    expect(state.cursorItemId).toBe(standalone)
  })

  it('Space toggles completion', () => {
    const { welcome } = seedOutline()
    renderApp()

    expect(state.getItem(welcome)!.isCompleted).toBe(false)
    fire(' ')
    expect(state.getItem(welcome)!.isCompleted).toBe(true)
    fire(' ')
    expect(state.getItem(welcome)!.isCompleted).toBe(false)
  })

  it('Enter opens edit mode, typing changes content, Escape commits', () => {
    const { child1 } = seedOutline()
    state.setCursor(child1)
    renderApp()

    fire('Enter')
    expect(state.editingItemId).toBe(child1)

    const input = screen.getByTestId('inline-edit-input') as HTMLInputElement
    expect(input.value).toBe('Child one')

    fireEvent.change(input, { target: { value: 'Updated child' } })
    act(() => { fireEvent.keyDown(input, { key: 'Escape' }) })

    expect(state.editingItemId).toBeNull()
    expect(state.getItem(child1)!.content).toBe('Updated child')
  })

  it('Enter in edit mode with text creates new item below and opens it for editing', () => {
    const { welcome } = seedOutline()
    state.setCursor(welcome)
    renderApp()

    fire('Enter')
    const input = screen.getByTestId('inline-edit-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Welcome edited' } })

    act(() => { fireEvent.keyDown(input, { key: 'Enter' }) })

    expect(state.getItem(welcome)!.content).toBe('Welcome edited')
    const newId = state.editingItemId!
    expect(newId).toBeTruthy()
    expect(newId).not.toBe(welcome)
    expect(state.getItem(newId)!.content).toBe('')
    expect(state.cursorItemId).toBe(newId)
  })

  it('Enter in edit mode on empty input archives the blank item', () => {
    seedOutline()
    renderApp()

    const countBefore = state.getVisibleItems().length

    // Create a new item via o
    fire('o')
    const newId = state.editingItemId!
    expect(newId).toBeTruthy()
    expect(state.getVisibleItems().length).toBe(countBefore + 1)

    const input = screen.getByTestId('inline-edit-input') as HTMLInputElement
    act(() => { fireEvent.keyDown(input, { key: 'Enter' }) })

    // Should stop editing and archive the empty item
    expect(state.editingItemId).toBeNull()
    expect(state.getItem(newId)!.isArchived).toBe(true)
    expect(state.getVisibleItems().length).toBe(countBefore)
  })

  it('rapid-fire Enter creates sequential items', () => {
    seedOutline()
    const lastId = state.getVisibleItems()[state.getVisibleItems().length - 1].id
    state.setCursor(lastId)
    renderApp()

    // o to start inserting
    fire('o')
    let input = screen.getByTestId('inline-edit-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'First' } })
    act(() => { fireEvent.keyDown(input, { key: 'Enter' }) })

    input = screen.getByTestId('inline-edit-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Second' } })
    act(() => { fireEvent.keyDown(input, { key: 'Enter' }) })

    input = screen.getByTestId('inline-edit-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Third' } })
    act(() => { fireEvent.keyDown(input, { key: 'Escape' }) })

    const texts = visibleTexts()
    const firstIdx = texts.indexOf('First')
    const secondIdx = texts.indexOf('Second')
    const thirdIdx = texts.indexOf('Third')
    expect(firstIdx).toBeGreaterThan(-1)
    expect(secondIdx).toBe(firstIdx + 1)
    expect(thirdIdx).toBe(secondIdx + 1)
  })

  it('rapid Enter then Enter-on-empty archives the blank and stops', () => {
    seedOutline()
    const lastId = state.getVisibleItems()[state.getVisibleItems().length - 1].id
    state.setCursor(lastId)
    renderApp()

    const countBefore = state.getVisibleItems().length

    fire('o')
    let input = screen.getByTestId('inline-edit-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Item A' } })
    act(() => { fireEvent.keyDown(input, { key: 'Enter' }) })

    // Now on empty new item — Enter should archive it and stop
    input = screen.getByTestId('inline-edit-input') as HTMLInputElement
    expect(input.value).toBe('')
    act(() => { fireEvent.keyDown(input, { key: 'Enter' }) })

    expect(state.editingItemId).toBeNull()
    // Only "Item A" was added, the blank was archived
    expect(state.getVisibleItems().length).toBe(countBefore + 1)
    expect(visibleTexts()).toContain('Item A')
  })

  it('h collapses subtree, l expands it', () => {
    const { welcome } = seedOutline()
    renderApp()

    expect(visibleTexts()).toContain('Child one')
    expect(visibleTexts()).toContain('Child two')

    fire('h')
    expect(state.getItem(welcome)!.isCollapsed).toBe(true)
    expect(visibleTexts()).not.toContain('Child one')
    expect(visibleTexts()).not.toContain('Child two')
    expect(visibleTexts()).toContain('Standalone')

    fire('l')
    expect(state.getItem(welcome)!.isCollapsed).toBe(false)
    expect(visibleTexts()).toContain('Child one')
    expect(visibleTexts()).toContain('Child two')
  })

  it('Tab indents item under previous sibling, Shift+Tab outdents', () => {
    const { child1, child2 } = seedOutline()
    state.setCursor(child2)
    renderApp()

    // Tab should indent child2 under child1
    fire('Tab')
    expect(state.getItem(child2)!.parentId).toBe(child1)

    // Shift+Tab outdents back
    fire('Tab', { shiftKey: true })
    expect(state.getItem(child2)!.parentId).not.toBe(child1)
  })

  it('Backspace archives empty item', () => {
    const { child1 } = seedOutline()
    state.setCursor(child1)
    renderApp()

    const countBefore = state.getVisibleItems().length

    // child1 has content — Backspace should NOT archive
    fire('Backspace')
    expect(state.getItem(child1)!.isArchived).toBe(false)

    // Clear content then Backspace
    act(() => { setContent(state, um, child1, '') })
    fire('Backspace')
    expect(state.getItem(child1)!.isArchived).toBe(true)
    expect(state.getVisibleItems().length).toBe(countBefore - 1)
  })

  it('Ctrl+Z undoes, Ctrl+Shift+Z redoes', () => {
    const { welcome } = seedOutline()
    renderApp()

    fire(' ')
    expect(state.getItem(welcome)!.isCompleted).toBe(true)

    fire('z', { ctrlKey: true })
    expect(state.getItem(welcome)!.isCompleted).toBe(false)

    fire('z', { ctrlKey: true, shiftKey: true })
    expect(state.getItem(welcome)!.isCompleted).toBe(true)
  })

  it('Ctrl+ArrowUp/Down reorders items', () => {
    const { standalone } = seedOutline()
    state.setCursor(standalone)
    renderApp()

    const textsBefore = visibleTexts()
    const standaloneIdx = textsBefore.indexOf('Standalone')

    fire('ArrowUp', { ctrlKey: true })
    const textsAfter = visibleTexts()
    const newIdx = textsAfter.indexOf('Standalone')
    expect(newIdx).toBeLessThan(standaloneIdx)
  })

  it('o does not leak keystroke into new edit input', () => {
    seedOutline()
    renderApp()

    fire('o')

    const newId = state.editingItemId!
    expect(state.getItem(newId)!.content).toBe('')
  })

  it('edit mode blocks navigation keys', () => {
    const { welcome } = seedOutline()
    renderApp()

    fire('Enter')
    expect(state.editingItemId).toBe(welcome)
    const cursor = state.cursorItemId

    fire('j')
    expect(state.cursorItemId).toBe(cursor)

    fire(' ')
    expect(state.getItem(welcome)!.isCompleted).toBe(false)
  })

  it('blur commits content when still editing', () => {
    const { child1 } = seedOutline()
    state.setCursor(child1)
    renderApp()

    fire('Enter')
    const input = screen.getByTestId('inline-edit-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'blur-saved' } })
    act(() => { fireEvent.blur(input) })

    expect(state.editingItemId).toBeNull()
    expect(state.getItem(child1)!.content).toBe('blur-saved')
  })

  it('blur after Escape does not double-commit', () => {
    const { child1 } = seedOutline()
    state.setCursor(child1)
    renderApp()

    fire('Enter')
    const input = screen.getByTestId('inline-edit-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'esc-value' } })

    act(() => { fireEvent.keyDown(input, { key: 'Escape' }) })
    expect(state.getItem(child1)!.content).toBe('esc-value')

    act(() => { fireEvent.blur(input) })
    expect(state.getItem(child1)!.content).toBe('esc-value')
    expect(state.editingItemId).toBeNull()
  })

  it('full session: navigate, create, edit, complete, collapse, undo', () => {
    const { welcome, standalone } = seedOutline()
    renderApp()

    // 1. Navigate down to Standalone
    fire('j') // → child1
    fire('j') // → child2
    fire('j') // → standalone
    expect(state.cursorItemId).toBe(standalone)

    // 2. Create a new item below Standalone
    fire('o')
    const newId = state.editingItemId!
    const input = screen.getByTestId('inline-edit-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'New task' } })
    act(() => { fireEvent.keyDown(input, { key: 'Escape' }) })
    expect(state.getItem(newId)!.content).toBe('New task')

    // 3. Complete it
    fire(' ')
    expect(state.getItem(newId)!.isCompleted).toBe(true)

    // 4. Navigate back to Welcome and collapse
    fire('k') // → standalone
    fire('k') // → child2
    fire('k') // → child1
    fire('k') // → welcome
    expect(state.cursorItemId).toBe(welcome)
    fire('h')
    expect(state.getItem(welcome)!.isCollapsed).toBe(true)
    expect(visibleTexts()).not.toContain('Child one')

    // 5. Undo collapse
    fire('z', { ctrlKey: true })
    expect(state.getItem(welcome)!.isCollapsed).toBe(false)
    expect(visibleTexts()).toContain('Child one')
  })
})
