import { useMemo } from 'react'
import { createAppState, insertBelow, setContent, indentItem } from '../core/api'
import { OutlineProvider } from './context'
import { OutlineView } from './OutlineView'

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
      <div className="min-h-screen bg-[#0c0c0e] text-[#e8e6e3] p-4">
        <h1 className="text-xl font-bold mb-4">{ctx.state.title}</h1>
        <OutlineView />
      </div>
    </OutlineProvider>
  )
}
