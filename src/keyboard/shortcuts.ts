export type Mode = 'normal' | 'edit'

export type Shortcut = {
    key: string
    mode: Mode
    description: string
    action: string
}

export const shortcuts: Shortcut[] = [
    { key: 'j', mode: 'normal', description: 'Move cursor down', action: 'moveCursorDown' },
    { key: 'k', mode: 'normal', description: 'Move cursor up', action: 'moveCursorUp' },
    { key: 'Enter', mode: 'normal', description: 'Edit item', action: 'enterEditMode' },
    { key: 'o', mode: 'normal', description: 'Insert item below', action: 'insertItemBelow' },
    { key: 'O', mode: 'normal', description: 'Insert item above', action: 'insertItemAbove' },
    { key: 'Tab', mode: 'normal', description: 'Indent', action: 'indentItem' },
    { key: 'Shift+Tab', mode: 'normal', description: 'Outdent', action: 'outdentItem' },
    { key: ' ', mode: 'normal', description: 'Toggle completion', action: 'toggleComplete' },
    { key: 'h', mode: 'normal', description: 'Collapse', action: 'toggleCollapse' },
    { key: 'l', mode: 'normal', description: 'Expand', action: 'toggleCollapse' },
    { key: 'Ctrl+z', mode: 'normal', description: 'Undo', action: 'undo' },
    { key: 'Ctrl+Shift+z', mode: 'normal', description: 'Redo', action: 'redo' },
    { key: 'Ctrl+ArrowUp', mode: 'normal', description: 'Move item up', action: 'moveItemUp' },
    { key: 'Ctrl+ArrowDown', mode: 'normal', description: 'Move item down', action: 'moveItemDown' },
    { key: 'Escape', mode: 'edit', description: 'Exit edit mode', action: 'exitEditMode' },
]
