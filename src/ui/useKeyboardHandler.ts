import { useEffect } from 'react'
import { useAppState } from './context'
import {
  moveCursorUp,
  moveCursorDown,
  insertBelow,
  insertAbove,
  indentItem,
  outdentItem,
  moveItemUp,
  moveItemDown,
  toggleComplete,
  toggleCollapse,
  archiveItem,
  startEditing,
  undo,
  redo,
} from '../core/api'

/**
 * Document-level keyboard handler for navigation mode.
 *
 * When state.editingItemId is null (navigation mode), single keys are
 * dispatched as shortcuts. When non-null (edit mode), keys pass through
 * to the focused input — edit-mode handling is wired separately in T03.
 *
 * Called once from App.tsx; useEffect cleanup prevents double-binding
 * in React 19 StrictMode.
 */
export function useKeyboardHandler(): void {
  const { state, undoManager } = useAppState()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // In edit mode, let keys pass through to the input
      if (state.editingItemId !== null) return

      const cursorItemId = state.cursorItemId
      const ctrl = e.ctrlKey || e.metaKey

      // --- Undo / Redo (work even without cursor) ---
      if (ctrl && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        redo(undoManager)
        return
      }
      if (ctrl && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo(undoManager)
        return
      }

      // --- Ctrl+Arrow reorder ---
      if (ctrl && e.key === 'ArrowUp') {
        e.preventDefault()
        if (cursorItemId) moveItemUp(state, undoManager, cursorItemId)
        return
      }
      if (ctrl && e.key === 'ArrowDown') {
        e.preventDefault()
        if (cursorItemId) moveItemDown(state, undoManager, cursorItemId)
        return
      }

      // --- Navigation (no modifier required) ---
      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          moveCursorDown(state, undoManager)
          break

        case 'k':
        case 'ArrowUp':
          moveCursorUp(state, undoManager)
          break

        case 'o':
          if (cursorItemId) {
            const newId = insertBelow(state, undoManager, cursorItemId)
            startEditing(state, undoManager, newId)
          }
          break

        case 'O':
          // Shift+o — insertAbove
          if (cursorItemId) {
            const newId = insertAbove(state, undoManager, cursorItemId)
            startEditing(state, undoManager, newId)
          }
          break

        case 'Tab':
          e.preventDefault()
          if (!cursorItemId) break
          if (e.shiftKey) {
            outdentItem(state, undoManager, cursorItemId)
          } else {
            indentItem(state, undoManager, cursorItemId)
          }
          break

        case ' ':
          e.preventDefault()
          if (cursorItemId) toggleComplete(state, undoManager, cursorItemId)
          break

        case 'h':
        case 'l':
          if (cursorItemId) toggleCollapse(state, undoManager, cursorItemId)
          break

        case 'Backspace': {
          if (!cursorItemId) break
          const item = state.getItem(cursorItemId)
          if (item && item.content === '') {
            archiveItem(state, undoManager, cursorItemId)
          }
          break
        }

        case 'Enter':
          if (cursorItemId) startEditing(state, undoManager, cursorItemId)
          break

        default:
          // Unhandled key — let it propagate
          return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [state, undoManager])
}
