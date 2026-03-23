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
import { CommandPalette } from './CommandPalette'
import { exportDocumentAsJson } from '../persistence/export'

export const App = observer(function App() {
    const [appStore] = useState(() => new AppStore())
    const [keyboard] = useState(() => new KeyboardManager())
    const [checkpointStore] = useState(() => new CheckpointStore())
    const [toastMessage, setToastMessage] = useState<string | null>(null)
    const [checkpointPanelOpen, setCheckpointPanelOpen] = useState(false)
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
    const pendingKeyRef = useRef<string | null>(null)
    const pendingKeyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const recentDeletionsRef = useRef<Array<{ item: unknown; parentId: string; index: number }>>([])
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

    const executeAction = useCallback(
        (action: string) => {
            const item = findItemById(doc.root, doc.cursorItemId)
            switch (action) {
                case 'moveCursorDown': TOutlineDocument.moveCursorDown(doc); break
                case 'moveCursorUp': TOutlineDocument.moveCursorUp(doc); break
                case 'insertItemBelow': TOutlineDocument.insertItemBelow(doc); keyboard.enterEditMode(); break
                case 'insertItemAbove': TOutlineDocument.insertItemAbove(doc); keyboard.enterEditMode(); break
                case 'enterEditMode': keyboard.enterEditMode(); break
                case 'indentItem': TOutlineDocument.indentItem(doc); break
                case 'outdentItem': TOutlineDocument.outdentItem(doc); break
                case 'toggleComplete': if (item) TOutlineItem.toggleComplete(item); break
                case 'toggleCollapse': TOutlineDocument.toggleCollapse(doc); break
                case 'undo': if (undoManager.canUndo) { undoManager.undo(); setToastMessage('Undo') }; break
                case 'redo': if (undoManager.canRedo) { undoManager.redo(); setToastMessage('Redo') }; break
                case 'moveItemUp': TOutlineDocument.moveItemUp(doc); break
                case 'moveItemDown': TOutlineDocument.moveItemDown(doc); break
                case 'deleteItem': {
                    const deleted = TOutlineDocument.deleteItem(doc)
                    if (deleted) {
                        recentDeletionsRef.current.push({
                            item: getSnapshot(deleted.item),
                            parentId: deleted.deletedFromParentId,
                            index: deleted.deletedFromIndex,
                        })
                    }
                    break
                }
                case 'restoreDeleted': {
                    const last = recentDeletionsRef.current.pop()
                    if (last) {
                        undoManager.undo()
                        setToastMessage('Restored deleted item')
                    } else {
                        setToastMessage('Nothing to restore')
                    }
                    break
                }
                case 'export': exportDocumentAsJson(doc); break
                case 'checkpoint': checkpointStore.createCheckpoint(getSnapshot(doc), 'Manual checkpoint'); setToastMessage('Checkpoint saved'); break
            }
        },
        [doc, undoManager, keyboard, checkpointStore],
    )

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (commandPaletteOpen) return
            if (keyboard.mode === 'edit') return

            const ctrl = e.ctrlKey || e.metaKey
            let handled = true

            // Double-letter combo detection
            if (pendingKeyRef.current) {
                const combo = pendingKeyRef.current + e.key
                if (pendingKeyTimerRef.current) clearTimeout(pendingKeyTimerRef.current)
                pendingKeyRef.current = null

                if (combo === 'dd') { executeAction('deleteItem'); e.preventDefault(); return }
                if (combo === 'ee') { executeAction('enterEditMode'); e.preventDefault(); return }
                if (combo === 'nn') {
                    // Toggle note — for now just enter edit mode
                    executeAction('enterEditMode'); e.preventDefault(); return
                }
                if (combo === 'hc') {
                    setToastMessage('Hide completed (not yet implemented)')
                    e.preventDefault(); return
                }
                if (combo === 'rd') {
                    executeAction('restoreDeleted')
                    e.preventDefault(); return
                }
                // Not a valid combo — execute the pending key's action first, then handle current
            }

            // Check if this key starts a combo
            if ((e.key === 'd' || e.key === 'e' || e.key === 'n' || e.key === 'h' || e.key === 'r') && !ctrl) {
                pendingKeyRef.current = e.key
                pendingKeyTimerRef.current = setTimeout(() => {
                    // Timeout — execute as single key
                    pendingKeyRef.current = null
                }, 400)
                e.preventDefault()
                return
            }

            if (e.key === '?') {
                setCommandPaletteOpen(true)
            } else if (e.key === 'j') {
                executeAction('moveCursorDown')
            } else if (e.key === 'k') {
                executeAction('moveCursorUp')
            } else if (e.key === 'o' && !ctrl) {
                executeAction('insertItemBelow')
            } else if (e.key === 'O') {
                executeAction('insertItemAbove')
            } else if (e.key === 'Enter') {
                executeAction('enterEditMode')
            } else if (e.key === 'Tab' && !e.shiftKey) {
                executeAction('indentItem')
            } else if (e.key === 'Tab' && e.shiftKey) {
                executeAction('outdentItem')
            } else if (e.key === ' ') {
                executeAction('toggleComplete')
            } else if (e.key === 'l') {
                executeAction('toggleCollapse')
            } else if (e.key === 'z' && ctrl && !e.shiftKey) {
                executeAction('undo')
            } else if ((e.key === 'z' && ctrl && e.shiftKey) || (e.key === 'Z' && ctrl)) {
                executeAction('redo')
            } else if (e.key === 'ArrowUp' && ctrl) {
                executeAction('moveItemUp')
            } else if (e.key === 'ArrowDown' && ctrl) {
                executeAction('moveItemDown')
            } else if (e.key === 'c' && ctrl && e.shiftKey) {
                executeAction('checkpoint')
            } else if (e.key === 'p' && ctrl && e.shiftKey) {
                setCheckpointPanelOpen((prev) => !prev)
            } else if (e.key === 'e' && ctrl && e.shiftKey) {
                executeAction('export')
            } else {
                handled = false
            }

            if (handled) e.preventDefault()
        },
        [doc, undoManager, keyboard, checkpointStore, commandPaletteOpen, executeAction],
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
            <CommandPalette
                isOpen={commandPaletteOpen}
                onClose={() => setCommandPaletteOpen(false)}
                onExecute={executeAction}
            />
            <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
        </div>
    )
})
