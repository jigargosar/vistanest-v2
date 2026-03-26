import { useKeyboardHandler } from './useKeyboardHandler'

/**
 * Invisible component that activates the keyboard handler.
 * Must be rendered inside OutlineProvider so useAppState() works.
 */
export function KeyboardHandlerHost(): null {
  useKeyboardHandler()
  return null
}
