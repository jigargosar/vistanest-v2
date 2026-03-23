import { describe, it, expect } from 'vitest'
import { createDocument, TOutlineDocument } from './outline-document'
import { findItemById } from './tree-helpers'

describe('createDocument', () => {
    it('creates a document with a root item and cursor on it', () => {
        const doc = createDocument('My List')
        expect(doc.title).toBe('My List')
        expect(doc.root.children.length).toBe(1)
        expect(doc.cursorItemId).toBe(doc.root.children[0].id)
    })
})

describe('TOutlineDocument.insertItemBelow', () => {
    it('inserts a new item below cursor and moves cursor to it', () => {
        const doc = createDocument('Test')
        const originalId = doc.cursorItemId
        TOutlineDocument.insertItemBelow(doc)
        expect(doc.root.children.length).toBe(2)
        expect(doc.cursorItemId).not.toBe(originalId)
        expect(doc.root.children[1].id).toBe(doc.cursorItemId)
    })
})

describe('TOutlineDocument.insertItemAbove', () => {
    it('inserts a new item above cursor and moves cursor to it', () => {
        const doc = createDocument('Test')
        const originalId = doc.cursorItemId
        TOutlineDocument.insertItemAbove(doc)
        expect(doc.root.children.length).toBe(2)
        expect(doc.cursorItemId).not.toBe(originalId)
        expect(doc.root.children[0].id).toBe(doc.cursorItemId)
    })
})

describe('TOutlineDocument.deleteItem', () => {
    it('deletes cursor item and moves cursor to sibling', () => {
        const doc = createDocument('Test')
        TOutlineDocument.insertItemBelow(doc)
        const secondId = doc.cursorItemId
        TOutlineDocument.deleteItem(doc)
        expect(findItemById(doc.root, secondId)).toBeUndefined()
        expect(doc.cursorItemId).toBeDefined()
        expect(findItemById(doc.root, doc.cursorItemId)).toBeDefined()
    })

    it('does not delete the last remaining item', () => {
        const doc = createDocument('Test')
        const result = TOutlineDocument.deleteItem(doc)
        expect(result).toBeUndefined()
        expect(doc.root.children.length).toBe(1)
    })

    it('returns deleted item info', () => {
        const doc = createDocument('Test')
        TOutlineDocument.insertItemBelow(doc)
        const itemId = doc.cursorItemId
        const deleted = TOutlineDocument.deleteItem(doc)
        expect(deleted).toBeDefined()
        expect(deleted!.item.id).toBe(itemId)
        expect(deleted!.deletedFromIndex).toBe(1)
    })
})

describe('TOutlineDocument.moveCursorDown', () => {
    it('moves cursor to next visible item', () => {
        const doc = createDocument('Test')
        const firstId = doc.cursorItemId
        TOutlineDocument.insertItemBelow(doc)
        const secondId = doc.cursorItemId
        // Move back to first
        TOutlineDocument.moveCursorUp(doc)
        expect(doc.cursorItemId).toBe(firstId)
        // Move down to second
        TOutlineDocument.moveCursorDown(doc)
        expect(doc.cursorItemId).toBe(secondId)
    })

    it('does nothing when at last item', () => {
        const doc = createDocument('Test')
        const firstId = doc.cursorItemId
        TOutlineDocument.moveCursorDown(doc)
        expect(doc.cursorItemId).toBe(firstId)
    })
})

describe('TOutlineDocument.moveCursorUp', () => {
    it('does nothing when at first item', () => {
        const doc = createDocument('Test')
        const firstId = doc.cursorItemId
        TOutlineDocument.moveCursorUp(doc)
        expect(doc.cursorItemId).toBe(firstId)
    })
})

describe('TOutlineDocument.indentItem', () => {
    it('makes current item a child of its previous sibling', () => {
        const doc = createDocument('Test')
        TOutlineDocument.insertItemBelow(doc)
        const secondId = doc.cursorItemId
        TOutlineDocument.indentItem(doc)
        expect(doc.root.children.length).toBe(1)
        expect(doc.root.children[0].children[0].id).toBe(secondId)
        expect(doc.cursorItemId).toBe(secondId)
    })

    it('does nothing for first item (no previous sibling)', () => {
        const doc = createDocument('Test')
        TOutlineDocument.indentItem(doc)
        expect(doc.root.children.length).toBe(1)
    })
})

describe('TOutlineDocument.outdentItem', () => {
    it('moves item out one level, placing after its parent', () => {
        const doc = createDocument('Test')
        TOutlineDocument.insertItemBelow(doc)
        TOutlineDocument.indentItem(doc)
        const itemId = doc.cursorItemId
        TOutlineDocument.outdentItem(doc)
        expect(doc.root.children.length).toBe(2)
        expect(doc.root.children[1].id).toBe(itemId)
    })

    it('does nothing for top-level items', () => {
        const doc = createDocument('Test')
        TOutlineDocument.outdentItem(doc)
        expect(doc.root.children.length).toBe(1)
    })
})

describe('TOutlineDocument.moveItemUp', () => {
    it('swaps item with previous sibling', () => {
        const doc = createDocument('Test')
        const firstId = doc.cursorItemId
        TOutlineDocument.insertItemBelow(doc)
        const secondId = doc.cursorItemId
        TOutlineDocument.moveItemUp(doc)
        expect(doc.root.children[0].id).toBe(secondId)
        expect(doc.root.children[1].id).toBe(firstId)
    })

    it('does nothing for first item', () => {
        const doc = createDocument('Test')
        const firstId = doc.cursorItemId
        TOutlineDocument.moveItemUp(doc)
        expect(doc.root.children[0].id).toBe(firstId)
    })
})

describe('TOutlineDocument.moveItemDown', () => {
    it('swaps item with next sibling', () => {
        const doc = createDocument('Test')
        const firstId = doc.cursorItemId
        TOutlineDocument.insertItemBelow(doc)
        TOutlineDocument.moveCursorUp(doc)
        TOutlineDocument.moveItemDown(doc)
        expect(doc.root.children[0].id).not.toBe(firstId)
        expect(doc.root.children[1].id).toBe(firstId)
    })

    it('does nothing for last item', () => {
        const doc = createDocument('Test')
        TOutlineDocument.moveItemDown(doc)
        expect(doc.root.children.length).toBe(1)
    })
})

describe('TOutlineDocument.toggleCollapse', () => {
    it('collapses cursor item', () => {
        const doc = createDocument('Test')
        TOutlineDocument.insertItemBelow(doc)
        TOutlineDocument.indentItem(doc)
        TOutlineDocument.moveCursorUp(doc)
        TOutlineDocument.toggleCollapse(doc)
        const parent = findItemById(doc.root, doc.cursorItemId)!
        expect(parent.isCollapsed).toBe(true)
    })

    it('skips collapsed children when navigating', () => {
        // Build: [A [B], C]
        const doc = createDocument('Test')
        const aId = doc.cursorItemId
        TOutlineDocument.insertItemBelow(doc) // cursor on B
        TOutlineDocument.indentItem(doc) // B is now child of A
        TOutlineDocument.moveCursorUp(doc) // cursor on A
        TOutlineDocument.insertItemBelow(doc) // cursor on C (sibling of A)
        const cId = doc.cursorItemId

        // Collapse A, navigate from A down — should skip B, land on C
        TOutlineDocument.moveCursorUp(doc) // cursor on B (visible child of A)
        TOutlineDocument.moveCursorUp(doc) // cursor on A
        expect(doc.cursorItemId).toBe(aId)
        TOutlineDocument.toggleCollapse(doc)
        TOutlineDocument.moveCursorDown(doc)
        expect(doc.cursorItemId).toBe(cId)
    })
})
