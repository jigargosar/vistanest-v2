import { useState } from 'react'
import { createUndoableDocument } from '../undo/undo-manager'
import { OutlineView } from './OutlineView'

export function App() {
    const [{ doc }] = useState(() => createUndoableDocument('My First List'))
    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 p-4 max-w-3xl mx-auto">
            <OutlineView doc={doc} />
        </div>
    )
}
