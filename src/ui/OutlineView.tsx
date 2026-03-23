import { observer } from 'mobx-react-lite'
import type { OutlineDocument } from '../core/types'
import { OutlineItemView } from './OutlineItemView'

type Props = {
    doc: OutlineDocument
    isEditing: boolean
    onSaveContent: (itemId: string, content: string) => void
    onExitEdit: () => void
    onEnterInEdit: (itemId: string, content: string) => void
}

export const OutlineView = observer(function OutlineView({ doc, isEditing, onSaveContent, onExitEdit, onEnterInEdit }: Props) {
    return (
        <div className="font-mono text-sm">
            <h2 className="text-lg font-bold mb-2 px-2">{doc.title}</h2>
            {doc.root.children.map((item) => (
                <OutlineItemView
                    key={item.id}
                    item={item}
                    depth={0}
                    cursorItemId={doc.cursorItemId}
                    isEditing={isEditing}
                    onSaveContent={onSaveContent}
                    onExitEdit={onExitEdit}
                    onEnterInEdit={onEnterInEdit}
                />
            ))}
        </div>
    )
})
