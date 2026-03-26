import { useState, useEffect, useRef, useCallback } from 'react'
import { onSnapshot } from 'mobx-keystone'
import {
  createAppState,
  loadAppState,
  insertBelow,
  setContent,
  indentItem,
} from '../core/api'
import { loadState, saveState } from '../core/persistence'
import { OutlineProvider, type AppContext } from './context'
import { OutlineView } from './OutlineView'
import { KeyboardHandlerHost } from './KeyboardHandlerHost'
import { Topbar } from './Topbar'
import { StatusBar } from './StatusBar'

// ---------------------------------------------------------------------------
// Auto-save debounce interval (ms)
// ---------------------------------------------------------------------------

const AUTO_SAVE_DELAY = 2000

// ---------------------------------------------------------------------------
// Demo seed — shown on first launch when IDB is empty
// ---------------------------------------------------------------------------

function createDemoSeed(): AppContext {
  const { state, undoManager } = createAppState()

  // Root: Welcome header
  const welcome = insertBelow(state, undoManager)
  setContent(state, undoManager, welcome, '🌲 Welcome to VistaNest')

  // Children of welcome
  const nav = insertBelow(state, undoManager, welcome)
  setContent(state, undoManager, nav, 'Navigate: j ↓ / k ↑ to move between items')
  indentItem(state, undoManager, nav)

  const edit = insertBelow(state, undoManager, nav)
  setContent(state, undoManager, edit, 'Edit: Enter to start editing, Esc to save')

  const insert = insertBelow(state, undoManager, edit)
  setContent(state, undoManager, insert, 'Insert: o adds below, O adds above')

  const organize = insertBelow(state, undoManager, insert)
  setContent(state, undoManager, organize, 'Organize: Tab indents, Shift+Tab outdents')

  const undo = insertBelow(state, undoManager, organize)
  setContent(state, undoManager, undo, 'Undo / Redo: u to undo, Ctrl+r to redo')

  // Root: Try it out
  const tryIt = insertBelow(state, undoManager, welcome)
  setContent(state, undoManager, tryIt, '✏️ Try it out')

  const task1 = insertBelow(state, undoManager, tryIt)
  setContent(state, undoManager, task1, 'Press j to move here, then Enter to edit this text')
  indentItem(state, undoManager, task1)

  const task2 = insertBelow(state, undoManager, task1)
  setContent(state, undoManager, task2, 'Press o to add a new item below')

  const task3 = insertBelow(state, undoManager, task2)
  setContent(state, undoManager, task3, 'Press x to mark items complete ✓')

  // Set cursor to the welcome item
  state.setCursor(welcome)

  // Clear undo history so seed operations aren't undoable
  undoManager.clearUndo()

  return { state, undoManager }
}

// ---------------------------------------------------------------------------
// App component — async bootstrap
// ---------------------------------------------------------------------------

export function App() {
  const [ctx, setCtx] = useState<AppContext | null>(null)
  const [loading, setLoading] = useState(true)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const disposerRef = useRef<(() => void) | null>(null)

  // Debounced auto-save
  const debouncedSave = useCallback((context: AppContext) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = setTimeout(() => {
      saveState(context.state).catch((err) => {
        console.warn('[VistaNest] auto-save failed:', err)
      })
    }, AUTO_SAVE_DELAY)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      let appCtx: AppContext

      try {
        const snapshot = await loadState()
        if (cancelled) return

        if (snapshot) {
          // Hydrate from saved state
          appCtx = loadAppState(snapshot)
        } else {
          // First launch — seed demo
          appCtx = createDemoSeed()
        }
      } catch (err) {
        // IDB load error — fall back to demo seed
        console.warn('[VistaNest] Failed to load from IndexedDB, starting fresh:', err)
        if (cancelled) return
        appCtx = createDemoSeed()
      }

      if (cancelled) return

      // Wire onSnapshot listener for auto-save AFTER initial load
      disposerRef.current = onSnapshot(appCtx.state, () => {
        debouncedSave(appCtx)
      })

      setCtx(appCtx)
      setLoading(false)
    }

    bootstrap()

    return () => {
      cancelled = true
      if (disposerRef.current) disposerRef.current()
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [debouncedSave])

  if (loading || !ctx) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <span className="text-text-secondary font-body text-sm animate-pulse">
          Loading…
        </span>
      </div>
    )
  }

  return (
    <OutlineProvider value={ctx}>
      <KeyboardHandlerHost />
      <div className="min-h-screen bg-bg text-text-primary font-body">
        {/* Fixed topbar */}
        <Topbar />

        {/* Scrollable content area — padded to clear fixed bars */}
        <main className="pt-16 pb-12 px-4 mx-auto" style={{ maxWidth: '900px' }}>
          <h1 className="font-heading text-xl font-bold mb-4 text-text-primary">
            {ctx.state.title}
          </h1>
          <OutlineView />
        </main>

        {/* Fixed status bar */}
        <StatusBar />
      </div>
    </OutlineProvider>
  )
}
