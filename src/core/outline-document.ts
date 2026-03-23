import { node, nodeType } from 'mobx-bonsai'
import type { OutlineDocument, OutlineItem, DeletedItem } from './types'
import { createItem } from './outline-item'
import { findItemById, findParentOf, getVisibleItemIds } from './tree-helpers'

export function createDocument(title: string): OutlineDocument {
    const firstItem = createItem()
    const root = createItem({ children: [firstItem] })
    return node<OutlineDocument>({
        id: crypto.randomUUID(),
        title,
        checkboxMode: 'none',
        root,
        cursorItemId: firstItem.id,
    })
}

export const TOutlineDocument = nodeType<OutlineDocument>().actions({
    insertItemBelow(): void {
        const loc = findParentOf(this.root, this.cursorItemId)
        if (!loc) return
        const newItem = createItem()
        loc.parent.children.splice(loc.index + 1, 0, newItem)
        this.cursorItemId = newItem.id
    },

    insertItemAbove(): void {
        const loc = findParentOf(this.root, this.cursorItemId)
        if (!loc) return
        const newItem = createItem()
        loc.parent.children.splice(loc.index, 0, newItem)
        this.cursorItemId = newItem.id
    },

    deleteItem(): DeletedItem | undefined {
        const loc = findParentOf(this.root, this.cursorItemId)
        if (!loc) return undefined

        // Don't delete the last remaining item
        if (loc.parent.children.length === 1 && !findParentOf(this.root, loc.parent.id)) {
            return undefined
        }

        const [removed] = loc.parent.children.splice(loc.index, 1)
        const deleted: DeletedItem = {
            item: removed,
            deletedFromParentId: loc.parent.id,
            deletedFromIndex: loc.index,
            deletedAt: Date.now(),
        }

        // Fix cursor: pick next sibling, prev sibling, or parent
        if (loc.parent.children.length > 0) {
            const newIndex = Math.min(loc.index, loc.parent.children.length - 1)
            this.cursorItemId = loc.parent.children[newIndex].id
        } else {
            // Parent has no more children — cursor goes to parent
            // (but parent is root.children container, so find parent's id)
            this.cursorItemId = loc.parent.id
        }

        return deleted
    },

    moveCursorDown(): void {
        const visible = getVisibleItemIds(this.root)
        const idx = visible.indexOf(this.cursorItemId)
        if (idx >= 0 && idx < visible.length - 1) {
            this.cursorItemId = visible[idx + 1]
        }
    },

    moveCursorUp(): void {
        const visible = getVisibleItemIds(this.root)
        const idx = visible.indexOf(this.cursorItemId)
        if (idx > 0) {
            this.cursorItemId = visible[idx - 1]
        }
    },
})
