import { observer } from 'mobx-react-lite'
import { useAppState } from './context'

export const StatusBar = observer(function StatusBar() {
  const { state } = useAppState()

  // Derive mode from editingItemId
  const mode = state.editingItemId != null ? 'EDIT' : 'NAVIGATE'

  // Derive counts by iterating items — MobX tracks automatically
  let totalCount = 0
  let completedCount = 0
  for (const item of state.items.values()) {
    if (!item.isArchived) {
      totalCount++
      if (item.isCompleted) {
        completedCount++
      }
    }
  }

  const hints =
    mode === 'NAVIGATE'
      ? 'j/k navigate • o insert • Enter edit'
      : 'Esc save • Tab indent • Shift+Tab outdent'

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-20 h-8 bg-surface border-t border-border flex items-center px-4 gap-4 font-mono text-xs text-text-secondary select-none">
      {/* Mode indicator */}
      <span
        className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${
          mode === 'EDIT'
            ? 'bg-amber/20 text-amber'
            : 'bg-border text-text-secondary'
        }`}
      >
        {mode}
      </span>

      {/* Item counts */}
      <span>
        {totalCount} items · {completedCount} done
      </span>

      <div className="flex-1" />

      {/* Contextual shortcut hints */}
      <span className="text-text-secondary/50">{hints}</span>
    </footer>
  )
})
