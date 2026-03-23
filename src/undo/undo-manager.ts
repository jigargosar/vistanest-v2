import { UndoManager, createUndoStore, applySnapshot, onSnapshot } from 'mobx-bonsai'
import { createDocument } from '../core/outline-document'

const SESSION_STORAGE_PREFIX = 'vistanest-undo-'

export function createUndoableDocument(title: string, options?: { groupingDebounceMs?: number }) {
    const doc = createDocument(title)

    // Try to restore undo store from sessionStorage
    const store = createUndoStore()
    const savedStoreJson = sessionStorage.getItem(SESSION_STORAGE_PREFIX + doc.id)
    if (savedStoreJson) {
        try {
            applySnapshot(store, JSON.parse(savedStoreJson))
        } catch {
            // Corrupt data — start fresh
        }
    }

    const undoManager = new UndoManager({
        rootNode: doc,
        store,
        groupingDebounceMs: options?.groupingDebounceMs ?? 500,
    })

    // Persist undo store to sessionStorage on changes
    onSnapshot(store, (snapshot) => {
        sessionStorage.setItem(SESSION_STORAGE_PREFIX + doc.id, JSON.stringify(snapshot))
    })

    return { doc, undoManager }
}
