# VistaNest Phase 1: Core Outliner

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A working keyboard-driven outliner with undo, persistence, and the designed visual style — enough to try and give feedback.

**Architecture:** MobX Keystone flat model with encapsulated core API. React + observer for rendering. IndexedDB for persistence. No separate UI state — everything in one model.

**Tech Stack:** React, Vite, TypeScript, Tailwind v4, pnpm, MobX Keystone, mobx-react-lite, idb, vitest

---

## File Structure

```
src/
  core/
    model.ts              # Keystone models: OutlineItem, AppState
    api.ts                # Core API (~15 functions, owns all invariants)
    api.test.ts           # Core API tests
  ui/
    App.tsx               # Root component, keyboard handler, providers
    Topbar.tsx            # Logo, search box, nav links, avatar
    OutlineView.tsx       # List header + item tree
    OutlineItem.tsx       # Single item row (view + edit states)
    StatusBar.tsx         # Mode, item count, shortcut hints
  persistence/
    storage.ts            # IndexedDB save/load via idb
    export.ts             # JSON download
  index.tsx               # Entry point
  global.css              # Tailwind imports + custom theme
index.html
package.json
vite.config.ts
tsconfig.json
vitest.config.ts
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/index.tsx`, `src/global.css`, `src/ui/App.tsx`, `vitest.config.ts`

- [ ] **Step 1: Run /vite-ts-init to scaffold base project**

This creates package.json, vite.config.ts, tsconfig.json, index.html, src/main.ts, src/global.css, .prettierrc.

- [ ] **Step 2: Install additional dependencies**

Run: `pnpm add react react-dom mobx mobx-keystone mobx-react-lite idb`
Run: `pnpm add -D @vitejs/plugin-react @types/react @types/react-dom vitest @testing-library/react jsdom`

- [ ] **Step 3: Add React plugin to vite.config.ts**

Add `import react from '@vitejs/plugin-react'` and add `react()` to plugins array.

- [ ] **Step 4: Convert entry to React**

Replace `src/main.ts` with `src/index.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './ui/App'
import './global.css'

createRoot(document.getElementById('app')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
```

Update `index.html` to reference `src/index.tsx`.

- [ ] **Step 5: Create minimal App.tsx**

```tsx
export function App() {
    return (
        <div className="min-h-screen bg-[#0c0c0e] text-[#e8e6e3] p-4">
            <h1 className="text-xl font-bold">VistaNest</h1>
        </div>
    )
}
```

- [ ] **Step 6: Configure vitest**

Create `vitest.config.ts` with globals: true, environment: jsdom.
Add `"types": ["vitest/globals"]` to tsconfig.json compilerOptions.
Add jsx: "react-jsx" to tsconfig.json.

- [ ] **Step 7: Add scripts to package.json**

```json
"test": "vitest run",
"test:watch": "vitest --no-color --clearScreen=false watch"
```

- [ ] **Step 8: Verify**

Run: `pnpm dev` — should show "VistaNest" on dark background.
Run: `pnpm test` — should exit with "no test files" (expected).
Run: `pnpm typecheck` — should pass.

- [ ] **Step 9: Commit**

```
git add <all new files>
git commit -m "Scaffold Vite + React + TypeScript + Tailwind v4 + Keystone project"
```

---

## Task 2: Keystone Model + Core API

**Files:**
- Create: `src/core/model.ts`, `src/core/api.ts`, `src/core/api.test.ts`

- [ ] **Step 1: Define Keystone models**

```typescript
// src/core/model.ts
import { model, Model, prop, idProp, modelAction } from 'mobx-keystone'

@model("VistaNest/OutlineItem")
export class OutlineItem extends Model({
    id: idProp,
    content: prop<string>(""),
    note: prop<string>(""),
    isCompleted: prop(false),
    children: prop<OutlineItem[]>(() => []),
}) {}

@model("VistaNest/AppState")
export class AppState extends Model({
    id: idProp,
    title: prop<string>(""),
    root: prop<OutlineItem>(() => new OutlineItem({})),
    cursorItemId: prop<string>(""),
    collapsedIds: prop<string[]>(() => []),
    editingItemId: prop<string>(""),  // empty = not editing
}) {}
```

- [ ] **Step 2: Write core API tests — creation**

```typescript
// src/core/api.test.ts
import { describe, it, expect } from 'vitest'
import { createAppState, getVisibleItems, insertBelow } from './api'

describe('createAppState', () => {
    it('creates state with one empty item and cursor on it', () => {
        const state = createAppState('Test List')
        expect(state.title).toBe('Test List')
        expect(state.root.children.length).toBe(1)
        expect(state.cursorItemId).toBe(state.root.children[0].id)
    })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL — cannot find module './api'

- [ ] **Step 4: Implement createAppState**

```typescript
// src/core/api.ts
import { AppState, OutlineItem } from './model'
import { registerRootStore } from 'mobx-keystone'

export function createAppState(title: string): AppState {
    const firstItem = new OutlineItem({})
    const root = new OutlineItem({ children: [firstItem] })
    const state = new AppState({
        title,
        root,
        cursorItemId: firstItem.id,
    })
    registerRootStore(state)
    return state
}
```

- [ ] **Step 5: Run test to verify it passes**

- [ ] **Step 6: Write tests for insertBelow, insertAbove, deleteItem**

Test each verifies:
  a. The operation modifies the tree correctly
  b. Cursor is valid after the operation
  c. Edge cases (delete last item, insert at end)

- [ ] **Step 7: Implement insertBelow, insertAbove, deleteItem**

Each is a @modelAction on AppState that:
  a. Finds cursor item in tree
  b. Performs the operation
  c. Fixes cursor if needed

- [ ] **Step 8: Write tests for moveCursorUp, moveCursorDown**

Tests verify cursor moves through visible items (skips collapsed children).

- [ ] **Step 9: Implement moveCursorUp, moveCursorDown**

Uses helper to get flat list of visible item IDs, finds current cursor index, moves.

- [ ] **Step 10: Write tests for indentItem, outdentItem**

Test indent makes item child of previous sibling. Test outdent moves to parent's level. Test edge cases (can't indent first item, can't outdent top-level).

- [ ] **Step 11: Implement indentItem, outdentItem**

Must use Keystone's detach() before re-inserting (single parent rule).

- [ ] **Step 12: Write tests for moveItemUp, moveItemDown**

Test items swap with siblings. Edge cases (first/last item).

- [ ] **Step 13: Implement moveItemUp, moveItemDown**

Must detach + re-insert due to single parent rule.

- [ ] **Step 14: Write tests for toggleCollapse, toggleComplete**

- [ ] **Step 15: Implement toggleCollapse, toggleComplete**

toggleCollapse adds/removes item ID from collapsedIds array.
toggleComplete flips isCompleted on cursor item.

- [ ] **Step 16: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

- [ ] **Step 17: Commit**

```
git add src/core/model.ts src/core/api.ts src/core/api.test.ts
git commit -m "Add Keystone model and core API with tests"
```

---

## Task 3: Undo/Redo

**Files:**
- Modify: `src/core/api.ts`, `src/core/api.test.ts`

- [ ] **Step 1: Write undo tests**

```typescript
describe('undo/redo', () => {
    it('undoes insertBelow', () => {
        const state = createAppState('Test')
        insertBelow(state)
        expect(state.root.children.length).toBe(2)
        undo(state)
        expect(state.root.children.length).toBe(1)
    })

    it('restores cursor on undo', () => {
        const state = createAppState('Test')
        const originalCursor = state.cursorItemId
        insertBelow(state)
        undo(state)
        expect(state.cursorItemId).toBe(originalCursor)
    })

    it('redo after undo', () => {
        const state = createAppState('Test')
        insertBelow(state)
        undo(state)
        redo(state)
        expect(state.root.children.length).toBe(2)
    })
})
```

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement undo/redo**

Set up Keystone's undoMiddleware on the AppState root store. Export undo() and redo() functions. Use attachedState to save/restore cursorItemId.

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Commit**

```
git add src/core/api.ts src/core/api.test.ts
git commit -m "Add undo/redo with cursor position restore"
```

---

## Task 4: UI — Topbar + Outline Rendering

**Files:**
- Create: `src/ui/Topbar.tsx`, `src/ui/OutlineView.tsx`, `src/ui/OutlineItem.tsx`, `src/ui/StatusBar.tsx`
- Modify: `src/ui/App.tsx`, `src/global.css`

- [ ] **Step 1: Set up Tailwind v4 custom theme in global.css**

```css
@import "tailwindcss";

@theme {
    --color-deep: #0c0c0e;
    --color-surface: #121214;
    --color-elevated: #1a1a1e;
    --color-hover: #1f1f24;
    --color-brd: #252528;
    --color-txt-primary: #e8e6e3;
    --color-txt-secondary: #918e89;
    --color-txt-muted: #5a5752;
    --color-accent: #e5a832;
    --color-accent-subtle: rgba(229, 168, 50, 0.12);
    --font-sans: 'IBM Plex Sans', system-ui, sans-serif;
    --font-display: 'Space Grotesk', system-ui, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
}
```

- [ ] **Step 2: Create Topbar component**

Renders: T2 logo icon + "VistaNest", search box with / hint, Lists (active) / Due (disabled) / Tags (disabled) nav, ? button, avatar.
Reference: mockup at `.superpowers/brainstorm/*/desktop-tw.html`

- [ ] **Step 3: Create OutlineItem component**

Renders single item row with:
  a. Chevron (if has children) or empty space (leaf)
  b. Checkbox (if in checkbox mode)
  c. Content text (rendered markdown when not editing, input when editing)
  d. Tag pills inline
  e. Selected state: amber left border + background
  f. Hover: show three-dot action button
  g. Recursively renders children (indented)

- [ ] **Step 4: Create OutlineView component**

Renders: breadcrumb, list title + meta + action buttons, then OutlineItem tree from state.root.children.

- [ ] **Step 5: Create StatusBar component**

Fixed bottom bar: mode indicator, item count, done count, shortcut hints.

- [ ] **Step 6: Wire up App.tsx**

Create AppState, wrap with observer, render Topbar + OutlineView + StatusBar. Pass state down.

- [ ] **Step 7: Verify in browser**

Run: `pnpm dev`
Should show the full layout with one empty item, cursor highlighted, matching the mockup design.

- [ ] **Step 8: Commit**

```
git add src/ui/ src/global.css
git commit -m "Add UI: topbar, outline rendering, status bar with dark theme"
```

---

## Task 5: Keyboard Navigation

**Files:**
- Modify: `src/ui/App.tsx`

- [ ] **Step 1: Add keydown listener to App**

Listen on document for keydown. Route keys based on context:
  a. If an input/textarea is focused → let keys type (except Esc)
  b. Otherwise → dispatch to core API

- [ ] **Step 2: Map keys to actions**

```
j → moveCursorDown
k → moveCursorUp
Space → toggleComplete
Tab → indentItem (preventDefault!)
Shift+Tab → outdentItem
Ctrl+ArrowUp → moveItemUp
Ctrl+ArrowDown → moveItemDown
h → toggleCollapse
l → toggleCollapse
o → insertBelow + enter edit
O → insertAbove + enter edit
Enter → enter edit on current item
Backspace on empty item → deleteItem
Ctrl+z → undo
Ctrl+Shift+z → redo
```

Note: dd combo for delete deferred to Phase 2 (needs keyboard combo library).

- [ ] **Step 3: Verify in browser**

Navigate with j/k, insert with o, indent with Tab, complete with Space, undo with Ctrl+Z.

- [ ] **Step 4: Commit**

```
git add src/ui/App.tsx
git commit -m "Add keyboard navigation: j/k, o/O, Tab, Space, h/l, undo/redo"
```

---

## Task 6: Edit Mode

**Files:**
- Modify: `src/ui/OutlineItem.tsx`, `src/ui/App.tsx`
- Modify: `src/core/api.ts` (setContent action)

- [ ] **Step 1: Add setContent to core API**

@modelAction that finds item by ID and sets content.

- [ ] **Step 2: Add edit state to OutlineItem**

When the item is being edited:
  a. Show an input instead of rendered text
  b. Input gets focus automatically
  c. Input uses same font/size as rendered text (IBM Plex Sans, 16px)
  d. Input has amber border + glow

- [ ] **Step 3: Handle edit interactions**

```
Enter in edit → save content, insertBelow, edit new item
Esc in edit → save content, exit edit
Blur → save content, exit edit
```

Keyboard handler in App must NOT intercept keys while editing (except Esc).

- [ ] **Step 4: Verify in browser**

Press Enter on an item → edit mode. Type text. Press Esc → saved. Press Enter → new item below in edit mode.

- [ ] **Step 5: Commit**

```
git add src/ui/OutlineItem.tsx src/ui/App.tsx src/core/api.ts
git commit -m "Add inline edit mode with Enter/Esc handling"
```

---

## Task 7: IndexedDB Persistence

**Files:**
- Create: `src/persistence/storage.ts`, `src/persistence/export.ts`
- Modify: `src/ui/App.tsx`

- [ ] **Step 1: Implement storage.ts**

```typescript
import { openDB } from 'idb'

const DB_NAME = 'vistanest'
const DB_VERSION = 1

async function getDb() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            db.createObjectStore('state')
        },
    })
}

export async function saveState(snapshot: unknown) {
    const db = await getDb()
    await db.put('state', snapshot, 'current')
}

export async function loadState(): Promise<unknown | undefined> {
    const db = await getDb()
    return db.get('state', 'current')
}
```

- [ ] **Step 2: Implement export.ts**

```typescript
import { getSnapshot } from 'mobx-keystone'

export function exportAsJson(state: object) {
    const snapshot = getSnapshot(state)
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vistanest-export.json'
    a.click()
    URL.revokeObjectURL(url)
}
```

- [ ] **Step 3: Wire auto-save in App.tsx**

Use Keystone's onSnapshot to debounce-save to IndexedDB (~2s).
On mount, load from IndexedDB and applySnapshot if data exists.

- [ ] **Step 4: Verify in browser**

Add items, refresh page — items persist. Open DevTools → Application → IndexedDB → vistanest → verify data.

- [ ] **Step 5: Commit**

```
git add src/persistence/ src/ui/App.tsx
git commit -m "Add IndexedDB auto-save and JSON export"
```

---

## Done Criteria

After all 7 tasks, you have:
1. A working outliner in the browser with the designed dark theme
2. Keyboard navigation (j/k, o/O, Tab, Space, h/l, Ctrl+Z)
3. Inline editing (Enter to edit, Esc to exit, Enter for new item)
4. Undo/redo
5. Data persists across page refresh
6. Core API fully tested
7. JSON export available

You try it, give feedback, we plan Phase 2.
