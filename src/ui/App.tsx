import { useMemo } from 'react'
import { createAppState, insertBelow, setContent, indentItem } from '../core/api'
import { OutlineProvider } from './context'
import { OutlineView } from './OutlineView'
import { KeyboardHandlerHost } from './KeyboardHandlerHost'
import { Topbar } from './Topbar'
import { StatusBar } from './StatusBar'

function seedInitialItems() {
  const { state, undoManager } = createAppState()

  // Seed 3 items: two root + one child, so depth indentation is visible
  const first = insertBelow(state, undoManager)
  setContent(state, undoManager, first, 'Welcome to VistaNest')

  const child = insertBelow(state, undoManager, first)
  setContent(state, undoManager, child, 'This is a nested item')
  indentItem(state, undoManager, child)

  const second = insertBelow(state, undoManager, first)
  setContent(state, undoManager, second, 'Press j/k to navigate')

  // Set cursor to first item
  state.setCursor(first)

  // Clear undo history so seed operations aren't undoable
  undoManager.clearUndo()

  return { state, undoManager }
}

export function App() {
  const ctx = useMemo(() => seedInitialItems(), [])

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
