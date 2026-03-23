import { useState, useEffect, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { createUndoableDocument } from '../undo/undo-manager'
import { TOutlineDocument } from '../core/outline-document'
import { TOutlineItem } from '../core/outline-item'
import { findItemById } from '../core/tree-helpers'
import { KeyboardManager } from '../keyboard/keyboard-manager'
import { OutlineView } from './OutlineView'

export const App = observer(function App() {
    const [{ doc, undoManager }] = useState(() => createUndoableDocument('My First List'))
    const [keyboard] = useState(() => new KeyboardManager())

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (keyboard.mode === 'edit') {
                if (e.key === 'Escape') {
                    keyboard.exitEditMode()
                    e.preventDefault()
                }
                return
            }

            // Normal mode
            let handled = true
            const ctrl = e.ctrlKey || e.metaKey

            if (e.key === 'j') {
                TOutlineDocument.moveCursorDown(doc)
            } else if (e.key === 'k') {
                TOutlineDocument.moveCursorUp(doc)
            } else if (e.key === 'o' && !ctrl) {
                TOutlineDocument.insertItemBelow(doc)
                keyboard.enterEditMode()
            } else if (e.key === 'O') {
                TOutlineDocument.insertItemAbove(doc)
                keyboard.enterEditMode()
            } else if (e.key === 'Enter') {
                keyboard.enterEditMode()
            } else if (e.key === 'Tab' && !e.shiftKey) {
                TOutlineDocument.indentItem(doc)
            } else if (e.key === 'Tab' && e.shiftKey) {
                TOutlineDocument.outdentItem(doc)
            } else if (e.key === ' ') {
                const item = findItemById(doc.root, doc.cursorItemId)
                if (item) TOutlineItem.toggleComplete(item)
            } else if (e.key === 'h') {
                TOutlineDocument.toggleCollapse(doc)
            } else if (e.key === 'l') {
                TOutlineDocument.toggleCollapse(doc)
            } else if (e.key === 'z' && ctrl && !e.shiftKey) {
                undoManager.undo()
            } else if (e.key === 'z' && ctrl && e.shiftKey) {
                undoManager.redo()
            } else if (e.key === 'Z' && ctrl) {
                undoManager.redo()
            } else if (e.key === 'ArrowUp' && ctrl) {
                TOutlineDocument.moveItemUp(doc)
            } else if (e.key === 'ArrowDown' && ctrl) {
                TOutlineDocument.moveItemDown(doc)
            } else {
                handled = false
            }

            if (handled) {
                e.preventDefault()
            }
        },
        [doc, undoManager, keyboard],
    )

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 p-4 max-w-3xl mx-auto">
            <div className="text-xs text-gray-500 mb-2">Mode: {keyboard.mode}</div>
            <OutlineView doc={doc} />
        </div>
    )
})
