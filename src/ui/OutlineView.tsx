import { observer } from 'mobx-react-lite'
import { useAppState } from './context'
import { OutlineItemRow } from './OutlineItemRow'

export const OutlineView = observer(function OutlineView() {
  const { state } = useAppState()
  const items = state.getVisibleItems()

  return (
    <div className="font-mono text-sm">
      {items.length === 0 ? (
        <div className="p-4 opacity-40">No items. Press o to create one.</div>
      ) : (
        items.map((item) => <OutlineItemRow key={item.id} item={item} />)
      )}
    </div>
  )
})
