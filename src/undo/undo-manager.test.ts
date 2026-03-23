import { describe, it, expect } from 'vitest'
import { createUndoableDocument } from './undo-manager'
import { TOutlineDocument } from '../core/outline-document'

describe('UndoManager', () => {
    it('undoes an insertItemBelow', () => {
        const { doc, undoManager } = createUndoableDocument('Test', { groupingDebounceMs: 0 })
        expect(doc.root.children.length).toBe(1)
        TOutlineDocument.insertItemBelow(doc)
        expect(doc.root.children.length).toBe(2)
        undoManager.undo()
        expect(doc.root.children.length).toBe(1)
    })

    it('redoes after undo', () => {
        const { doc, undoManager } = createUndoableDocument('Test', { groupingDebounceMs: 0 })
        TOutlineDocument.insertItemBelow(doc)
        undoManager.undo()
        undoManager.redo()
        expect(doc.root.children.length).toBe(2)
    })

    it('restores cursor position on undo', () => {
        const { doc, undoManager } = createUndoableDocument('Test', { groupingDebounceMs: 0 })
        const originalCursorId = doc.cursorItemId
        TOutlineDocument.insertItemBelow(doc)
        expect(doc.cursorItemId).not.toBe(originalCursorId)
        undoManager.undo()
        expect(doc.cursorItemId).toBe(originalCursorId)
    })

    it('undoes indent', () => {
        const { doc, undoManager } = createUndoableDocument('Test', { groupingDebounceMs: 0 })
        TOutlineDocument.insertItemBelow(doc)
        TOutlineDocument.indentItem(doc)
        expect(doc.root.children.length).toBe(1)
        expect(doc.root.children[0].children.length).toBe(1)
        undoManager.undo()
        expect(doc.root.children.length).toBe(2)
    })

    it('undoes delete', () => {
        const { doc, undoManager } = createUndoableDocument('Test', { groupingDebounceMs: 0 })
        TOutlineDocument.insertItemBelow(doc)
        const secondId = doc.cursorItemId
        TOutlineDocument.deleteItem(doc)
        undoManager.undo()
        expect(doc.root.children.length).toBe(2)
        expect(doc.cursorItemId).toBe(secondId)
    })
})
