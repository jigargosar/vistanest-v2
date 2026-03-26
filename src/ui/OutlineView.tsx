import { observer } from 'mobx-react-lite'
import { useAppState } from './context'
import { OutlineItemRow } from './OutlineItemRow'

export const OutlineView = observer(function OutlineView() {
  const { state } = useAppState()
  const items = state.getVisibleItems()

  return (
    <div className="mx-auto max-w-[900px] px-6 font-body text-base text-text-primary">
      {items.length === 0 ? (
        <div className="p-4 text-text-secondary">No items. Press o to create one.</div>
      ) : (
        items.map((item) => <OutlineItemRow key={item.id} item={item} />)
      )}
    </div>
  )
})
