# VistaNest v1 Design Spec

## What

A Checkvist clone. Keyboard-driven outliner web app. Own your data.

## Why

Data safety. Checkvist works but you don't own it. VistaNest is yours — code, data, hosting.

## Who

Solo user. Accesses from any device with a browser. Primary use: brain dump thoughts fast, search for references later.

## v1 Scope

Try on one device. Not switching from Checkvist yet (that needs sync).

1. Full CRUD on items (create, read, update, delete)
2. Full tree manipulation (indent, outdent, move up/down, reorder)
3. Keyboard shortcuts (double-letter combos, Ctrl+Ctrl command palette, ? reference)
4. Full-text search
5. Focus/zen mode (hoist into subtree, breadcrumb navigation)
6. Back/forward navigation history
7. Undo/redo with smooth visual transitions
8. Progressive disclosure (simple surface, full power underneath)
9. IndexedDB local persistence (auto-save)
10. Manual JSON export (data safety escape hatch)

## Not v1

1. Sync across devices
2. Mobile gestures (touch interactions)
3. Sharing/collaboration
4. Multiple color themes
5. Due dates, tags, assignees
6. Import/export (OPML, Markdown)

## Tech Stack

1. React + TypeScript + Vite + Tailwind v4 + pnpm
2. MobX Keystone — state management, undo, snapshots
3. mobx-react-lite — React integration (observer HOC)
4. Keyboard combo library (TBD — research during implementation)
5. IndexedDB via idb wrapper

## Visual Design

1. Dark theme, amber accent (#e5a832)
2. Fonts: IBM Plex Sans (body), Space Grotesk (headings/logo), JetBrains Mono (code/status)
3. Logo: T2 Connected Nodes icon, amber background
4. Single column layout, centered (~900px max), no sidebar
5. Topbar: logo, search with / shortcut, Lists/Due/Tags nav, help, avatar
6. Breadcrumb below topbar for focus path
7. List title + meta (item count) + action buttons (actions, expand/collapse, options)
8. Items: 36px min height, 16px text, 26px indent per level
9. Selected item: amber left border + subtle amber background + outline
10. Chevrons for expand/collapse (same size as checkboxes, aligned)
11. Checkboxes for completed items (amber checked, muted unchecked)
12. Tags inline as amber pills in monospace
13. Notes below items with left border, secondary color
14. Edit state: input with amber border + glow, same font as body
15. Status bar: mode, item count, shortcut hints
16. Hover shows three-dot action menu per item

## Keyboard System

1. Checkvist-style context — no explicit Vim modes
   a. Item focused: single keys are shortcuts (j/k, Space, etc.)
   b. Editing an item: keys type text
   c. Context switches naturally based on focus
2. Ctrl+Ctrl opens command palette (search all commands)
3. ? opens shortcut reference overlay
4. Double-letter combos with timeout: ee (edit), dd (delete), nn (note), hc (hide completed)
5. g + arrow for navigation history (back/forward)
6. Chord keys in edit context: Ctrl+B bold, Ctrl+I italic — system must not block these
7. Use a keyboard combo library, not DIY

## Data + State Architecture

1. MobX Keystone for all state
2. One flat model — single source of truth
   a. Document data (items, tree structure, content, completion)
   b. UI state (cursor, collapsed items, focus path, mode)
   c. All in one place, no premature separation
3. Extract to separate modules only when proven independent
4. Encapsulated core module API
   a. ~15 functions that own all invariants
   b. Cursor always valid after any operation
   c. Outside code cannot produce invalid state
   d. Implementation (nested array, flat map, whatever) hidden behind API
5. ISI (impossible states impossible) via union types where applicable
6. Undo/redo via Keystone's undoMiddleware
   a. Attached state for cursor position save/restore
   b. Action grouping for multi-step operations
7. Persistence: IndexedDB via idb, debounced auto-save using Keystone's onSnapshot
8. Manual JSON export: getSnapshot → download as file

## Item Model

```
OutlineItem:
  id: string
  content: string (raw markdown, rendered inline)
  note: string (GFM markdown, separate expandable area)
  isCompleted: boolean
  children: OutlineItem[] (nested, hidden behind core API)
```

1. Universal item type — no separate task/note/heading types
2. Content is markdown-in, rendered-out (not WYSIWYG)
3. When editing: raw markdown visible
4. When not editing: renders as formatted text
5. Notes are separate from content, expandable below item

## URL Structure

1. /list/:listId — switch lists
2. /list/:listId/focus/:itemId — hoist into subtree
3. ?q=searchterm — search
4. Collapse state NOT in URL — per-device, in the flat model
5. Back/forward navigation works via browser history

## Onboarding

1. Pre-populated demo list that teaches by example (like Checkvist)
2. Command palette (Ctrl+Ctrl) serves as ongoing "how do I do X" escape hatch
3. No tooltip tours

## Clarifications

1. Multiple lists: v1 starts with one list. Multiple lists can be added if time permits but are not a v1 requirement.
2. Due/Tags nav: show as disabled placeholders in topbar — reveals full vision without building the features.
3. Checkpoint/version system: not v1 scope. Open question for future.

## Open Questions (resolve during implementation)

1. Exact keyboard shortcut mappings (derive from Checkvist's full list)
2. Which keyboard combo library to use
3. Undo transition animation approach
4. Search implementation (simple string match vs fuzzy)
