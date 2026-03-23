export type OutlineItem = {
  id: string
  content: string
  note: string
  isCompleted: boolean
  showCheckbox: boolean
  isCollapsed: boolean
  children: OutlineItem[]
}

export type CheckboxMode = "none" | "numbered" | "boxes"

export type OutlineDocument = {
  id: string
  title: string
  checkboxMode: CheckboxMode
  root: OutlineItem
  cursorItemId: string
}

export type DeletedItem = {
  item: OutlineItem
  deletedFromParentId: string
  deletedFromIndex: number
  deletedAt: number
}
