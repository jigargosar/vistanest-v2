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
- **Checkbox display** (from Checkvist research):
  - Per-LIST setting: Options → None (default, chevrons) / Numbered / Boxes
  - Per-item override: prefix with `[]` in markdown to force checkbox
  - Parent items with children always show chevron, not checkbox (even in Boxes mode)
  - Space toggles completion regardless of visual checkbox
- **Detail/note area** per item:
  - Separate from item content, supports GitHub-Flavored Markdown
  - `nn` to add note, `ee` to edit, `cn` to clear note
  - Supports formatting, images, @mentions

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
10. Multiple lists
11. Detail/note area per item
12. Manual JSON export (data safety escape hatch)
13. Undo feedback toast

## v2+ (Parked Features)

- Supabase sync with GitHub auth
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

- Stack persisted to sessionStorage — survives tab refresh, clears on tab close
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

### Undo Feedback

- Every core function produces a human-readable description of what it did
- On undo/redo, show a toast with the description
- e.g., "Undo: moved 'Buy groceries' back to 'Shopping' list"
- Included in v1 — small effort, big UX win for disorienting operations

### Persistence & Sync

**4 systems that care about "changes," each at different granularity:**

1. **Undo/redo** — per-action Immer patches, sessionStorage, local only
2. **Auto-save** — debounced ~2s, write to IndexedDB, never lose work on refresh
3. **Remote sync** — background push to Supabase, fire-and-forget
4. **Checkpoints** — activity-burst snapshots, full state

**v1 sync strategy: full document blob**
- Push full serialized state to Supabase (with version counter + updated_at)
- On app open: compare local vs server version
  - Same: no conflict
  - Local ahead: push
  - Server ahead: pull
  - Both changed: keep both as checkpoints, user picks
- At ~100KB average doc size, full blob sync is fine
- Never loses data — both versions always preserved

**Why not per-item sync for v1:**
- Per-item sync enables smart auto-merge (different items edited = no conflict)
- But adds significant complexity (flat persistence format, per-item versioning)
- Single-user multi-device conflicts are rare (close tab, open elsewhere)
- Full blob + checkpoint safety net is sufficient

**Design for future per-item sync:**
- Persistence layer has a clear interface: save(state), load(), sync()
- Swapping blob sync for per-item sync changes only persistence internals
- Core module and UI never touch persistence directly

**v1 simplified:**
- IndexedDB auto-save (debounced ~2s) — always offline, always fast
- Manual JSON export for data safety escape hatch
- No Supabase, no sync, no auth for v1
- Persistence interface: save(state), load(): State — clean boundary for adding sync later

**No explicit save:**
- No Ctrl+S, no dirty state indicator
- Every mutation auto-persists to IndexedDB (debounced)
- Checkpoints handle versioning

### UI & Keyboard System

**Two modes (like Vim):**

Normal mode (default):
- j/k: move cursor up/down through visible items
- h/l or Left/Right: collapse/expand
- Enter: enter edit mode on current item
- Tab/Shift+Tab: indent/outdent
- o: insert item below
- O: insert item above
- dd: delete item
- Space: toggle completion
- z: undo, Z: redo (or Ctrl+Z / Ctrl+Shift+Z)

Edit mode:
- Typing edits the item content (raw markdown)
- Esc: exit to normal mode
- Ctrl+B: wrap selection in bold
- Ctrl+I: wrap selection in italic
- Enter: save and move to next / create new item (TBD)

Command menu:
- `?` shows all commands with shortcuts (Checkvist has 140+)
- `Shift+Shift` opens command palette (searchable/filterable)
- Double-letter combos: ee (edit), dd (due date), ll (move to list),
  nn (add note), bb (bold/bookmarks), ii (italic), oo (options)
- `hc` hide completed, `om` zen mode, `rd` restore deleted

### Tech Stack

- React + Vite + TypeScript + Tailwind v4 + pnpm
- MobX + mobx-react-lite: state management (researching mobx-bonsai for undo/snapshots)
- idb: IndexedDB wrapper
- No Supabase for v1

### Checkvist Shortcuts Reference (from research)

Full list for implementation reference:
- Space: toggle complete, Shift+Space: invalidate
- Tab/Shift+Tab: indent/unindent
- Ctrl+Up/Down: move item up/down
- /: search/filter
- g Left/Right: navigate back/forward
- ec + 1-9: expand/collapse to level
- sc: show context, lc: copy permalink, pc: progress counter

## Open Questions

- Checkpoint detector: what's the right inactivity threshold? (5s? 30s? configurable?)
- v2 sync: full blob vs per-item, conflict resolution strategy
- State management: MobX Keystone vs mobx-bonsai vs plain MobX (agents researching)
