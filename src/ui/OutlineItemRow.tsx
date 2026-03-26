import { useState, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useAppState } from './context'
import { setContent, stopEditing, insertBelow, startEditing } from '../core/api'
import type { OutlineItem } from '../core/model'

interface OutlineItemRowProps {
  item: OutlineItem
}

export const OutlineItemRow = observer(function OutlineItemRow({ item }: OutlineItemRowProps) {
  const { state, undoManager } = useAppState()

  const depth = state.getDepth(item.id)
  const isCursor = state.cursorItemId === item.id
  const hasChildren = state.getChildren(item.id).length > 0
  const isEditing = state.editingItemId === item.id

  const [localValue, setLocalValue] = useState(item.content)

  // Reset local value when we enter edit mode for this item
  // (MobX observer re-renders when editingItemId changes)
  const inputRef = useCallback(
    (el: HTMLInputElement | null) => {
      if (el) {
        // Sync to latest content on mount and focus
        setLocalValue(item.content)
        el.focus()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item.id, isEditing],
  )

  function commitAndStop() {
    setContent(state, undoManager, item.id, localValue)
    stopEditing(state, undoManager)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      commitAndStop()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      // 1. Save current content
      setContent(state, undoManager, item.id, localValue)
      // 2. Stop editing current
      stopEditing(state, undoManager)
      // 3. Insert new item below
      const newId = insertBelow(state, undoManager, item.id)
      // 4. Start editing the new item
      startEditing(state, undoManager, newId)
    }
  }

  function handleBlur() {
    // Only commit if we're still the editing item (avoids double-commit
    // when Enter/Esc already called commitAndStop before blur fires)
    if (state.editingItemId === item.id) {
      commitAndStop()
    }
  }

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

      {/* Content — inline input when editing, static text otherwise */}
      {isEditing ? (
        <input
          ref={inputRef}
          data-testid="inline-edit-input"
          className="ml-1 flex-1 bg-transparent border-none outline-none"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
      ) : (
        <span className={`ml-1 ${item.isCompleted ? 'line-through opacity-50' : ''}`}>
          {item.content || '\u00A0'}
        </span>
      )}
    </div>
  )
})
