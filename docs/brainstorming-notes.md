# VistaNest v2 — Brainstorming Notes

## What We're Building

A Checkvist clone — solo keyboard-driven outliner web app. Local-first with cloud sync. Data safety is the #1 priority (the entire reason this project exists over using Checkvist).

## Decisions Made

### Target & Platform

- Solo use (not collaborative)
- Web app only
- Works everywhere there's a browser (laptop, phone, any device)

### Data Architecture

- **Local-first**: IndexedDB is the primary store — app always works offline, always fast
- **Supabase sync**: backup/sync server — data is safe even if device dies
- **GitHub sign-in**: zero friction, Supabase supports out of the box
- **Sync strategy**: push checkpoints to Supabase, pull on new device — eventually consistent, not real-time
- **Conflict resolution**: keep both versions as checkpoints, user picks winner — never lose data

### Undo & Versioning (Two Layers)

1. **Linear undo stack**: deep in-session, Ctrl+Z walks back action by action, clears on page close
2. **Checkpoint versions**:
   - Auto-checkpoints: created on activity bursts (pause after a flurry of edits, like Google Docs)
   - Manual named checkpoints: user can bookmark a state (e.g., "before big reorganization")
   - Checkpoint browsing: list/timeline view with timestamps and names
   - Diff view: show what changed between any two checkpoints (additions/deletions/moves)

### Item Model

- Every item has **done/not-done** state built-in (always, regardless of visual)
- **Checkbox display** is per-item metadata, not a mode — if one item in a group has checkbox, siblings display it too
- **Detail/note area** per item — expandable, exact Checkvist behavior TBD (needs research)

### Text Editing

- **Markdown-in, rendered-out** — NOT WYSIWYG
- Type raw markdown syntax (e.g., `**bold**`, `_italic_`)
- Renders as formatted text when not editing
- When editing, you see the raw markdown
- Keyboard shortcuts to wrap selection (e.g., Ctrl+B surrounds with `**`)

### UX Philosophy

- Keyboard-first, mouse-optional
- Shortcut-heavy menu system: 1-2 char shortcuts displayed next to every menu item
- Vim-like navigation (j/k movement, Enter to edit, Esc to exit)

## v1 Scope (Release Definition)

1. Hierarchical lists with unlimited nesting (indent/outdent with Tab/Shift+Tab)
2. Full keyboard navigation + shortcut menu
3. Inline editing with markdown formatting + shortcuts
4. Collapse/expand subtrees
5. Item completion (done/not-done) with checkbox display logic
6. Multi-level undo (deep in-session linear stack)
7. Auto-checkpoints (activity-burst) + manual named checkpoints
8. Checkpoint browsing with timeline + diff view
9. IndexedDB local persistence
10. Supabase sync with GitHub auth
11. Multiple lists
12. Detail/note area per item

## v2+ (Parked Features)

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

### Architecture Approach: Immer Patches

Chosen over event-sourcing (too complex) and CRDTs (overkill for single-user).

- Every mutation goes through Immer `produce()`
- Produces patches + inverse patches automatically
- Undo = apply inverse patches
- Checkpoints = serialized state snapshots
- Diffs = structural comparison of two snapshots
- Sync = push snapshots to Supabase
- Simple mental model — state is just a plain JS object

### Module Architecture: Small Core + Outer Modules

**Principle:** Small core module that owns all invariants, outer modules compose core functions.

**Core module (tiny footprint):**
- Owns the tree + cursor + focus state
- Every function returns a complete valid state
- Cursor is always valid AFTER any core operation — if an item is deleted, core fixes the cursor in the same operation
- ~10-15 functions total
- Exhaustively tested — small enough to cover every path

**Outer modules (larger surface):**
- Compose core functions to build features (search, keybindings, checkpoints, etc.)
- Can read state freely
- Can only mutate by calling core functions
- Still need tests — module boundary reduces but doesn't eliminate bugs
- Bigger surface area = more volume = more likely to have logic bugs

**Why this pattern:**
- Fewer places where invariants CAN break
- Core is small enough to test exhaustively
- When a bug happens, you know where to look first
- Not a silver bullet — just minimizes the surface area for bugs

**ISI (Impossible States Impossible) — practical application:**
- True ISI at the TypeScript type level isn't achievable for "cursor must point at valid tree node"
- Instead, ISI is enforced at the module boundary — core API won't let you produce invalid state
- Comprehensive tests at every layer are still required

### Data Model

**Single nested tree, not a flat map:**
- No double links (parentId + childIds) — guaranteed consistency bug source
- No flat map with filterDeleted patterns
- Children are inline arrays on each item — THE structure, not a reference

```
OutlineDocument
  id: string
  title: string
  root: OutlineItem              // single tree
  cursorItemId: string           // always valid — core enforces

OutlineItem
  id: string
  content: string                // raw markdown
  note: string
  isCompleted: boolean
  showCheckbox: boolean
  isCollapsed: boolean
  children: OutlineItem[]        // ordered, inline
```

- Parent lookup = traversal (cheap at our sizes — lifetime max ~5MB, average ~100s KB)
- No soft-delete in main tree — deleted items go to separate recycling bin

### Deleted Items Recovery

Separate from main tree — not soft-delete:

```
RecentDeletions
  items: DeletedItem[]           // ordered by deletion time
  maxAge: session lifetime       // cleared on close

DeletedItem
  item: OutlineItem              // full subtree snapshot at deletion
  deletedFrom: { parentId, index }  // where to restore it
```

- Undo covers "oops just now"
- RecentDeletions covers "I deleted something 20 minutes ago"
- Checkpoints cover "I deleted something last week"

### Undo/Checkpoint Layer

**Undo (wraps core):**

Every core function call goes through:

```
applyAction(state, coreFn, ...args) -> State
  1. Run coreFn via Immer produce()
  2. Capture patches + inverse patches
  3. Push inverse patches onto undo stack
  4. Clear redo stack
  5. Feed patches to checkpoint detector
  6. Return new state

undo(state) -> State
  1. Pop inverse patches from undo stack
  2. Apply via Immer
  3. Push forward patches onto redo stack

redo(state) -> State
  (reverse of undo)
```

- Stack lives in memory only — clears on page close
- No depth limit (irrelevant at our data sizes)
- All mutations (user, undo, redo, remote sync) go through same pipeline

**Checkpoints:**

```
CheckpointDetector
  - Tracks time since last edit
  - After N seconds of inactivity following edits, triggers auto-checkpoint
  - "Activity burst" = edits, then pause

Checkpoint
  id: string
  name: string | null            // null = auto, string = user-named
  snapshot: serialized State
  createdAt: timestamp

CheckpointStore
  checkpoints: Checkpoint[]      // ordered by time
  - Stored in IndexedDB alongside live state
  - Synced to Supabase
```

**Diff view:** Compare any two snapshots structurally — computed on demand, not stored.

## Open Questions

- Exact Checkvist behavior for checkbox display propagation (needs research)
- Detail/note area — how does Checkvist handle it? (needs research)
- Checkvist's full shortcut list (needs research for 80% coverage)
- Checkpoint detector: what's the right inactivity threshold? (5s? 30s? configurable?)
- Remote sync: should undo/redo apply to remote mutations too, or only local?
