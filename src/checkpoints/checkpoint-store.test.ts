import { describe, it, expect } from 'vitest'
import { CheckpointStore } from './checkpoint-store'

describe('CheckpointStore', () => {
    it('creates a checkpoint from a snapshot', () => {
        const store = new CheckpointStore()
        store.createCheckpoint({ id: 'doc1', title: 'Test' }, null)
        expect(store.checkpoints.length).toBe(1)
        expect(store.checkpoints[0].name).toBeNull()
        expect(store.checkpoints[0].snapshot).toEqual({ id: 'doc1', title: 'Test' })
    })

    it('creates a named checkpoint', () => {
        const store = new CheckpointStore()
        store.createCheckpoint({ id: 'doc1', title: 'Test' }, 'Before refactor')
        expect(store.checkpoints[0].name).toBe('Before refactor')
    })

    it('stores multiple checkpoints in order', () => {
        const store = new CheckpointStore()
        store.createCheckpoint({ v: 1 }, null)
        store.createCheckpoint({ v: 2 }, 'named')
        expect(store.checkpoints.length).toBe(2)
        expect(store.checkpoints[0].snapshot).toEqual({ v: 1 })
        expect(store.checkpoints[1].name).toBe('named')
    })
})
