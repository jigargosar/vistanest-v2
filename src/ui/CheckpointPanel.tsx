import { observer } from 'mobx-react-lite'
import type { CheckpointStore } from '../checkpoints/checkpoint-store'

type Props = {
    store: CheckpointStore
    isOpen: boolean
    onClose: () => void
    onRestore: (snapshot: unknown) => void
}

export const CheckpointPanel = observer(function CheckpointPanel({ store, isOpen, onClose, onRestore }: Props) {
    if (!isOpen) return null

    return (
        <div className="fixed right-0 top-0 h-full w-80 bg-gray-900 border-l border-gray-700 p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-300">Checkpoints</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-sm">
                    Close
                </button>
            </div>
            {store.checkpoints.length === 0 ? (
                <p className="text-gray-500 text-xs">No checkpoints yet</p>
            ) : (
                <div className="space-y-2">
                    {[...store.checkpoints].reverse().map((cp) => (
                        <div key={cp.id} className="border border-gray-700 rounded p-2 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">{cp.name ?? 'Auto-checkpoint'}</span>
                                <button
                                    onClick={() => onRestore(cp.snapshot)}
                                    className="text-blue-400 hover:text-blue-300"
                                >
                                    Restore
                                </button>
                            </div>
                            <div className="text-gray-500 mt-1">
                                {new Date(cp.createdAt).toLocaleTimeString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
})
