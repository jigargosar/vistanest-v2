# VistaNest v2 — Outliner Design Spec

## Overview

A Checkvist-inspired keyboard-driven outliner web app. Local-first with offline support. Data safety is the #1 priority.

**Target user:** Solo user, accessing from multiple devices via browser.
**Target platform:** Web app only.

## Release Definition (v1)

1. Hierarchical lists with unlimited nesting
2. Full keyboard navigation + shortcut menu (140+ shortcuts, double-letter combos)
3. Inline editing with markdown formatting + keyboard shortcuts
4. Collapse/expand subtrees
5. Item completion (done/not-done) with checkbox display logic
6. Multi-level undo with feedback toasts
7. Auto-checkpoints (activity-burst) + manual named checkpoints
8. Checkpoint browsing with timeline + diff view
9. IndexedDB local persistence (auto-save, debounced)
10. Multiple lists
11. Detail/note area per item (GFM markdown)
12. Manual JSON export (data safety escape hatch)

## Architecture

### Tech Stack

- React + Vite + TypeScript + Tailwind v4 + pnpm
- mobx-bonsai: state management, undo, snapshots
- mobx-react-lite: React integration (observer HOC)
- idb: IndexedDB wrapper

### Architecture Approach: mobx-bonsai

Chosen over plain MobX (no built-in undo/snapshots), Immer (awkward side effects with reducers), and MobX Keystone (heavier class-based API for similar capabilities).

mobx-bonsai provides:
- Built-in `UndoManager` with debounce grouping (`groupingDebounceMs` — merges rapid keystrokes into one undo step)
- Attached state on undo — cursor position saved/restored alongside data changes
- Automatic snapshots with structural sharing (`getSnapshot` / `applySnapshot` / `onSnapshot`)
- JSON patches on every mutation
- Plain TypeScript types — recursive types just work, no decorators or model classes
- Functional API via `nodeType()` — actions, getters, computeds defined externally
- Nodes are standard MobX observables — fully compatible with `observer()` from mobx-react-lite
- Same author as MobX Keystone (Xavier Gonzalez) — proven track record
- Fallback: MobX Keystone is a safe migration path if needed (same concepts, class-based API)

### Module Architecture: Small Core + Outer Modules

**Principle:** Small core module owns all invariants. Outer modules compose core functions.

**Core module (~10-15 actions via nodeType):**
- Owns the tree + cursor + focus state
- Every action returns a complete valid state
- Cursor is always valid after any operation — if an item is deleted, the same action fixes the cursor
- Exhaustively tested

**Outer modules:**
- Compose core actions to build features (keybindings, checkpoint logic, persistence, UI)
- Can read state freely
- Can only mutate via core nodeType actions
- Still need tests — module boundary reduces but doesn't eliminate bugs

**ISI (Impossible States Impossible):**
- Enforced at the module boundary, not the type level
- Core API won't let consumers produce invalid state
- Comprehensive tests at every layer required

### Data Model

```typescript
// Plain TypeScript types — no decorators, no model classes
type OutlineItem = {
  id: string
  content: string                      // raw markdown
  note: string                         // detail/note area, GFM markdown
  isCompleted: boolean
  showCheckbox: boolean                // per-item override
  isCollapsed: boolean
  children: OutlineItem[]              // recursive — just works
}

type OutlineDocument = {
  id: string
  title: string
  checkboxMode: "none" | "numbered" | "boxes"   // per-list setting
  root: OutlineItem
  cursorItemId: string                 // always valid — core enforces
}

// Core actions defined via nodeType
const TOutlineItem = nodeType<OutlineItem>()
  .defaults({
    id: () => crypto.randomUUID(),
    content: () => "",
    note: () => "",
    isCompleted: () => false,
    showCheckbox: () => false,
    isCollapsed: () => false,
    children: () => [],
  })
  .actions({
    setContent(content: string) { this.content = content },
    toggleComplete() { this.isCompleted = !this.isCompleted },
    // ... ~10-15 core actions
  })

const TOutlineDocument = nodeType<OutlineDocument>()
  .defaults({
    id: () => crypto.randomUUID(),
    title: () => "",
    checkboxMode: () => "none" as const,
    root: () => node<OutlineItem>({ /* ... */ }),
    cursorItemId: () => "",
  })
  .actions({
    // core document-level actions
  })
```

Key decisions:
- Single nested tree, not a flat map — bonsai handles this natively
- No double links (parentId + childIds) — children array IS the structure
- Parent lookup = traversal (cheap at our data sizes: ~100KB avg, ~5MB lifetime max)
- No soft-delete — deleted items go to a separate recycling bin
- Checkbox display: per-list setting (`checkboxMode`) with per-item override (`showCheckbox`)
- Parent items always show chevron, not checkbox (even in boxes mode)

### Deleted Items Recovery

Separate from the main tree:

```typescript
type DeletedItem = {
  item: OutlineItem                    // full subtree snapshot
  deletedFromParentId: string
  deletedFromIndex: number
  deletedAt: number                    // timestamp
}
```

Three recovery tiers:
- **Undo:** immediate, in-session (Ctrl+Z)
- **Recent deletions:** session lifetime, explicit restore
- **Checkpoints:** long-term, full state recovery

### Undo/Checkpoint Layer

**Undo:** bonsai's `UndoManager` wraps the root node.

```typescript
const undoManager = new UndoManager({
  rootNode: document,
  groupingDebounceMs: 500,             // rapid edits merge into one undo step
})
```

- Captures patches + inverse patches per action
- Actions within `runInAction()` group automatically
- `groupingDebounceMs` merges rapid changes (typing, dragging)
- Attached state: cursor position + scroll saved/restored with each undo step
- `withoutUndo()` excludes system changes (persistence writes, etc.)
- Stack persisted to sessionStorage — survives tab refresh, clears on tab close
- No depth limit
- All mutations go through nodeType actions — same pipeline for everything

**Undo feedback:** Each core action produces a human-readable description. On undo/redo, show a toast with the description.

**Checkpoints:**

```typescript
interface Checkpoint {
  id: string
  name: string | null              // null = auto, string = user-named
  snapshot: OutlineDocument        // bonsai snapshot (same type as node)
  createdAt: number                // timestamp
}
```

- **Auto-checkpoints:** activity-burst detection — after N seconds of inactivity following edits
- **Manual checkpoints:** user-triggered via keyboard shortcut, with optional name
- **Checkpoint browsing:** timeline/list UI with timestamps and names
- **Diff view:** structural comparison of two bonsai snapshots — added/removed/moved/edited items, computed on demand

### Persistence

**IndexedDB (primary store):**
- Auto-save: debounced ~2s after every mutation via bonsai `onSnapshot`
- Stores: current document snapshot, checkpoint history, list of documents
- Library: idb (tiny IndexedDB wrapper)

**Manual JSON export:**
- Full document export as downloadable JSON file
- Data safety escape hatch — user controls their data

**No Supabase for v1.** Persistence interface designed for future swap:
- `save(snapshot)` / `load(): snapshot` / `sync()` boundary
- Adding server sync later changes only the persistence layer internals

**No explicit save:**
- No Ctrl+S, no dirty state indicator
- Every mutation auto-persists (debounced)
- Checkpoints handle versioning

### UI & Keyboard System

**Two modes (Vim-style):**

Normal mode (default):
- j/k: move cursor up/down through visible items
- h/l or Left/Right: collapse/expand
- Enter: enter edit mode
- Tab/Shift+Tab: indent/outdent
- o/O: insert item below/above
- dd: delete item
- Space: toggle completion
- Ctrl+Z / Ctrl+Shift+Z: undo/redo

Edit mode:
- Raw markdown editing in-place
- Esc: exit to normal mode
- Ctrl+B: wrap selection in bold (`**`)
- Ctrl+I: wrap selection in italic (`_`)
- Enter: save current item, create new sibling below, enter edit mode on it

**Command menu:**
- `?` shows all commands with keyboard shortcuts
- `Shift+Shift` opens searchable command palette
- Double-letter combos following Checkvist patterns: ee (edit), nn (note), oo (options), hc (hide completed)

**Shortcut reference (Checkvist-derived):**
- Space / Shift+Space: toggle complete / invalidate
- Tab / Shift+Tab: indent / unindent
- Ctrl+Up/Down: move item up/down
- /: search/filter
- ec + 1-9: expand/collapse to level
- g Left/Right: navigate back/forward

### Item Content Rendering

- **Markdown-in, rendered-out** — NOT WYSIWYG
- When not editing: content renders as formatted text (bold, italic, headers, etc.)
- When editing: user sees and types raw markdown
- Keyboard shortcuts wrap selected text (Ctrl+B → surrounds with `**`)

### Detail/Note Area

- Separate from item content
- Supports GitHub-Flavored Markdown
- nn: add/toggle note area
- ee: edit item (enters content or note based on context)
- cn: clear note

## v2+ Roadmap (Parked)

- Supabase sync with GitHub auth
- Conflict resolution (full blob sync, both versions preserved as checkpoints)
- Tags / labels (#hashtag filtering)
- Full-text search
- Focus mode (zoom into subtree)
- Due dates
- Priorities
- Color labels
- Multi-select + bulk actions
- Drag and drop reorder
- Dark/light theme toggle
- Copy/paste with structure preservation
- File import/export (OPML, Markdown, JSON)
- Google Drive backup
- Filesystem API persistence
- Per-item sync (smarter conflict resolution)

## Open Questions

- Checkpoint inactivity threshold: 5s? 30s? configurable?
