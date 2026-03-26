import { createContext, useContext } from 'react'
import type { UndoManager } from 'mobx-keystone'
import type { AppState } from '../core/model'

export interface AppContext {
  state: AppState
  undoManager: UndoManager
}

const OutlineContext = createContext<AppContext | null>(null)

export const OutlineProvider = OutlineContext.Provider

export function useAppState(): AppContext {
  const ctx = useContext(OutlineContext)
  if (!ctx) {
    throw new Error('useAppState must be used within an OutlineProvider')
  }
  return ctx
}
