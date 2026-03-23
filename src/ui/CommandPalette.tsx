import { useState, useRef, useEffect } from 'react'
import { shortcuts } from '../keyboard/shortcuts'

type Props = {
    isOpen: boolean
    onClose: () => void
    onExecute: (action: string) => void
}

export function CommandPalette({ isOpen, onClose, onExecute }: Props) {
    const [query, setQuery] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen) {
            setQuery('')
            requestAnimationFrame(() => inputRef.current?.focus())
        }
    }, [isOpen])

    if (!isOpen) return null

    const filtered = shortcuts.filter(
        (s) =>
            s.description.toLowerCase().includes(query.toLowerCase()) ||
            s.action.toLowerCase().includes(query.toLowerCase()) ||
            s.key.toLowerCase().includes(query.toLowerCase()),
    )

    return (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-24 z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-lg w-96 max-h-96 overflow-hidden">
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            onClose()
                            e.preventDefault()
                            e.stopPropagation()
                        } else if (e.key === 'Enter' && filtered.length > 0) {
                            onExecute(filtered[0].action)
                            onClose()
                            e.preventDefault()
                            e.stopPropagation()
                        }
                    }}
                    placeholder="Search commands..."
                    className="w-full bg-gray-800 text-gray-100 px-4 py-3 outline-none border-b border-gray-700 text-sm"
                />
                <div className="overflow-y-auto max-h-72">
                    {filtered.map((s) => (
                        <div
                            key={`${s.mode}-${s.action}-${s.key}`}
                            className="flex justify-between px-4 py-2 text-sm hover:bg-gray-800 cursor-pointer"
                            onClick={() => {
                                onExecute(s.action)
                                onClose()
                            }}
                        >
                            <span className="text-gray-300">{s.description}</span>
                            <span className="text-gray-500 text-xs font-mono">{s.key}</span>
                        </div>
                    ))}
                    {filtered.length === 0 && <div className="px-4 py-2 text-sm text-gray-500">No matches</div>}
                </div>
            </div>
        </div>
    )
}
