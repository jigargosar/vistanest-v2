import type { OutlineItem } from './types'

export function findItemById(root: OutlineItem, id: string): OutlineItem | undefined {
    if (root.id === id) return root
    for (const child of root.children) {
        const found = findItemById(child, id)
        if (found) return found
    }
    return undefined
}

export function findParentOf(
    root: OutlineItem,
    id: string,
): { parent: OutlineItem; index: number } | undefined {
    for (let i = 0; i < root.children.length; i++) {
        if (root.children[i].id === id) return { parent: root, index: i }
        const found = findParentOf(root.children[i], id)
        if (found) return found
    }
    return undefined
}

/**
 * Returns a flat list of visible item IDs in document order.
 * Collapsed items' children are skipped.
 */
export function getVisibleItemIds(root: OutlineItem): string[] {
    const result: string[] = []
    for (const child of root.children) {
        collectVisible(child, result)
    }
    return result
}

function collectVisible(item: OutlineItem, result: string[]) {
    result.push(item.id)
    if (!item.isCollapsed) {
        for (const child of item.children) {
            collectVisible(child, result)
        }
    }
}
