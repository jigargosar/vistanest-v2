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

## Open Questions

- Exact Checkvist behavior for checkbox display propagation (needs research)
- Detail/note area — how does Checkvist handle it? (needs research)
- Checkvist's full shortcut list (needs research for 80% coverage)
