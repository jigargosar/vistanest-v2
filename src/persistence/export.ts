import { getSnapshot } from 'mobx-bonsai'
import type { OutlineDocument } from '../core/types'

export function exportDocumentAsJson(doc: OutlineDocument) {
    const snapshot = getSnapshot(doc)
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.title || 'untitled'}.json`
    a.click()
    URL.revokeObjectURL(url)
}
