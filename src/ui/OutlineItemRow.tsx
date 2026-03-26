import { observer } from 'mobx-react-lite'
import { useAppState } from './context'
import type { OutlineItem } from '../core/model'

interface OutlineItemRowProps {
  item: OutlineItem
}

export const OutlineItemRow = observer(function OutlineItemRow({ item }: OutlineItemRowProps) {
  const { state } = useAppState()

  const depth = state.getDepth(item.id)
  const isCursor = state.cursorItemId === item.id
  const hasChildren = state.getChildren(item.id).length > 0

  return (
    <div
      data-item-id={item.id}
      className={`flex items-center py-0.5 px-2 ${isCursor ? 'bg-white/10' : ''}`}
      style={{ paddingLeft: `${depth * 24 + 8}px` }}
    >
      {/* Collapse chevron */}
      <span className="w-4 shrink-0 text-center text-xs select-none opacity-60">
        {hasChildren ? (item.isCollapsed ? '▶' : '▼') : ''}
      </span>

      {/* Completion indicator */}
      <span className="w-5 shrink-0 text-center select-none">
        {item.isCompleted ? '☑' : '☐'}
      </span>

      {/* Content */}
      <span className={`ml-1 ${item.isCompleted ? 'line-through opacity-50' : ''}`}>
        {item.content || '\u00A0'}
      </span>
    </div>
  )
})
