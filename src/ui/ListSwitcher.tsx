import { observer } from 'mobx-react-lite'
import type { AppStore } from '../store/app-store'

type Props = {
    store: AppStore
}

export const ListSwitcher = observer(function ListSwitcher({ store }: Props) {
    return (
        <div className="flex items-center gap-2 mb-4 text-xs">
            {store.documents.map((doc) => (
                <button
                    key={doc.id}
                    onClick={() => store.switchToDocument(doc.id)}
                    className={`px-2 py-1 rounded ${
                        doc.id === store.currentDocumentId
                            ? 'bg-blue-900 text-blue-200'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                >
                    {doc.title || 'Untitled'}
                </button>
            ))}
            <button
                onClick={() => {
                    const name = 'New List'
                    store.createDocument(name)
                }}
                className="px-2 py-1 rounded bg-gray-800 text-gray-500 hover:bg-gray-700"
            >
                +
            </button>
        </div>
    )
})
