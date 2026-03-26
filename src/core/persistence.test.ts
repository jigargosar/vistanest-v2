import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { registerRootStore, getSnapshot } from 'mobx-keystone'
import { AppState, OutlineItem } from './model'
import {
  saveState,
  loadState,
  applyLoadedSnapshot,
  exportStateAsJSON,
  closeDB,
} from './persistence'
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
