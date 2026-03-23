import { makeAutoObservable } from 'mobx'
import { UndoManager } from 'mobx-bonsai'
import { createDocument } from '../core/outline-document'
import type { OutlineDocument } from '../core/types'

export class AppStore {
    documents: OutlineDocument[] = []
    currentDocumentId: string = ''
    undoManagers: Map<string, UndoManager> = new Map()

    constructor() {
        makeAutoObservable(this)
        this.createDocument('My First List')
    }

    get currentDocument(): OutlineDocument {
        return this.documents.find((d) => d.id === this.currentDocumentId)!
    }

    get currentUndoManager(): UndoManager {
        return this.undoManagers.get(this.currentDocumentId)!
    }

    createDocument(title: string) {
        const doc = createDocument(title)
        const undoManager = new UndoManager({
            rootNode: doc,
            groupingDebounceMs: 500,
        })
        this.documents.push(doc)
        this.undoManagers.set(doc.id, undoManager)
        this.currentDocumentId = doc.id
    }

    switchToDocument(id: string) {
        if (this.documents.some((d) => d.id === id)) {
            this.currentDocumentId = id
        }
    }

    deleteDocument(id: string) {
        if (this.documents.length <= 1) return
        const idx = this.documents.findIndex((d) => d.id === id)
        if (idx === -1) return
        this.documents.splice(idx, 1)
        this.undoManagers.get(id)?.dispose()
        this.undoManagers.delete(id)
        if (this.currentDocumentId === id) {
            this.currentDocumentId = this.documents[0].id
        }
    }
}
