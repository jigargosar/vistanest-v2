import { describe, it, expect } from 'vitest'
import { AppStore } from './app-store'

describe('AppStore', () => {
    it('starts with one document', () => {
        const store = new AppStore()
        expect(store.documents.length).toBe(1)
        expect(store.currentDocument).toBeDefined()
    })

    it('creates a new document and switches to it', () => {
        const store = new AppStore()
        const firstId = store.currentDocument.id
        store.createDocument('Second List')
        expect(store.documents.length).toBe(2)
        expect(store.currentDocument.id).not.toBe(firstId)
    })

    it('switches between documents', () => {
        const store = new AppStore()
        const firstId = store.currentDocument.id
        store.createDocument('Second')
        store.switchToDocument(firstId)
        expect(store.currentDocument.id).toBe(firstId)
    })

    it('does not delete the last document', () => {
        const store = new AppStore()
        const id = store.currentDocument.id
        store.deleteDocument(id)
        expect(store.documents.length).toBe(1)
    })

    it('deletes a document and switches to another', () => {
        const store = new AppStore()
        const firstId = store.currentDocument.id
        store.createDocument('Second')
        const secondId = store.currentDocument.id
        store.deleteDocument(secondId)
        expect(store.documents.length).toBe(1)
        expect(store.currentDocument.id).toBe(firstId)
    })
})
