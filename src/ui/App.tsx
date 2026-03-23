import { useState, useEffect, useCallback, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { onSnapshot, getSnapshot, applySnapshot } from 'mobx-bonsai'
import { TOutlineDocument } from '../core/outline-document'
import { TOutlineItem } from '../core/outline-item'
import { findItemById } from '../core/tree-helpers'
import { KeyboardManager } from '../keyboard/keyboard-manager'
import { ActivityDetector } from '../checkpoints/activity-detector'
import { CheckpointStore } from '../checkpoints/checkpoint-store'
import { AppStore } from '../store/app-store'
import { saveDocument, loadDocument } from '../persistence/persistence'
import { OutlineView } from './OutlineView'
import { Toast } from './Toast'
import { CheckpointPanel } from './CheckpointPanel'
import { ListSwitcher } from './ListSwitcher'

export const App = observer(function App() {
    const [appStore] = useState(() => new AppStore())
    const [keyboard] = useState(() => new KeyboardManager())
    const [checkpointStore] = useState(() => new CheckpointStore())
    const [toastMessage, setToastMessage] = useState<string | null>(null)
    const [checkpointPanelOpen, setCheckpointPanelOpen] = useState(false)
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const activityDetectorRef = useRef<ActivityDetector | null>(null)
    const snapshotDisposeRef = useRef<(() => void) | null>(null)

    const doc = appStore.currentDocument
    const undoManager = appStore.currentUndoManager

    // Setup auto-save + activity detector for current document
    useEffect(() => {
        // Clean up previous
        snapshotDisposeRef.current?.()
        activityDetectorRef.current?.dispose()

        const detector = new ActivityDetector({
            inactivityMs: 30000,
            onBurst: () => {
                checkpointStore.createCheckpoint(getSnapshot(doc), null)
                setToastMessage('Auto-checkpoint saved')
            },
        })
        activityDetectorRef.current = detector

        const dispose = onSnapshot(doc, () => {
            detector.recordActivity()
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
            saveTimerRef.current = setTimeout(() => {
                saveDocument(doc.id, getSnapshot(doc))
            }, 2000)
        })
        snapshotDisposeRef.current = dispose

        // Load saved state
        loadDocument(doc.id).then((saved) => {
            if (saved) applySnapshot(doc, saved as object)
        })

        return () => {
            dispose()
            detector.dispose()
        }
    }, [doc, checkpointStore])

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
        },
        [doc],
    )

    const handleRestoreCheckpoint = useCallback(
        (snapshot: unknown) => {
            applySnapshot(doc, snapshot as object)
            setCheckpointPanelOpen(false)
            setToastMessage('Checkpoint restored')
        },
        [doc],
    )

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (keyboard.mode === 'edit') return

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
            } else if (e.key === 'c' && ctrl && e.shiftKey) {
                checkpointStore.createCheckpoint(getSnapshot(doc), 'Manual checkpoint')
                setToastMessage('Checkpoint saved')
            } else if (e.key === 'p' && ctrl && e.shiftKey) {
                setCheckpointPanelOpen((prev) => !prev)
            } else {
                handled = false
            }

            if (handled) e.preventDefault()
        },
        [doc, undoManager, keyboard, checkpointStore],
    )

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 p-4 max-w-3xl mx-auto">
            <ListSwitcher store={appStore} />
            <div className="text-xs text-gray-500 mb-2">Mode: {keyboard.mode}</div>
            <OutlineView
                doc={doc}
                isEditing={keyboard.mode === 'edit'}
                onSaveContent={handleSaveContent}
                onExitEdit={handleExitEdit}
                onEnterInEdit={handleEnterInEdit}
            />
            <CheckpointPanel
                store={checkpointStore}
                isOpen={checkpointPanelOpen}
                onClose={() => setCheckpointPanelOpen(false)}
                onRestore={handleRestoreCheckpoint}
            />
            <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
        </div>
    )
})
