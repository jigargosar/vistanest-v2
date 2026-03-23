import { observer } from 'mobx-react-lite'
import type { OutlineItem } from '../core/types'
import { ItemEditor } from './ItemEditor'

type Props = {
    item: OutlineItem
    depth: number
    cursorItemId: string
    isEditing: boolean
    onSaveContent: (itemId: string, content: string) => void
    onExitEdit: () => void
    onEnterInEdit: (itemId: string, content: string) => void
}

export const OutlineItemView = observer(function OutlineItemView({
    item,
    depth,
    cursorItemId,
    isEditing,
    onSaveContent,
    onExitEdit,
    onEnterInEdit,
}: Props) {
    const isCursor = item.id === cursorItemId
    const showEditor = isCursor && isEditing

    return (
        <div>
            <div
                className={`flex items-center py-0.5 px-2 ${isCursor ? 'bg-blue-900/40' : ''}`}
                style={{ paddingLeft: `${depth * 24 + 8}px` }}
            >
                <span className="w-4 text-gray-500 mr-1 text-xs shrink-0">
                    {item.children.length > 0 ? (item.isCollapsed ? '▶' : '▼') : '•'}
                </span>
                {showEditor ? (
                    <ItemEditor
                        initialContent={item.content}
                        onSave={(content) => onSaveContent(item.id, content)}
                        onCancel={onExitEdit}
                        onEnter={(content) => onEnterInEdit(item.id, content)}
                    />
                ) : (
                    <span className={item.isCompleted ? 'line-through text-gray-500' : ''}>
                        {item.content || '\u00A0'}
                    </span>
                )}
            </div>
            {!item.isCollapsed &&
                item.children.map((child) => (
                    <OutlineItemView
                        key={child.id}
                        item={child}
                        depth={depth + 1}
                        cursorItemId={cursorItemId}
                        isEditing={isEditing}
                        onSaveContent={onSaveContent}
                        onExitEdit={onExitEdit}
                        onEnterInEdit={onEnterInEdit}
                    />
                ))}
        </div>
    )
})
