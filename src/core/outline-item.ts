import { node, nodeType } from 'mobx-bonsai'
import type { OutlineItem } from './types'

export function createItem(partial?: Partial<OutlineItem>): OutlineItem {
    return node<OutlineItem>({
        id: partial?.id ?? crypto.randomUUID(),
        content: partial?.content ?? '',
        note: partial?.note ?? '',
        isCompleted: partial?.isCompleted ?? false,
        showCheckbox: partial?.showCheckbox ?? false,
        isCollapsed: partial?.isCollapsed ?? false,
        children: partial?.children ?? [],
    })
}

export const TOutlineItem = nodeType<OutlineItem>().actions({
    setContent(content: string) {
        this.content = content
    },
    toggleComplete() {
        this.isCompleted = !this.isCompleted
    },
    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed
    },
    setNote(note: string) {
        this.note = note
    },
    toggleCheckbox() {
        this.showCheckbox = !this.showCheckbox
    },
})
