import {
  model,
  Model,
  modelAction,
  idProp,
  prop,
  ObjectMap,
  objectMap,
} from 'mobx-keystone'

@model('VistaNest/OutlineItem')
export class OutlineItem extends Model({
  id: idProp,
  content: prop<string>(''),
  parentId: prop<string | null>(null),
  sortOrder: prop<number>(0),
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
  setSortOrder(sortOrder: number) {
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
    children.sort((a, b) => a.sortOrder - b.sortOrder)
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
