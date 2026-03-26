import { openDB, type IDBPDatabase, type DBSchema } from 'idb'
import { getSnapshot, applySnapshot } from 'mobx-keystone'
import type { AppState } from './model'

// ---------------------------------------------------------------------------
// DB schema
// ---------------------------------------------------------------------------

const DB_NAME = 'vistanest'
const DB_VERSION = 1
const STORE_NAME = 'snapshots' as const
const SNAPSHOT_KEY = 'appState'

interface VistaNestDB extends DBSchema {
  [STORE_NAME]: {
    key: string
    value: {
      key: string
      snapshot: unknown
      savedAt: string
    }
  }
}

// ---------------------------------------------------------------------------
// Database lifecycle
// ---------------------------------------------------------------------------

let dbInstance: IDBPDatabase<VistaNestDB> | null = null

/** Open (or return cached) the VistaNest IndexedDB database. */
export async function getDB(): Promise<IDBPDatabase<VistaNestDB>> {
  if (dbInstance) return dbInstance
  dbInstance = await openDB<VistaNestDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    },
  })
  return dbInstance
}

/** Close the database connection and clear the cached instance. Useful in tests. */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

// ---------------------------------------------------------------------------
// Save / Load
// ---------------------------------------------------------------------------

/**
 * Persist the current AppState snapshot to IndexedDB.
 * Overwrites any previous snapshot.
 */
export async function saveState(state: AppState): Promise<void> {
  const db = await getDB()
  const snapshot = getSnapshot(state)
  await db.put(STORE_NAME, {
    key: SNAPSHOT_KEY,
    snapshot,
    savedAt: new Date().toISOString(),
  })
}

/**
 * Load the AppState snapshot from IndexedDB.
 * Returns null if no snapshot exists (first launch).
 */
export async function loadState(): Promise<unknown | null> {
  const db = await getDB()
  const record = await db.get(STORE_NAME, SNAPSHOT_KEY)
  if (!record) return null
  return record.snapshot
}

/**
 * Apply a loaded snapshot onto a live AppState instance.
 * This reconciles the existing state with the snapshot data.
 */
export function applyLoadedSnapshot(state: AppState, snapshot: unknown): void {
  applySnapshot(state, snapshot as Parameters<typeof applySnapshot<AppState>>[1])
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * Export the current AppState as a JSON string suitable for file download.
 */
export function exportStateAsJSON(state: AppState): string {
  const snapshot = getSnapshot(state)
  return JSON.stringify(snapshot, null, 2)
}
