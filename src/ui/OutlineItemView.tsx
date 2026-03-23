import { observer } from 'mobx-react-lite'
import type { OutlineItem } from '../core/types'

type Props = {
    item: OutlineItem
    depth: number
    cursorItemId: string
}

export const OutlineItemView = observer(function OutlineItemView({ item, depth, cursorItemId }: Props) {
    const isCursor = item.id === cursorItemId
    return (
        <div>
            <div
                className={`flex items-center py-0.5 px-2 ${isCursor ? 'bg-blue-900/40' : ''}`}
                style={{ paddingLeft: `${depth * 24 + 8}px` }}
            >
                <span className="w-4 text-gray-500 mr-1 text-xs">
                    {item.children.length > 0 ? (item.isCollapsed ? '▶' : '▼') : '•'}
                </span>
                <span className={item.isCompleted ? 'line-through text-gray-500' : ''}>
                    {item.content || '\u00A0'}
                </span>
            </div>
            {!item.isCollapsed &&
                item.children.map((child) => (
                    <OutlineItemView key={child.id} item={child} depth={depth + 1} cursorItemId={cursorItemId} />
                ))}
        </div>
    )
})
