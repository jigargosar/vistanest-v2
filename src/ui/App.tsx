import { useState, useEffect, useCallback, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { onSnapshot, getSnapshot, applySnapshot } from 'mobx-bonsai'
import { createUndoableDocument } from '../undo/undo-manager'
import { saveDocument, loadDocument } from '../persistence/persistence'
import { TOutlineDocument } from '../core/outline-document'
import { TOutlineItem } from '../core/outline-item'
import { findItemById } from '../core/tree-helpers'
import { KeyboardManager } from '../keyboard/keyboard-manager'
import { OutlineView } from './OutlineView'
import { Toast } from './Toast'

export const App = observer(function App() {
    const [{ doc, undoManager }] = useState(() => createUndoableDocument('My First List'))
    const [keyboard] = useState(() => new KeyboardManager())
    const [toastMessage, setToastMessage] = useState<string | null>(null)
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Load saved state on mount
    useEffect(() => {
        loadDocument(doc.id).then((saved) => {
            if (saved) {
                applySnapshot(doc, saved)
            }
        })
    }, [doc])

    // Auto-save debounced on every change
    useEffect(() => {
        const dispose = onSnapshot(doc, () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
            saveTimerRef.current = setTimeout(() => {
                saveDocument(doc.id, getSnapshot(doc))
            }, 2000)
        })
        return () => dispose()
    }, [doc])

    const handleSaveContent = useCallback(
        (itemId: string, content: string) => {
            const item = findItemById(doc.root, itemId)
            if (item) TOutlineItem.setContent(item, content)
        },
        [doc],
    )

    const handleExitEdit = useCallback(() => {
        keyboard.exitEditMode()
    }, [keyboard])

    const handleEnterInEdit = useCallback(
        (itemId: string, content: string) => {
            const item = findItemById(doc.root, itemId)
            if (item) TOutlineItem.setContent(item, content)
            TOutlineDocument.insertItemBelow(doc)
            // Stay in edit mode for the new item
        },
        [doc],
    )

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (keyboard.mode === 'edit') {
                // Edit mode keys are handled by ItemEditor
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
                if (undoManager.canUndo) {
                    undoManager.undo()
                    setToastMessage('Undo')
                }
            } else if ((e.key === 'z' && ctrl && e.shiftKey) || (e.key === 'Z' && ctrl)) {
                if (undoManager.canRedo) {
                    undoManager.redo()
                    setToastMessage('Redo')
                }
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
            <OutlineView
                doc={doc}
                isEditing={keyboard.mode === 'edit'}
                onSaveContent={handleSaveContent}
                onExitEdit={handleExitEdit}
                onEnterInEdit={handleEnterInEdit}
            />
            <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
        </div>
    )
})
