import { useState, useRef, useEffect } from 'react'

type Props = {
    initialContent: string
    onSave: (content: string) => void
    onCancel: () => void
    onEnter: (content: string) => void
}

export function ItemEditor({ initialContent, onSave, onCancel, onEnter }: Props) {
    const [value, setValue] = useState(initialContent)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Escape') {
            onSave(value)
            onCancel()
            e.preventDefault()
            e.stopPropagation()
        } else if (e.key === 'Enter') {
            onEnter(value)
            e.preventDefault()
            e.stopPropagation()
        } else if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
            wrapSelection('**', '**')
            e.preventDefault()
        } else if (e.key === 'i' && (e.ctrlKey || e.metaKey)) {
            wrapSelection('_', '_')
            e.preventDefault()
        }
    }

    function wrapSelection(before: string, after: string) {
        const input = inputRef.current
        if (!input) return
        const start = input.selectionStart ?? 0
        const end = input.selectionEnd ?? 0
        const newValue = value.slice(0, start) + before + value.slice(start, end) + after + value.slice(end)
        setValue(newValue)
        // Restore cursor after the wrapped selection
        requestAnimationFrame(() => {
            input.setSelectionRange(start + before.length, end + before.length)
        })
    }

    return (
        <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
                onSave(value)
                onCancel()
            }}
            className="bg-transparent outline-none w-full text-gray-100"
        />
    )
}
