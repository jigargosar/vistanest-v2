# VistaNest Outliner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Checkvist-inspired keyboard-driven outliner with multi-level undo, checkpoints, and local persistence.

**Architecture:** mobx-bonsai for state (undo, snapshots, functional API), React for UI, IndexedDB for persistence. Small core module owns all invariants, outer modules compose core actions. TDD throughout.

**Tech Stack:** React, Vite, TypeScript, Tailwind v4, pnpm, mobx-bonsai, mobx-react-lite, idb, vitest

---

## File Structure

```
src/
  core/
    types.ts                  # OutlineItem, OutlineDocument, DeletedItem types
    outline-item.ts           # TOutlineItem nodeType — item-level actions
    outline-document.ts       # TOutlineDocument nodeType — document-level actions (cursor, tree ops)
    outline-document.test.ts  # Core integration tests (all invariants)
    outline-item.test.ts      # Item-level action tests
  undo/
    undo-manager.ts           # UndoManager setup, sessionStorage persistence, attached state
    undo-manager.test.ts
  checkpoints/
    checkpoint-store.ts       # CheckpointStore — auto-detect, manual create, browse, diff
    checkpoint-store.test.ts
    activity-detector.ts      # Activity-burst detection logic
    activity-detector.test.ts
  persistence/
    persistence.ts            # IndexedDB save/load interface + implementation
    persistence.test.ts
    export.ts                 # Manual JSON export
  keyboard/
    keyboard-manager.ts       # Mode state machine (normal/edit), key dispatch
    keyboard-manager.test.ts
    shortcuts.ts              # Shortcut registry — all key bindings
    command-palette.ts        # Searchable command list
  ui/
    App.tsx                   # Root component, store provider
    OutlineView.tsx           # Main outline tree renderer
    OutlineItemView.tsx       # Single item row (rendered + edit states)
    ItemEditor.tsx            # Edit mode input with markdown shortcuts
    CheckpointPanel.tsx       # Timeline/diff UI
    CommandPalette.tsx        # Searchable command menu overlay
    Toast.tsx                 # Undo feedback toast
    ListSwitcher.tsx          # Multiple list management
  store/
    app-store.ts              # Root app state — current document, list of documents, UI state
    app-store.test.ts
  index.tsx                   # Entry point
  index.css                   # Tailwind imports
tailwind.config.ts
vite.config.ts
vitest.config.ts
tsconfig.json
package.json
index.html
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `index.html`, `src/index.tsx`, `src/index.css`, `src/ui/App.tsx`

- [ ] **Step 1: Initialize project**

Run: `pnpm create vite@latest . --template react-ts`

Accept overwrite prompts. This creates the base Vite + React + TypeScript project.

- [ ] **Step 2: Install dependencies**

Run: `pnpm add mobx mobx-bonsai mobx-react-lite idb`
Run: `pnpm add -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom jsdom`

- [ ] **Step 3: Configure Tailwind v4**

Update `vite.config.ts`:
```typescript
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

Replace `src/index.css` with:
```css
@import "tailwindcss";
```

- [ ] **Step 4: Configure Vitest**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [],
  },
})
```

Update `tsconfig.json` — add `"types": ["vitest/globals"]` to compilerOptions.

- [ ] **Step 5: Create minimal App**

Replace `src/ui/App.tsx`:
```typescript
export function App() {
  return <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
    <h1 className="text-xl font-bold">VistaNest</h1>
  </div>
}
```

Update `src/index.tsx` (replace `main.tsx`):
```typescript
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./ui/App"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

Update `index.html` to reference `src/index.tsx` instead of `src/main.tsx`. Delete `src/main.tsx`, `src/App.tsx`, `src/App.css`.

- [ ] **Step 6: Verify everything works**

Run: `pnpm dev` — should show "VistaNest" on dark background.
Run: `pnpm vitest run` — should pass with 0 tests (no error).

- [ ] **Step 7: Commit**

```
git add package.json pnpm-lock.yaml vite.config.ts vitest.config.ts tsconfig.json tailwind.config.ts index.html src/index.tsx src/index.css src/ui/App.tsx .gitignore
git commit -m "Scaffold Vite + React + TypeScript + Tailwind + mobx-bonsai project"
```

---

## Task 2: Core Types

**Files:**
- Create: `src/core/types.ts`

- [ ] **Step 1: Define OutlineItem type**

```typescript
export type OutlineItem = {
  id: string
  content: string
  note: string
  isCompleted: boolean
  showCheckbox: boolean
  isCollapsed: boolean
  children: OutlineItem[]
}
```

- [ ] **Step 2: Define OutlineDocument type**

```typescript
export type CheckboxMode = "none" | "numbered" | "boxes"

export type OutlineDocument = {
  id: string
  title: string
  checkboxMode: CheckboxMode
  root: OutlineItem
  cursorItemId: string
}
```

- [ ] **Step 3: Define DeletedItem type**

```typescript
export type DeletedItem = {
  item: OutlineItem
  deletedFromParentId: string
  deletedFromIndex: number
  deletedAt: number
}
```

- [ ] **Step 4: Commit**

```
git add src/core/types.ts
git commit -m "Add core types: OutlineItem, OutlineDocument, DeletedItem"
```

---

## Task 3: Core Item Actions (TDD)

**Files:**
- Create: `src/core/outline-item.ts`, `src/core/outline-item.test.ts`

- [ ] **Step 1: Write failing test — create item with defaults**

```typescript
// src/core/outline-item.test.ts
import { describe, it, expect } from "vitest"
import { createItem } from "../core/outline-item"

describe("createItem", () => {
  it("creates an item with defaults", () => {
    const item = createItem()
    expect(item.id).toBeDefined()
    expect(item.content).toBe("")
    expect(item.note).toBe("")
    expect(item.isCompleted).toBe(false)
    expect(item.showCheckbox).toBe(false)
    expect(item.isCollapsed).toBe(false)
    expect(item.children).toEqual([])
  })

  it("creates an item with provided content", () => {
    const item = createItem({ content: "hello" })
    expect(item.content).toBe("hello")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/core/outline-item.test.ts`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement createItem with bonsai node**

```typescript
// src/core/outline-item.ts
import { node } from "mobx-bonsai"
import type { OutlineItem } from "./types"

export function createItem(partial?: Partial<OutlineItem>): OutlineItem {
  return node<OutlineItem>({
    id: partial?.id ?? crypto.randomUUID(),
    content: partial?.content ?? "",
    note: partial?.note ?? "",
    isCompleted: partial?.isCompleted ?? false,
    showCheckbox: partial?.showCheckbox ?? false,
    isCollapsed: partial?.isCollapsed ?? false,
    children: partial?.children ?? [],
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/core/outline-item.test.ts`
Expected: PASS

- [ ] **Step 5: Write failing tests — TOutlineItem actions**

```typescript
import { TOutlineItem } from "../core/outline-item"

describe("TOutlineItem.setContent", () => {
  it("sets item content", () => {
    const item = createItem()
    TOutlineItem.setContent(item, "new content")
    expect(item.content).toBe("new content")
  })
})

describe("TOutlineItem.toggleComplete", () => {
  it("toggles completion", () => {
    const item = createItem()
    expect(item.isCompleted).toBe(false)
    TOutlineItem.toggleComplete(item)
    expect(item.isCompleted).toBe(true)
    TOutlineItem.toggleComplete(item)
    expect(item.isCompleted).toBe(false)
  })
})

describe("TOutlineItem.toggleCollapse", () => {
  it("toggles collapsed state", () => {
    const item = createItem()
    TOutlineItem.toggleCollapse(item)
    expect(item.isCollapsed).toBe(true)
  })
})

describe("TOutlineItem.setNote", () => {
  it("sets note content", () => {
    const item = createItem()
    TOutlineItem.setNote(item, "a note")
    expect(item.note).toBe("a note")
  })
})

describe("TOutlineItem.toggleCheckbox", () => {
  it("toggles showCheckbox", () => {
    const item = createItem()
    TOutlineItem.toggleCheckbox(item)
    expect(item.showCheckbox).toBe(true)
  })
})
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `pnpm vitest run src/core/outline-item.test.ts`
Expected: FAIL — TOutlineItem not defined

- [ ] **Step 7: Implement TOutlineItem nodeType**

```typescript
// Add to src/core/outline-item.ts
import { nodeType } from "mobx-bonsai"

export const TOutlineItem = nodeType<OutlineItem>()
  .actions({
    setContent(content: string) {
      this.content = content
    },
    toggleComplete() {
      this.isCompleted = !this.isCompleted
    },
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed
    },
    setNote(note: string) {
      this.note = note
    },
    toggleCheckbox() {
      this.showCheckbox = !this.showCheckbox
    },
  })
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `pnpm vitest run src/core/outline-item.test.ts`
Expected: ALL PASS

- [ ] **Step 9: Commit**

```
git add src/core/outline-item.ts src/core/outline-item.test.ts
git commit -m "Add OutlineItem creation and TOutlineItem actions with tests"
```

---

## Task 4: Core Document Actions — Tree Operations (TDD)

**Files:**
- Create: `src/core/outline-document.ts`, `src/core/outline-document.test.ts`

This is the core module — all invariants enforced here. Cursor must always be valid after every action.

- [ ] **Step 1: Write failing test — create document**

```typescript
// src/core/outline-document.test.ts
import { describe, it, expect } from "vitest"
import { createDocument } from "../core/outline-document"

describe("createDocument", () => {
  it("creates a document with a root item and cursor on it", () => {
    const doc = createDocument("My List")
    expect(doc.title).toBe("My List")
    expect(doc.root.children.length).toBe(1)
    expect(doc.cursorItemId).toBe(doc.root.children[0].id)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/core/outline-document.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement createDocument**

```typescript
// src/core/outline-document.ts
import { node } from "mobx-bonsai"
import type { OutlineDocument } from "./types"
import { createItem } from "./outline-item"

export function createDocument(title: string): OutlineDocument {
  const firstItem = createItem()
  const root = createItem({ children: [firstItem] })
  return node<OutlineDocument>({
    id: crypto.randomUUID(),
    title,
    checkboxMode: "none",
    root,
    cursorItemId: firstItem.id,
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/core/outline-document.test.ts`
Expected: PASS

- [ ] **Step 5: Write failing tests — insertItemBelow**

```typescript
import { TOutlineDocument } from "../core/outline-document"

describe("TOutlineDocument.insertItemBelow", () => {
  it("inserts a new item below cursor and moves cursor to it", () => {
    const doc = createDocument("Test")
    const originalId = doc.cursorItemId
    TOutlineDocument.insertItemBelow(doc)
    expect(doc.root.children.length).toBe(2)
    expect(doc.cursorItemId).not.toBe(originalId)
    expect(doc.root.children[1].id).toBe(doc.cursorItemId)
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

- [ ] **Step 7: Implement insertItemBelow**

The action must:
1. Find the cursor item in the tree
2. Insert a new sibling after it (or child if needed)
3. Move cursor to the new item

```typescript
// Add to outline-document.ts
import { nodeType } from "mobx-bonsai"
import { findItemById, findParentOf } from "./tree-helpers"

// Helper: src/core/tree-helpers.ts
export function findItemById(root: OutlineItem, id: string): OutlineItem | undefined {
  if (root.id === id) return root
  for (const child of root.children) {
    const found = findItemById(child, id)
    if (found) return found
  }
  return undefined
}

export function findParentOf(root: OutlineItem, id: string): { parent: OutlineItem; index: number } | undefined {
  for (let i = 0; i < root.children.length; i++) {
    if (root.children[i].id === id) return { parent: root, index: i }
    const found = findParentOf(root.children[i], id)
    if (found) return found
  }
  return undefined
}
```

```typescript
// TOutlineDocument nodeType
export const TOutlineDocument = nodeType<OutlineDocument>()
  .actions({
    insertItemBelow() {
      const loc = findParentOf(this.root, this.cursorItemId)
      if (!loc) return
      const newItem = createItem()
      loc.parent.children.splice(loc.index + 1, 0, newItem)
      this.cursorItemId = newItem.id
    },
  })
```

- [ ] **Step 8: Run test to verify it passes**

- [ ] **Step 9: Write failing tests — insertItemAbove, deleteItem, moveCursorUp, moveCursorDown**

Test each action verifying:
- The action does what it says
- Cursor is valid after the action
- Edge cases: first item, last item, only item (delete should not delete the last item — or create a new empty one)

```typescript
describe("TOutlineDocument.deleteItem", () => {
  it("deletes cursor item and moves cursor to sibling", () => {
    const doc = createDocument("Test")
    TOutlineDocument.insertItemBelow(doc)
    const secondId = doc.cursorItemId
    TOutlineDocument.deleteItem(doc)
    expect(findItemById(doc.root, secondId)).toBeUndefined()
    expect(doc.cursorItemId).toBeDefined()
    expect(findItemById(doc.root, doc.cursorItemId)).toBeDefined()
  })

  it("does not delete the last remaining item", () => {
    const doc = createDocument("Test")
    TOutlineDocument.deleteItem(doc)
    expect(doc.root.children.length).toBe(1)
  })
})

describe("TOutlineDocument.moveCursorDown", () => {
  it("moves cursor to next visible item", () => {
    const doc = createDocument("Test")
    const firstId = doc.cursorItemId
    TOutlineDocument.insertItemBelow(doc)
    TOutlineDocument.moveCursorUp(doc)
    expect(doc.cursorItemId).toBe(firstId)
    TOutlineDocument.moveCursorDown(doc)
    expect(doc.cursorItemId).not.toBe(firstId)
  })
})

describe("TOutlineDocument.moveCursorUp", () => {
  it("does nothing when at first item", () => {
    const doc = createDocument("Test")
    const firstId = doc.cursorItemId
    TOutlineDocument.moveCursorUp(doc)
    expect(doc.cursorItemId).toBe(firstId)
  })
})
```

- [ ] **Step 10: Implement deleteItem, moveCursorUp, moveCursorDown, insertItemAbove**

Each action must maintain the cursor invariant. `deleteItem` returns the deleted item (for recycling bin). `moveCursorDown/Up` traverses visible items (skips collapsed children).

- [ ] **Step 11: Run all tests**

Run: `pnpm vitest run src/core/`
Expected: ALL PASS

- [ ] **Step 12: Commit**

```
git add src/core/outline-document.ts src/core/outline-document.test.ts src/core/tree-helpers.ts
git commit -m "Add core document actions: insert, delete, cursor movement with tests"
```

---

## Task 5: Core Document Actions — Indent/Outdent, Move, Collapse (TDD)

**Files:**
- Modify: `src/core/outline-document.ts`, `src/core/outline-document.test.ts`

- [ ] **Step 1: Write failing tests — indent (Tab)**

```typescript
describe("TOutlineDocument.indentItem", () => {
  it("makes current item a child of its previous sibling", () => {
    const doc = createDocument("Test")
    TOutlineDocument.insertItemBelow(doc)
    const secondId = doc.cursorItemId
    TOutlineDocument.indentItem(doc)
    expect(doc.root.children.length).toBe(1)
    expect(doc.root.children[0].children[0].id).toBe(secondId)
    expect(doc.cursorItemId).toBe(secondId) // cursor unchanged
  })

  it("does nothing for first item (no previous sibling)", () => {
    const doc = createDocument("Test")
    TOutlineDocument.indentItem(doc)
    expect(doc.root.children.length).toBe(1) // unchanged
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement indentItem**

Remove item from parent's children, append to previous sibling's children. Cursor stays on same item.

- [ ] **Step 4: Write failing tests — outdent (Shift+Tab)**

```typescript
describe("TOutlineDocument.outdentItem", () => {
  it("moves item out one level, placing after its parent", () => {
    const doc = createDocument("Test")
    TOutlineDocument.insertItemBelow(doc)
    TOutlineDocument.indentItem(doc) // now a child of first item
    const itemId = doc.cursorItemId
    TOutlineDocument.outdentItem(doc)
    expect(doc.root.children.length).toBe(2)
    expect(doc.root.children[1].id).toBe(itemId)
  })

  it("does nothing for top-level items", () => {
    const doc = createDocument("Test")
    TOutlineDocument.outdentItem(doc)
    expect(doc.root.children.length).toBe(1)
  })
})
```

- [ ] **Step 5: Implement outdentItem**

- [ ] **Step 6: Write failing tests — moveItemUp, moveItemDown**

```typescript
describe("TOutlineDocument.moveItemUp", () => {
  it("swaps item with previous sibling", () => {
    const doc = createDocument("Test")
    const firstId = doc.cursorItemId
    TOutlineDocument.insertItemBelow(doc)
    const secondId = doc.cursorItemId
    TOutlineDocument.moveItemUp(doc)
    expect(doc.root.children[0].id).toBe(secondId)
    expect(doc.root.children[1].id).toBe(firstId)
  })
})
```

- [ ] **Step 7: Implement moveItemUp, moveItemDown**

- [ ] **Step 8: Write failing tests — toggleCollapse, expandAll, collapseAll**

```typescript
describe("TOutlineDocument.toggleCollapse", () => {
  it("collapses cursor item", () => {
    const doc = createDocument("Test")
    TOutlineDocument.insertItemBelow(doc)
    TOutlineDocument.indentItem(doc)
    TOutlineDocument.moveCursorUp(doc) // cursor on parent
    TOutlineDocument.toggleCollapse(doc)
    const parent = findItemById(doc.root, doc.cursorItemId)!
    expect(parent.isCollapsed).toBe(true)
  })
})
```

- [ ] **Step 9: Implement toggleCollapse, expandAll, collapseAll**

- [ ] **Step 10: Run all core tests**

Run: `pnpm vitest run src/core/`
Expected: ALL PASS

- [ ] **Step 11: Commit**

```
git add src/core/outline-document.ts src/core/outline-document.test.ts
git commit -m "Add indent/outdent, move up/down, collapse/expand with tests"
```

---

## Task 6: Undo Manager Setup (TDD)

**Files:**
- Create: `src/undo/undo-manager.ts`, `src/undo/undo-manager.test.ts`

- [ ] **Step 1: Write failing test — undo reverts an action**

```typescript
import { describe, it, expect } from "vitest"
import { createUndoableDocument } from "../undo/undo-manager"

describe("UndoManager", () => {
  it("undoes an insertItemBelow", () => {
    const { doc, undoManager } = createUndoableDocument("Test")
    expect(doc.root.children.length).toBe(1)
    TOutlineDocument.insertItemBelow(doc)
    expect(doc.root.children.length).toBe(2)
    undoManager.undo()
    expect(doc.root.children.length).toBe(1)
  })

  it("redoes after undo", () => {
    const { doc, undoManager } = createUndoableDocument("Test")
    TOutlineDocument.insertItemBelow(doc)
    undoManager.undo()
    undoManager.redo()
    expect(doc.root.children.length).toBe(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement createUndoableDocument**

```typescript
// src/undo/undo-manager.ts
import { UndoManager } from "mobx-bonsai"
import { createDocument } from "../core/outline-document"
import type { OutlineDocument } from "../core/types"

export function createUndoableDocument(title: string) {
  const doc = createDocument(title)
  const undoManager = new UndoManager({
    rootNode: doc,
    groupingDebounceMs: 500,
  })
  return { doc, undoManager }
}
```

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Write failing test — cursor restored with undo (attached state)**

```typescript
it("restores cursor position on undo", () => {
  const { doc, undoManager } = createUndoableDocument("Test")
  const originalCursorId = doc.cursorItemId
  TOutlineDocument.insertItemBelow(doc)
  const newCursorId = doc.cursorItemId
  expect(newCursorId).not.toBe(originalCursorId)
  undoManager.undo()
  expect(doc.cursorItemId).toBe(originalCursorId)
})
```

- [ ] **Step 6: Verify this passes (cursor is part of the document state, so undo should restore it automatically)**

If it doesn't pass, we need to use bonsai's attached state feature to save/restore cursor alongside undo steps.

- [ ] **Step 7: Commit**

```
git add src/undo/undo-manager.ts src/undo/undo-manager.test.ts
git commit -m "Add UndoManager with debounce grouping and cursor restore"
```

---

## Task 7: Basic UI — Outline Tree Rendering

**Files:**
- Create: `src/ui/OutlineView.tsx`, `src/ui/OutlineItemView.tsx`
- Modify: `src/ui/App.tsx`

- [ ] **Step 1: Create OutlineItemView — renders a single item**

```typescript
// src/ui/OutlineItemView.tsx
import { observer } from "mobx-react-lite"
import type { OutlineItem } from "../core/types"

type Props = {
  item: OutlineItem
  depth: number
  cursorItemId: string
}

export const OutlineItemView = observer(function OutlineItemView({ item, depth, cursorItemId }: Props) {
  const isCursor = item.id === cursorItemId
  return (
    <div>
      <div
        className={`flex items-center py-0.5 px-2 ${isCursor ? "bg-blue-900/40" : ""}`}
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
      >
        <span className="w-4 text-gray-500 mr-1 text-xs">
          {item.children.length > 0 ? (item.isCollapsed ? "▶" : "▼") : "•"}
        </span>
        <span className={item.isCompleted ? "line-through text-gray-500" : ""}>
          {item.content || "\u00A0"}
        </span>
      </div>
      {!item.isCollapsed && item.children.map(child => (
        <OutlineItemView
          key={child.id}
          item={child}
          depth={depth + 1}
          cursorItemId={cursorItemId}
        />
      ))}
    </div>
  )
})
```

- [ ] **Step 2: Create OutlineView — renders the document**

```typescript
// src/ui/OutlineView.tsx
import { observer } from "mobx-react-lite"
import type { OutlineDocument } from "../core/types"
import { OutlineItemView } from "./OutlineItemView"

type Props = {
  doc: OutlineDocument
}

export const OutlineView = observer(function OutlineView({ doc }: Props) {
  return (
    <div className="font-mono text-sm">
      <h2 className="text-lg font-bold mb-2 px-2">{doc.title}</h2>
      {doc.root.children.map(item => (
        <OutlineItemView
          key={item.id}
          item={item}
          depth={0}
          cursorItemId={doc.cursorItemId}
        />
      ))}
    </div>
  )
})
```

- [ ] **Step 3: Wire up App.tsx with a test document**

```typescript
// src/ui/App.tsx
import { useState } from "react"
import { createUndoableDocument } from "../undo/undo-manager"
import { OutlineView } from "./OutlineView"

export function App() {
  const [{ doc }] = useState(() => createUndoableDocument("My First List"))
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 max-w-3xl mx-auto">
      <OutlineView doc={doc} />
    </div>
  )
}
```

- [ ] **Step 4: Verify in browser**

Run: `pnpm dev`
Expected: See "My First List" with one empty item, cursor highlighted in blue.

- [ ] **Step 5: Commit**

```
git add src/ui/OutlineView.tsx src/ui/OutlineItemView.tsx src/ui/App.tsx
git commit -m "Add basic outline tree rendering with cursor highlight"
```

---

## Task 8: Keyboard Navigation — Normal Mode

**Files:**
- Create: `src/keyboard/keyboard-manager.ts`, `src/keyboard/keyboard-manager.test.ts`, `src/keyboard/shortcuts.ts`
- Modify: `src/ui/App.tsx`

- [ ] **Step 1: Define mode types and shortcut registry**

```typescript
// src/keyboard/shortcuts.ts
export type Mode = "normal" | "edit"

export type Shortcut = {
  key: string
  mode: Mode
  description: string
  action: string // action name on TOutlineDocument or custom
}

export const shortcuts: Shortcut[] = [
  { key: "j", mode: "normal", description: "Move cursor down", action: "moveCursorDown" },
  { key: "k", mode: "normal", description: "Move cursor up", action: "moveCursorUp" },
  { key: "Enter", mode: "normal", description: "Edit item", action: "enterEditMode" },
  { key: "o", mode: "normal", description: "Insert item below", action: "insertItemBelow" },
  { key: "O", mode: "normal", description: "Insert item above", action: "insertItemAbove" },
  { key: "Tab", mode: "normal", description: "Indent", action: "indentItem" },
  { key: "Shift+Tab", mode: "normal", description: "Outdent", action: "outdentItem" },
  { key: "Space", mode: "normal", description: "Toggle completion", action: "toggleComplete" },
  { key: "h", mode: "normal", description: "Collapse", action: "collapseItem" },
  { key: "l", mode: "normal", description: "Expand", action: "expandItem" },
  { key: "Ctrl+z", mode: "normal", description: "Undo", action: "undo" },
  { key: "Ctrl+Shift+z", mode: "normal", description: "Redo", action: "redo" },
]
```

- [ ] **Step 2: Create keyboard manager with mode state**

```typescript
// src/keyboard/keyboard-manager.ts
import { observable, action } from "mobx"
import type { Mode } from "./shortcuts"

export class KeyboardManager {
  mode: Mode = "normal"

  constructor() {
    // Use MobX makeAutoObservable or makeObservable
  }

  setMode(mode: Mode) {
    this.mode = mode
  }
}
```

Use `makeAutoObservable(this)` in the constructor.

- [ ] **Step 3: Wire keyboard events in App.tsx**

Add a `useEffect` that listens to `keydown` on `document`, dispatches to the appropriate action based on current mode and key. Prevent default for handled keys.

- [ ] **Step 4: Verify in browser**

Run: `pnpm dev`
Test: Press `o` to insert items, `j/k` to move cursor, `Space` to toggle completion. Verify cursor moves correctly.

- [ ] **Step 5: Commit**

```
git add src/keyboard/keyboard-manager.ts src/keyboard/shortcuts.ts src/ui/App.tsx
git commit -m "Add keyboard navigation: j/k movement, o insert, Space complete, Tab indent"
```

---

## Task 9: Edit Mode

**Files:**
- Create: `src/ui/ItemEditor.tsx`
- Modify: `src/ui/OutlineItemView.tsx`, `src/keyboard/keyboard-manager.ts`

- [ ] **Step 1: Create ItemEditor component**

```typescript
// src/ui/ItemEditor.tsx
import { useState, useRef, useEffect } from "react"
import type { OutlineItem } from "../core/types"

type Props = {
  item: OutlineItem
  onSave: (content: string) => void
  onCancel: () => void
  onEnter: (content: string) => void // save + create new sibling
}

export function ItemEditor({ item, onSave, onCancel, onEnter }: Props) {
  const [value, setValue] = useState(item.content)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onCancel()
      e.preventDefault()
    } else if (e.key === "Enter") {
      onEnter(value)
      e.preventDefault()
    } else if (e.key === "b" && e.ctrlKey) {
      // Wrap selection in **bold**
      wrapSelection(inputRef.current!, "**", "**")
      e.preventDefault()
    } else if (e.key === "i" && e.ctrlKey) {
      // Wrap selection in _italic_
      wrapSelection(inputRef.current!, "_", "_")
      e.preventDefault()
    }
  }

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={e => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => onSave(value)}
      className="bg-transparent outline-none w-full"
    />
  )
}

function wrapSelection(input: HTMLInputElement, before: string, after: string) {
  const start = input.selectionStart ?? 0
  const end = input.selectionEnd ?? 0
  const text = input.value
  const selected = text.slice(start, end)
  const newValue = text.slice(0, start) + before + selected + after + text.slice(end)
  // Update via React's onChange won't work here — use native value setter pattern
  // or lift state management up
}
```

Note: The `wrapSelection` helper needs to work with React's controlled input. The implementer should use `nativeInputValueSetter` pattern or refactor to use an uncontrolled ref approach. Research the best pattern during implementation.

- [ ] **Step 2: Update OutlineItemView to switch between render and edit**

When `mode === "edit"` and this item is the cursor item, render `<ItemEditor>`. Otherwise render the content as markdown.

- [ ] **Step 3: Update keyboard manager — Enter enters edit mode, Esc exits**

The keyboard event listener should stop dispatching normal-mode shortcuts when in edit mode. Only handle Esc (to exit) and Ctrl+shortcuts (bold/italic) in edit mode.

- [ ] **Step 4: Verify in browser**

Run: `pnpm dev`
Test: Navigate to item, press Enter, type text, press Esc. Press Enter again, type, press Enter (should create new item below and enter edit on it).

- [ ] **Step 5: Commit**

```
git add src/ui/ItemEditor.tsx src/ui/OutlineItemView.tsx src/keyboard/keyboard-manager.ts
git commit -m "Add edit mode: inline editing with Esc exit, Enter creates new sibling"
```

---

## Task 10: Undo Feedback Toast

**Files:**
- Create: `src/ui/Toast.tsx`
- Modify: `src/ui/App.tsx`

- [ ] **Step 1: Create Toast component**

Simple overlay that shows a message for ~2 seconds, auto-dismisses.

```typescript
// src/ui/Toast.tsx
import { useState, useEffect } from "react"

type Props = {
  message: string | null
  onDismiss: () => void
}

export function Toast({ message, onDismiss }: Props) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDismiss, 2000)
    return () => clearTimeout(timer)
  }, [message, onDismiss])

  if (!message) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 text-gray-100 px-4 py-2 rounded-lg shadow-lg text-sm">
      {message}
    </div>
  )
}
```

- [ ] **Step 2: Add action descriptions to core actions**

Create a map of action names to description generators. Example:
```typescript
export function describeAction(actionName: string, context: { content?: string }): string {
  switch (actionName) {
    case "insertItemBelow": return "Inserted new item"
    case "deleteItem": return `Deleted "${context.content?.slice(0, 30) || "empty item"}"`
    case "indentItem": return "Indented item"
    case "outdentItem": return "Outdented item"
    case "toggleComplete": return "Toggled completion"
    default: return actionName
  }
}
```

- [ ] **Step 3: Show toast on undo/redo**

Wire up: when undo/redo is triggered, show toast with "Undo: {description}" or "Redo: {description}".

- [ ] **Step 4: Verify in browser**

Make changes, press Ctrl+Z — toast should appear at bottom of screen.

- [ ] **Step 5: Commit**

```
git add src/ui/Toast.tsx src/ui/App.tsx
git commit -m "Add undo feedback toast"
```

---

## Task 11: IndexedDB Persistence

**Files:**
- Create: `src/persistence/persistence.ts`, `src/persistence/persistence.test.ts`

- [ ] **Step 1: Write failing test — save and load document**

```typescript
import { describe, it, expect } from "vitest"
import { saveDocument, loadDocument } from "../persistence/persistence"
import { createDocument } from "../core/outline-document"
import { getSnapshot } from "mobx-bonsai"

describe("persistence", () => {
  it("saves and loads a document snapshot", async () => {
    const doc = createDocument("Test")
    const snapshot = getSnapshot(doc)
    await saveDocument("test-id", snapshot)
    const loaded = await loadDocument("test-id")
    expect(loaded).toEqual(snapshot)
  })
})
```

Note: Tests need `fake-indexeddb` for IndexedDB in Node. Add: `pnpm add -D fake-indexeddb` and import in test setup.

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement persistence with idb**

```typescript
// src/persistence/persistence.ts
import { openDB } from "idb"

const DB_NAME = "vistanest"
const DB_VERSION = 1

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("documents")) {
        db.createObjectStore("documents")
      }
      if (!db.objectStoreNames.contains("checkpoints")) {
        db.createObjectStore("checkpoints", { keyPath: "id" })
      }
    },
  })
}

export async function saveDocument(id: string, snapshot: unknown) {
  const db = await getDb()
  await db.put("documents", snapshot, id)
}

export async function loadDocument(id: string) {
  const db = await getDb()
  return db.get("documents", id)
}

export async function listDocumentIds(): Promise<string[]> {
  const db = await getDb()
  return db.getAllKeys("documents") as Promise<string[]>
}

export async function deleteDocument(id: string) {
  const db = await getDb()
  await db.delete("documents", id)
}
```

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Add auto-save with onSnapshot in App**

Wire up `onSnapshot(doc, debounced(snapshot => saveDocument(doc.id, snapshot), 2000))` in App.tsx or app-store.ts.

- [ ] **Step 6: Add load-on-startup**

On app mount, check IndexedDB for saved documents. If found, `applySnapshot` to restore. If not, create new.

- [ ] **Step 7: Verify in browser**

Add items, close tab, reopen — items should persist.

- [ ] **Step 8: Commit**

```
git add src/persistence/persistence.ts src/persistence/persistence.test.ts src/ui/App.tsx
git commit -m "Add IndexedDB persistence with auto-save and load on startup"
```

---

## Task 12: Checkpoint System (TDD)

**Files:**
- Create: `src/checkpoints/activity-detector.ts`, `src/checkpoints/activity-detector.test.ts`, `src/checkpoints/checkpoint-store.ts`, `src/checkpoints/checkpoint-store.test.ts`

- [ ] **Step 1: Write failing test — activity detector fires after inactivity**

```typescript
import { describe, it, expect, vi } from "vitest"
import { ActivityDetector } from "../checkpoints/activity-detector"

describe("ActivityDetector", () => {
  it("fires callback after inactivity following activity", () => {
    vi.useFakeTimers()
    const onBurst = vi.fn()
    const detector = new ActivityDetector({ inactivityMs: 30000, onBurst })

    detector.recordActivity()
    detector.recordActivity()
    vi.advanceTimersByTime(30000)

    expect(onBurst).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it("does not fire if no activity", () => {
    vi.useFakeTimers()
    const onBurst = vi.fn()
    const detector = new ActivityDetector({ inactivityMs: 30000, onBurst })

    vi.advanceTimersByTime(30000)
    expect(onBurst).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it("resets timer on new activity", () => {
    vi.useFakeTimers()
    const onBurst = vi.fn()
    const detector = new ActivityDetector({ inactivityMs: 30000, onBurst })

    detector.recordActivity()
    vi.advanceTimersByTime(20000)
    detector.recordActivity() // resets
    vi.advanceTimersByTime(20000)
    expect(onBurst).not.toHaveBeenCalled()
    vi.advanceTimersByTime(10000)
    expect(onBurst).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement ActivityDetector**

Simple debounce wrapper — on each `recordActivity()`, reset a timer. When timer fires, call `onBurst()`.

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Write failing test — checkpoint store**

```typescript
import { describe, it, expect } from "vitest"
import { CheckpointStore } from "../checkpoints/checkpoint-store"

describe("CheckpointStore", () => {
  it("creates a checkpoint from a snapshot", () => {
    const store = new CheckpointStore()
    store.createCheckpoint({ id: "doc1", title: "Test" }, null)
    expect(store.checkpoints.length).toBe(1)
    expect(store.checkpoints[0].name).toBeNull()
  })

  it("creates a named checkpoint", () => {
    const store = new CheckpointStore()
    store.createCheckpoint({ id: "doc1", title: "Test" }, "Before refactor")
    expect(store.checkpoints[0].name).toBe("Before refactor")
  })
})
```

- [ ] **Step 6: Implement CheckpointStore**

- [ ] **Step 7: Run all tests**

Run: `pnpm vitest run`
Expected: ALL PASS

- [ ] **Step 8: Commit**

```
git add src/checkpoints/activity-detector.ts src/checkpoints/activity-detector.test.ts src/checkpoints/checkpoint-store.ts src/checkpoints/checkpoint-store.test.ts
git commit -m "Add activity-burst detector and checkpoint store with tests"
```

---

## Task 13: Checkpoint UI — Timeline and Diff

**Files:**
- Create: `src/ui/CheckpointPanel.tsx`
- Modify: `src/ui/App.tsx`

- [ ] **Step 1: Create CheckpointPanel — timeline list**

Shows list of checkpoints ordered by time. Each shows timestamp and name (or "Auto-checkpoint"). Click to preview (apply snapshot to a temporary view).

- [ ] **Step 2: Add diff view between two checkpoints**

Structural diff: compare two snapshots, show added/removed/modified items. Display as a simple list of changes.

- [ ] **Step 3: Add keyboard shortcut to open/close checkpoint panel**

- [ ] **Step 4: Add manual checkpoint creation shortcut**

Add a shortcut (e.g., `Ctrl+Shift+S` or a double-letter combo) that prompts for a name and creates a checkpoint.

- [ ] **Step 5: Wire activity detector to auto-create checkpoints**

Connect `ActivityDetector.onBurst` → `CheckpointStore.createCheckpoint(getSnapshot(doc), null)`.

- [ ] **Step 6: Persist checkpoints to IndexedDB**

Add checkpoint save/load to persistence layer.

- [ ] **Step 7: Verify in browser**

Edit items, wait 30s, check that auto-checkpoint appears. Create manual checkpoint. Open panel, browse checkpoints, view diff.

- [ ] **Step 8: Commit**

```
git add src/ui/CheckpointPanel.tsx src/ui/App.tsx src/persistence/persistence.ts
git commit -m "Add checkpoint panel with timeline, diff view, and auto-checkpoint"
```

---

## Task 14: Multiple Lists

**Files:**
- Create: `src/store/app-store.ts`, `src/store/app-store.test.ts`, `src/ui/ListSwitcher.tsx`

- [ ] **Step 1: Write failing test — app store manages multiple documents**

```typescript
import { describe, it, expect } from "vitest"
import { AppStore } from "../store/app-store"

describe("AppStore", () => {
  it("starts with one document", () => {
    const store = new AppStore()
    expect(store.documents.length).toBe(1)
    expect(store.currentDocument).toBeDefined()
  })

  it("creates a new document and switches to it", () => {
    const store = new AppStore()
    const firstId = store.currentDocument.id
    store.createDocument("Second List")
    expect(store.documents.length).toBe(2)
    expect(store.currentDocument.id).not.toBe(firstId)
  })

  it("switches between documents", () => {
    const store = new AppStore()
    const firstId = store.currentDocument.id
    store.createDocument("Second")
    store.switchToDocument(firstId)
    expect(store.currentDocument.id).toBe(firstId)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement AppStore**

MobX observable store with `documents: OutlineDocument[]`, `currentDocumentId`, methods for create/switch/delete.

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Create ListSwitcher UI**

Sidebar or dropdown showing all lists. Click to switch. Button to create new list.

- [ ] **Step 6: Wire into App.tsx**

Replace single document with AppStore. UndoManager per document.

- [ ] **Step 7: Persist document list to IndexedDB**

- [ ] **Step 8: Verify in browser**

Create multiple lists, switch between them, close and reopen — all lists persist.

- [ ] **Step 9: Commit**

```
git add src/store/app-store.ts src/store/app-store.test.ts src/ui/ListSwitcher.tsx src/ui/App.tsx
git commit -m "Add multiple lists with switching and persistence"
```

---

## Task 15: Markdown Rendering

**Files:**
- Modify: `src/ui/OutlineItemView.tsx`

- [ ] **Step 1: Add inline markdown rendering**

When not editing, render item content with basic markdown:
- `**bold**` → `<strong>`
- `_italic_` → `<em>`
- `` `code` `` → `<code>`
- `# headers` → appropriate heading size

Use a lightweight markdown library (e.g., `marked` or `markdown-it` with minimal config) or a simple regex-based renderer for the subset we need. Research and pick during implementation.

Run: `pnpm add marked` (or chosen library)

- [ ] **Step 2: Render note area with GFM markdown**

If item has a note, show it below the item content (collapsed by default, expand with `nn`).

- [ ] **Step 3: Verify in browser**

Type `**bold** and _italic_` in an item, exit edit mode — should render as formatted text.

- [ ] **Step 4: Commit**

```
git add src/ui/OutlineItemView.tsx package.json pnpm-lock.yaml
git commit -m "Add inline markdown rendering for item content and notes"
```

---

## Task 16: Checkbox Display Logic

**Files:**
- Modify: `src/ui/OutlineItemView.tsx`, `src/core/outline-document.ts`

- [ ] **Step 1: Implement per-list checkbox mode**

When `doc.checkboxMode === "boxes"`, show checkboxes on leaf items (items with no children). Parent items always show chevron.

- [ ] **Step 2: Implement per-item override**

If `item.showCheckbox === true`, show checkbox regardless of list mode.

- [ ] **Step 3: Add `oo` shortcut to cycle checkbox mode**

Normal mode: `oo` cycles through `none` → `boxes` → `numbered` → `none`.

- [ ] **Step 4: Verify in browser**

Toggle checkbox mode, verify leaves show checkboxes, parents show chevrons. Toggle per-item override with a shortcut.

- [ ] **Step 5: Commit**

```
git add src/ui/OutlineItemView.tsx src/core/outline-document.ts src/keyboard/shortcuts.ts
git commit -m "Add checkbox display: per-list mode and per-item override"
```

---

## Task 17: Command Palette

**Files:**
- Create: `src/keyboard/command-palette.ts`, `src/ui/CommandPalette.tsx`

- [ ] **Step 1: Create command palette data structure**

Build from the shortcuts registry — filterable list of all commands with their key bindings.

- [ ] **Step 2: Create CommandPalette UI component**

Overlay that appears on `?` or `Shift+Shift`. Shows all commands with shortcuts. Searchable input at top. Click or Enter to execute. Esc to close.

- [ ] **Step 3: Wire up `?` and `Shift+Shift` shortcuts**

`?` shows the palette in read-only mode (just reference).
`Shift+Shift` (double-tap Shift) opens in execute mode.

Note: Detecting double-tap Shift requires tracking the last Shift keyup timestamp.

- [ ] **Step 4: Verify in browser**

Press `?` — palette appears with all shortcuts listed. Type to filter. Press Esc to close.

- [ ] **Step 5: Commit**

```
git add src/keyboard/command-palette.ts src/ui/CommandPalette.tsx src/keyboard/shortcuts.ts src/ui/App.tsx
git commit -m "Add command palette with search and shortcut display"
```

---

## Task 18: Manual JSON Export

**Files:**
- Create: `src/persistence/export.ts`
- Modify: `src/keyboard/shortcuts.ts`

- [ ] **Step 1: Implement JSON export**

```typescript
// src/persistence/export.ts
import { getSnapshot } from "mobx-bonsai"
import type { OutlineDocument } from "../core/types"

export function exportDocumentAsJson(doc: OutlineDocument) {
  const snapshot = getSnapshot(doc)
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${doc.title || "untitled"}.json`
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 2: Add keyboard shortcut**

Add to shortcuts registry. Suggested: `Ctrl+Shift+E` for export.

- [ ] **Step 3: Verify in browser**

Press shortcut — JSON file downloads with document content.

- [ ] **Step 4: Commit**

```
git add src/persistence/export.ts src/keyboard/shortcuts.ts
git commit -m "Add manual JSON export with keyboard shortcut"
```

---

## Task 19: Remaining Shortcuts (Double-Letter Combos)

**Files:**
- Modify: `src/keyboard/keyboard-manager.ts`, `src/keyboard/shortcuts.ts`

- [ ] **Step 1: Implement double-letter shortcut detection**

The keyboard manager needs to detect sequences like `dd`, `ee`, `nn`, `hc`, etc. On first letter, start a short timeout (~500ms). If second letter matches a combo, execute. If timeout or mismatch, execute single-letter action.

- [ ] **Step 2: Register all double-letter combos**

```
dd — delete item (already have single-keystroke delete, make dd the canonical way)
ee — enter edit mode
nn — toggle note area
oo — cycle checkbox mode (already implemented)
hc — hide completed items
ec — expand/collapse (followed by 1-9 for level)
```

- [ ] **Step 3: Implement hide-completed**

Add a `hideCompleted` boolean to document or view state. When true, completed items are filtered from the visible tree. Cursor must skip hidden items.

- [ ] **Step 4: Write tests for double-letter detection**

- [ ] **Step 5: Verify in browser**

Press `dd` to delete, `ee` to edit, `nn` to toggle notes, `hc` to hide completed.

- [ ] **Step 6: Commit**

```
git add src/keyboard/keyboard-manager.ts src/keyboard/shortcuts.ts
git commit -m "Add double-letter combo shortcuts: dd, ee, nn, hc, ec"
```

---

## Task 20: SessionStorage Undo Persistence

**Files:**
- Modify: `src/undo/undo-manager.ts`

- [ ] **Step 1: Research bonsai UndoManager serialization**

Check if bonsai's UndoManager supports serializing its undo stack. If yes, use it. If not, implement manual serialization of the undo events to sessionStorage.

- [ ] **Step 2: Save undo stack to sessionStorage on each change**

- [ ] **Step 3: Restore undo stack from sessionStorage on page load**

- [ ] **Step 4: Verify in browser**

Make changes, refresh page (F5) — undo stack should still work. Close tab and reopen — undo stack should be gone.

- [ ] **Step 5: Commit**

```
git add src/undo/undo-manager.ts
git commit -m "Persist undo stack to sessionStorage across page refreshes"
```

---

## Task 21: Delete Recovery — Recycling Bin

**Files:**
- Modify: `src/core/outline-document.ts`, `src/core/outline-document.test.ts`
- Create: `src/ui/RecycleBin.tsx` (optional — could be part of command palette)

- [ ] **Step 1: Write failing test — deleted items stored in recycling bin**

```typescript
describe("deleteItem with recycling", () => {
  it("stores deleted item in recent deletions", () => {
    const doc = createDocument("Test")
    TOutlineDocument.insertItemBelow(doc)
    const itemId = doc.cursorItemId
    const deleted = TOutlineDocument.deleteItem(doc)
    expect(deleted).toBeDefined()
    expect(deleted!.item.id).toBe(itemId)
  })
})
```

- [ ] **Step 2: Implement — deleteItem returns DeletedItem**

- [ ] **Step 3: Add `rd` shortcut to restore last deleted item**

- [ ] **Step 4: Verify in browser**

Delete items, press `rd` to restore.

- [ ] **Step 5: Commit**

```
git add src/core/outline-document.ts src/core/outline-document.test.ts src/keyboard/shortcuts.ts
git commit -m "Add recycling bin for deleted items with rd restore shortcut"
```

---

## Task 22: Final Polish and Integration Test

**Files:**
- Modify: various

- [ ] **Step 1: Run all tests**

Run: `pnpm vitest run`
Expected: ALL PASS

- [ ] **Step 2: Manual integration test in browser**

Checklist:
- [ ] Create a list, add 10+ items with nesting
- [ ] Navigate with j/k, indent/outdent with Tab
- [ ] Edit items, use Ctrl+B for bold, verify markdown renders
- [ ] Toggle completion with Space
- [ ] Undo/redo multiple times, verify toast appears
- [ ] Wait 30s, verify auto-checkpoint created
- [ ] Create manual checkpoint
- [ ] Open checkpoint panel, browse, view diff
- [ ] Create second list, switch between lists
- [ ] Close tab, reopen — all data persists
- [ ] Export JSON, verify file content
- [ ] Open command palette with ?, search for commands
- [ ] Delete items, restore with rd
- [ ] Refresh page — undo still works

- [ ] **Step 3: Fix any issues found**

- [ ] **Step 4: Commit**

```
git add <list all changed files explicitly>
git commit -m "Integration test fixes and polish"
```

- [ ] **Step 5: Tag v1**

```
git tag v0.1.0
git push --follow-tags
```
