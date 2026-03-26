import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { registerRootStore, getSnapshot } from 'mobx-keystone'
import { AppState, OutlineItem } from './model'
import {
  saveState,
  loadState,
  applyLoadedSnapshot,
  exportStateAsJSON,
  downloadExportJson,
  closeDB,
} from './persistence'
import { createAppState, loadAppState, insertBelow, setContent, indentItem } from './api'
import { deleteDB } from 'idb'

/** Create a fresh registered AppState for testing. */
function createTestState(): AppState {
  const state = new AppState({})
  registerRootStore(state)
  return state
}

/** Build a state with some items for round-trip testing. */
function populateState(state: AppState): void {
  const item1 = new OutlineItem({
    id: crypto.randomUUID(),
    content: 'First item',
    parentId: null,
    sortOrder: 'a0',
    isCompleted: false,
    isCollapsed: false,
    isArchived: false,
    note: 'A note',
  })
  const item2 = new OutlineItem({
    id: crypto.randomUUID(),
    content: 'Second item',
    parentId: null,
    sortOrder: 'a1',
    isCompleted: true,
    isCollapsed: false,
    isArchived: false,
    note: '',
  })
  const child = new OutlineItem({
    id: crypto.randomUUID(),
    content: 'Child of first',
    parentId: item1.id,
    sortOrder: 'a0',
    isCompleted: false,
    isCollapsed: true,
    isArchived: false,
    note: 'child note',
  })

  state.items.set(item1.id, item1)
  state.items.set(item2.id, item2)
  state.items.set(child.id, child)
  state.setTitle('Test Outline')
  state.setCursor(item1.id)
}

beforeEach(async () => {
  // Ensure a clean database for each test
  closeDB()
  await deleteDB('vistanest')
})

afterEach(async () => {
  closeDB()
  await deleteDB('vistanest')
})

describe('persistence — round-trip', () => {
  it('saves a snapshot and loads it back with identical data', async () => {
    const state = createTestState()
    populateState(state)
    const originalSnapshot = getSnapshot(state)

    await saveState(state)
    const loaded = await loadState()

    expect(loaded).not.toBeNull()
    expect(loaded).toEqual(originalSnapshot)
  })

  it('applies loaded snapshot onto a fresh AppState', async () => {
    const state = createTestState()
    populateState(state)
    const originalItemCount = state.items.size
    const originalTitle = state.title

    await saveState(state)

    // Create a fresh empty state and apply the snapshot
    const freshState = createTestState()
    expect(freshState.items.size).toBe(0)

    const snapshot = await loadState()
    expect(snapshot).not.toBeNull()
    applyLoadedSnapshot(freshState, snapshot!)

    expect(freshState.title).toBe(originalTitle)
    expect(freshState.items.size).toBe(originalItemCount)

    // Verify item content survived
    for (const item of state.items.values()) {
      const restored = freshState.getItem(item.id)
      expect(restored).toBeDefined()
      expect(restored!.content).toBe(item.content)
      expect(restored!.parentId).toBe(item.parentId)
      expect(restored!.isCompleted).toBe(item.isCompleted)
      expect(restored!.isCollapsed).toBe(item.isCollapsed)
      expect(restored!.note).toBe(item.note)
    }
  })

  it('overwrites previous snapshot on second save', async () => {
    const state = createTestState()
    populateState(state)
    await saveState(state)

    // Modify and save again
    state.setTitle('Updated Title')
    await saveState(state)

    const loaded = await loadState()
    const snap = loaded as Record<string, unknown>
    expect(snap.title).toBe('Updated Title')
  })
})

describe('persistence — empty DB', () => {
  it('loadState returns null when no data has been saved', async () => {
    const result = await loadState()
    expect(result).toBeNull()
  })
})

describe('persistence — exportStateAsJSON', () => {
  it('produces valid JSON matching the snapshot', () => {
    const state = createTestState()
    populateState(state)

    const json = exportStateAsJSON(state)
    const parsed = JSON.parse(json)
    const snapshot = getSnapshot(state)

    expect(parsed).toEqual(snapshot)
  })

  it('exports empty state as valid JSON', () => {
    const state = createTestState()
    const json = exportStateAsJSON(state)
    const parsed = JSON.parse(json)

    expect(parsed.title).toBe('Untitled')
  })
})

// ---------------------------------------------------------------------------
// loadAppState — hydrate from snapshot
// ---------------------------------------------------------------------------

describe('loadAppState — hydrate from IDB snapshot', () => {
  it('hydrates an AppState from a saved snapshot with all data intact', async () => {
    const original = createAppState()
    const item1 = insertBelow(original.state, original.undoManager)
    setContent(original.state, original.undoManager, item1, 'Saved item')
    const item2 = insertBelow(original.state, original.undoManager, item1)
    setContent(original.state, original.undoManager, item2, 'Another item')
    indentItem(original.state, original.undoManager, item2)

    await saveState(original.state)

    // Load and hydrate
    const snapshot = await loadState()
    expect(snapshot).not.toBeNull()

    const hydrated = loadAppState(snapshot!)
    expect(hydrated.state.items.size).toBe(original.state.items.size)

    // Verify content survived
    const hydratedItem = hydrated.state.getItem(item1)
    expect(hydratedItem).toBeDefined()
    expect(hydratedItem!.content).toBe('Saved item')

    // Verify nested structure survived
    const hydratedChild = hydrated.state.getItem(item2)
    expect(hydratedChild).toBeDefined()
    expect(hydratedChild!.parentId).toBe(item1)
  })

  it('produces a state with cleared undo history', async () => {
    const original = createAppState()
    insertBelow(original.state, original.undoManager)
    await saveState(original.state)

    const snapshot = await loadState()
    const hydrated = loadAppState(snapshot!)

    // Undo history should be empty — hydration is not undoable
    expect(hydrated.undoManager.canUndo).toBe(false)
  })

  it('produces a state that supports new operations with undo', async () => {
    const original = createAppState()
    const firstId = insertBelow(original.state, original.undoManager)
    setContent(original.state, original.undoManager, firstId, 'Original')
    await saveState(original.state)

    const snapshot = await loadState()
    const hydrated = loadAppState(snapshot!)

    // New operations should work and be undoable
    const newId = insertBelow(hydrated.state, hydrated.undoManager)
    setContent(hydrated.state, hydrated.undoManager, newId, 'New item')

    expect(hydrated.state.items.size).toBe(2)
    expect(hydrated.undoManager.canUndo).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// downloadExportJson — browser download trigger
// ---------------------------------------------------------------------------

describe('downloadExportJson — triggers browser download', () => {
  it('creates a blob URL, clicks a hidden anchor, and cleans up', () => {
    const state = createTestState()
    populateState(state)

    const fakeUrl = 'blob:http://localhost/fake-blob-id'
    const createObjectURLSpy = vi.fn().mockReturnValue(fakeUrl)
    const revokeObjectURLSpy = vi.fn()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    })

    const clickSpy = vi.fn()
    const fakeAnchor = {
      href: '',
      download: '',
      style: { display: '' },
      click: clickSpy,
    } as unknown as HTMLAnchorElement

    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(fakeAnchor as any)
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockReturnValue(fakeAnchor)
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockReturnValue(fakeAnchor)

    downloadExportJson(state)

    // Verify anchor was created correctly
    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(fakeAnchor.href).toBe(fakeUrl)
    expect(fakeAnchor.download).toMatch(/^vistanest-export-\d{4}-\d{2}-\d{2}\.json$/)
    expect(fakeAnchor.style.display).toBe('none')

    // Verify Blob was created and passed to createObjectURL
    expect(createObjectURLSpy).toHaveBeenCalledOnce()
    const blob = createObjectURLSpy.mock.calls[0][0] as Blob
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('application/json')

    // Verify click was triggered
    expect(clickSpy).toHaveBeenCalledOnce()

    // Verify cleanup
    expect(appendChildSpy).toHaveBeenCalledWith(fakeAnchor)
    expect(removeChildSpy).toHaveBeenCalledWith(fakeAnchor)
    expect(revokeObjectURLSpy).toHaveBeenCalledWith(fakeUrl)

    // Restore mocks
    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
    vi.unstubAllGlobals()
  })
})
