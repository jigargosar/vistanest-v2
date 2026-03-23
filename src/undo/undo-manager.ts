import { UndoManager } from 'mobx-bonsai'
import { createDocument } from '../core/outline-document'

export function createUndoableDocument(title: string, options?: { groupingDebounceMs?: number }) {
    const doc = createDocument(title)
    const undoManager = new UndoManager({
        rootNode: doc,
        groupingDebounceMs: options?.groupingDebounceMs ?? 500,
    })
    return { doc, undoManager }
}
