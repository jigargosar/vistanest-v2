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
