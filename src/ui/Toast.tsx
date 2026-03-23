import { useEffect } from 'react'

type Props = {
    message: string | null
    onDismiss: () => void
}

export function Toast({ message, onDismiss }: Props) {
    useEffect(() => {
        if (!message) return
        const timer = setTimeout(onDismiss, 2000)
        return () => clearTimeout(timer)
    }, [message, onDismiss])

    if (!message) return null

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 text-gray-100 px-4 py-2 rounded-lg shadow-lg text-sm border border-gray-700">
            {message}
        </div>
    )
}
