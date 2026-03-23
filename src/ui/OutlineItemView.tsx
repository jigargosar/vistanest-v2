import { observer } from 'mobx-react-lite'
import { marked } from 'marked'
import type { OutlineItem } from '../core/types'
import { ItemEditor } from './ItemEditor'

// Configure marked for inline rendering (no <p> wrapping)
marked.use({ breaks: false, gfm: true })

function renderInlineMarkdown(text: string): string {
    return marked.parseInline(text) as string
}

type CheckboxMode = 'none' | 'numbered' | 'boxes'

type Props = {
    item: OutlineItem
    depth: number
    cursorItemId: string
    isEditing: boolean
    checkboxMode: CheckboxMode
    siblingIndex?: number
    onSaveContent: (itemId: string, content: string) => void
    onExitEdit: () => void
    onEnterInEdit: (itemId: string, content: string) => void
}

export const OutlineItemView = observer(function OutlineItemView({
    item,
    depth,
    cursorItemId,
    isEditing,
    checkboxMode,
    siblingIndex,
    onSaveContent,
    onExitEdit,
    onEnterInEdit,
}: Props) {
    const isCursor = item.id === cursorItemId
    const showEditor = isCursor && isEditing
    const hasChildren = item.children.length > 0

    // Determine what indicator to show
    let indicator: string
    if (hasChildren) {
        indicator = item.isCollapsed ? '▶' : '▼'
    } else if (item.showCheckbox || checkboxMode === 'boxes') {
        indicator = item.isCompleted ? '☑' : '☐'
    } else if (checkboxMode === 'numbered' && siblingIndex !== undefined) {
        indicator = `${siblingIndex + 1}.`
    } else {
        indicator = '•'
    }

    return (
        <div>
            <div
                className={`flex items-center py-0.5 px-2 ${isCursor ? 'bg-blue-900/40' : ''}`}
                style={{ paddingLeft: `${depth * 24 + 8}px` }}
            >
                <span className="w-4 text-gray-500 mr-1 text-xs shrink-0">{indicator}</span>
                {showEditor ? (
                    <ItemEditor
                        initialContent={item.content}
                        onSave={(content) => onSaveContent(item.id, content)}
                        onCancel={onExitEdit}
                        onEnter={(content) => onEnterInEdit(item.id, content)}
                    />
                ) : (
                    <span
                        className={item.isCompleted ? 'line-through text-gray-500' : ''}
                        dangerouslySetInnerHTML={{
                            __html: item.content ? renderInlineMarkdown(item.content) : '\u00A0',
                        }}
                    />
                )}
            </div>
            {item.note && !showEditor && (
                <div
                    className="text-xs text-gray-400 ml-5 pl-1 border-l border-gray-700"
                    style={{ marginLeft: `${depth * 24 + 28}px` }}
                    dangerouslySetInnerHTML={{ __html: marked.parse(item.note) as string }}
                />
            )}
            {!item.isCollapsed &&
                item.children.map((child, i) => (
                    <OutlineItemView
                        key={child.id}
                        item={child}
                        depth={depth + 1}
                        cursorItemId={cursorItemId}
                        isEditing={isEditing}
                        checkboxMode={checkboxMode}
                        siblingIndex={i}
                        onSaveContent={onSaveContent}
                        onExitEdit={onExitEdit}
                        onEnterInEdit={onEnterInEdit}
                    />
                ))}
        </div>
    )
})
