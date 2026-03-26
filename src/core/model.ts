import {
  model,
  Model,
  modelAction,
  idProp,
  prop,
  ObjectMap,
  objectMap,
} from 'mobx-keystone'
import { fraciString, BASE62, type FractionalIndexOf } from 'fraci'

// ---------------------------------------------------------------------------
// Fractional indexing singleton
// ---------------------------------------------------------------------------

export const sortOrderFraci = fraciString({
  brand: 'sortOrder',
  lengthBase: BASE62,
  digitBase: BASE62,
})

export type SortOrderIndex = FractionalIndexOf<typeof sortOrderFraci>

@model('VistaNest/OutlineItem')
export class OutlineItem extends Model({
  id: idProp,
  content: prop<string>(''),
  parentId: prop<string | null>(null),
  sortOrder: prop<string>(''),
  isCompleted: prop<boolean>(false),
  isCollapsed: prop<boolean>(false),
  isArchived: prop<boolean>(false),
  note: prop<string>(''),
}) {
  @modelAction
  setContent(content: string) {
    this.content = content
  }

  @modelAction
  setParentId(parentId: string | null) {
    this.parentId = parentId
  }

  @modelAction
  setSortOrder(sortOrder: string) {
    this.sortOrder = sortOrder
  }

  @modelAction
  setCompleted(isCompleted: boolean) {
    this.isCompleted = isCompleted
  }

  @modelAction
  setCollapsed(isCollapsed: boolean) {
    this.isCollapsed = isCollapsed
  }

  @modelAction
  setArchived(isArchived: boolean) {
    this.isArchived = isArchived
  }

  @modelAction
  setNote(note: string) {
    this.note = note
  }
}

@model('VistaNest/AppState')
export class AppState extends Model({
  title: prop<string>('Untitled'),
  items: prop<ObjectMap<OutlineItem>>(() => objectMap<OutlineItem>()),
  cursorItemId: prop<string | null>(null),
  editingItemId: prop<string | null>(null),
}) {
  @modelAction
  setTitle(title: string) {
    this.title = title
  }

  @modelAction
  setCursor(itemId: string | null) {
    this.cursorItemId = itemId
  }

  @modelAction
  setEditing(itemId: string | null) {
    this.editingItemId = itemId
  }

  /** Get item by ID, or undefined if not found. */
  getItem(id: string): OutlineItem | undefined {
    return this.items.get(id)
  }

  /** Get non-archived children of parentId, sorted by sortOrder. */
  getChildren(parentId: string | null): OutlineItem[] {
    const children: OutlineItem[] = []
    for (const item of this.items.values()) {
      if (item.parentId === parentId && !item.isArchived) {
        children.push(item)
      }
    }
    children.sort((a, b) => (a.sortOrder < b.sortOrder ? -1 : a.sortOrder > b.sortOrder ? 1 : 0))
    return children
  }

  /** Get siblings (children sharing the same parent) of a given item. */
  getSiblings(itemId: string): OutlineItem[] {
    const item = this.getItem(itemId)
    if (!item) return []
    return this.getChildren(item.parentId)
  }

  /**
   * Recursive DFS of visible items.
   * Skips archived items. Skips children of collapsed items.
   * Starts from root (parentId=null) children.
   */
  getVisibleItems(): OutlineItem[] {
    const result: OutlineItem[] = []
    const walk = (parentId: string | null) => {
      const children = this.getChildren(parentId)
      for (const child of children) {
        result.push(child)
        if (!child.isCollapsed) {
          walk(child.id)
        }
      }
    }
    walk(null)
    return result
  }
}
