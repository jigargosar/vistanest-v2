import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'vistanest'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb() {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('documents')) {
                    db.createObjectStore('documents')
                }
                if (!db.objectStoreNames.contains('checkpoints')) {
                    db.createObjectStore('checkpoints', { keyPath: 'id' })
                }
            },
        })
    }
    return dbPromise
}

export async function saveDocument(id: string, snapshot: unknown) {
    const db = await getDb()
    await db.put('documents', snapshot, id)
}

export async function loadDocument(id: string) {
    const db = await getDb()
    return db.get('documents', id)
}

export async function listDocumentIds(): Promise<string[]> {
    const db = await getDb()
    const keys = await db.getAllKeys('documents')
    return keys as string[]
}

export async function deleteDocument(id: string) {
    const db = await getDb()
    await db.delete('documents', id)
}
