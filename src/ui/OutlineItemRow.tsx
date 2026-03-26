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
      e.stopPropagation()
      commitAndStop()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      // If empty, just stop editing — don't create more empty items
      if (localValue.trim() === '') {
        commitAndStop()
        return
      }
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
      className={`flex items-center min-h-[36px] py-0.5 px-2 ${
        isCursor
          ? 'border-l-2 border-amber bg-amber/5'
          : 'border-l-2 border-transparent'
      }`}
      style={{ paddingLeft: `${depth * 26 + 8}px` }}
    >
      {/* Collapse chevron — SVG icons */}
      <span className="w-4 shrink-0 flex items-center justify-center text-text-secondary select-none">
        {hasChildren ? (
          item.isCollapsed ? (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6 3l5 5-5 5V3z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 6l5 5 5-5H3z" />
            </svg>
          )
        ) : null}
      </span>

      {/* Checkbox — styled amber when completed */}
      <span className="w-5 shrink-0 flex items-center justify-center select-none">
        {item.isCompleted ? (
          <svg width="16" height="16" viewBox="0 0 16 16" className="text-amber">
            <rect x="1" y="1" width="14" height="14" rx="2" fill="currentColor" />
            <path d="M4.5 8l2.5 2.5 4.5-5" stroke="#0c0c0e" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" className="text-text-secondary">
            <rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        )}
      </span>

      {/* Content — inline input when editing, static text otherwise */}
      {isEditing ? (
        <input
          ref={inputRef}
          data-testid="inline-edit-input"
          className="ml-1 flex-1 bg-transparent border border-amber rounded px-1 font-body text-base text-text-primary outline-none ring-1 ring-amber/40 focus:ring-amber/60"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
      ) : (
        <span className={`ml-1 ${item.isCompleted ? 'line-through text-text-secondary opacity-50' : ''}`}>
          {item.content || '\u00A0'}
        </span>
      )}
    </div>
  )
})
