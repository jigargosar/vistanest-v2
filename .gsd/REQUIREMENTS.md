# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R008 — User can export all data as a JSON file download
- Class: continuity
- Status: active
- Description: User can export all data as a JSON file download
- Why it matters: Data safety escape hatch — the user can always get their data out
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: unmapped
- Notes: Uses Keystone's getSnapshot → Blob → download

## Validated

### R001 — User can create, read, update, and delete (archive) outline items in a tree structure
- Class: core-capability
- Status: validated
- Description: User can create, read, update, and delete (archive) outline items in a tree structure
- Why it matters: The fundamental operation of an outliner — without this nothing else works
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: M001/S02
- Validation: 57 passing tests prove CRUD operations on tree structure — insertBelow/insertAbove, getItem/getChildren/getVisibleItems, setContent, archiveItem with cascade, all with undo/redo
- Notes: Delete is soft-delete (archive), not permanent destruction

### R002 — User can indent, outdent, move up, and move down items in the tree
- Class: core-capability
- Status: validated
- Description: User can indent, outdent, move up, and move down items in the tree
- Why it matters: Hierarchical organization is what separates an outliner from a flat list
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: M001/S02
- Validation: 15 tests prove indent (6), outdent with sibling re-parenting (5), moveUp/moveDown (4) including boundary no-ops, all with undo/redo
- Notes: Must handle edge cases — can't indent first item, can't outdent top-level, etc.

### R003 — User navigates and manipulates items entirely via keyboard — j/k cursor, o/O insert, Tab indent, Space complete, Ctrl+Z undo
- Class: primary-user-loop
- Status: validated
- Description: User navigates and manipulates items entirely via keyboard — j/k cursor, o/O insert, Tab indent, Space complete, Ctrl+Z undo
- Why it matters: The entire UX premise — keyboard-driven means keyboard must be the primary and complete interaction path
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: 14 keyboard handler tests prove all 16 navigation-mode shortcuts: j/k cursor, o/O insert+edit, Tab/Shift+Tab indent/outdent, Space complete, h/l collapse, Backspace archive-empty, Enter edit, Ctrl+Z/Shift+Z undo/redo, Ctrl+Arrow reorder. Edit-mode passthrough verified.
- Notes: Double-letter combos (dd, ee, nn) deferred to M002. Basic keys only in M001.

### R004 — User enters edit mode with Enter, types content, exits with Esc. Enter in edit mode saves and creates new item below.
- Class: primary-user-loop
- Status: validated
- Description: User enters edit mode with Enter, types content, exits with Esc. Enter in edit mode saves and creates new item below.
- Why it matters: Fast text entry without modal dialogs — the core authoring experience
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: 7 edit-mode tests prove Enter/Esc/blur commit paths, auto-focus, content persistence via setContent, and Enter-in-edit creates new item below in edit mode. Double-commit guard on blur prevents stale commits after Escape/Enter.
- Notes: Content is markdown-in, rendered-out (not WYSIWYG). When editing, raw markdown visible.

### R005 — All operations are undoable/redoable via Ctrl+Z / Ctrl+Shift+Z, with cursor position restored on undo
- Class: core-capability
- Status: validated
- Description: All operations are undoable/redoable via Ctrl+Z / Ctrl+Shift+Z, with cursor position restored on undo
- Why it matters: Safety net for fast keyboard-driven editing — mistakes are cheap to reverse
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: M001/S02
- Validation: 14 undo/redo tests prove every operation type undoes/redoes with cursor restore via attachedState. Compound operations undo as single step. Integration test exercises multi-undo/redo chains.
- Notes: Uses Keystone's undoMiddleware with attached state for cursor position

### R006 — Dark theme with amber accent (#e5a832), IBM Plex Sans body, Space Grotesk headings, JetBrains Mono code/status. Single column centered layout, ~900px max.
- Class: launchability
- Status: validated
- Description: Dark theme with amber accent (#e5a832), IBM Plex Sans body, Space Grotesk headings, JetBrains Mono code/status. Single column centered layout, ~900px max.
- Why it matters: The app should feel like a crafted tool, not a prototype
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: S03 delivers @theme tokens with all spec colors, three font families (IBM Plex Sans, Space Grotesk, JetBrains Mono) via CDN, centered 900px layout, amber accents on selection/checkboxes/edit input. 81 tests pass.
- Notes: See design spec for full visual details — item height, indent, selection styling, etc.

### R007 — All changes auto-save to IndexedDB with debounce (~2s). Data survives page refresh.
- Class: continuity
- Status: validated
- Description: All changes auto-save to IndexedDB with debounce (~2s). Data survives page refresh.
- Why it matters: Data safety — the user should never lose work because they forgot to save
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: App.tsx wires onSnapshot → debounced saveState (2s). persistence.ts saves full snapshot to IDB. On reload, loadState reads snapshot, fromSnapshot hydrates it. 10 persistence tests + manual refresh path confirm data survives.
- Notes: Uses Keystone's onSnapshot for change detection, idb wrapper for IndexedDB access

### R009 — Fixed bottom bar showing mode indicator, item count, done count, and contextual shortcut hints
- Class: launchability
- Status: validated
- Description: Fixed bottom bar showing mode indicator, item count, done count, and contextual shortcut hints
- Why it matters: Progressive disclosure — always shows what's possible without overwhelming
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: StatusBar.tsx — MobX observer showing NAVIGATE/EDIT mode, non-archived item count, completed count, contextual shortcut hints. Fixed bottom bar with JetBrains Mono.
- Notes: None

### R010 — Top bar with logo, search placeholder (non-functional in M001), disabled Due/Tags nav placeholders, help button, avatar
- Class: launchability
- Status: validated
- Description: Top bar with logo, search placeholder (non-functional in M001), disabled Due/Tags nav placeholders, help button, avatar
- Why it matters: Reveals the full vision without building the features — progressive disclosure
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: Topbar.tsx — Space Grotesk amber logo, disabled search input with / hint, disabled Due/Tags/Lists nav links, help button, avatar placeholder. Fixed top bar.
- Notes: Search, Due, Tags are disabled placeholders. Lists nav shows as active.

### R011 — User can collapse and expand subtrees to manage visual complexity
- Class: core-capability
- Status: validated
- Description: User can collapse and expand subtrees to manage visual complexity
- Why it matters: Deep outlines become unusable without collapse — essential for any non-trivial list
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: M001/S02
- Validation: toggleCollapse tests + 8 cursor navigation tests prove collapsed subtrees are correctly hidden. Deep collapse test (3+ levels) and integration workflow confirm behavior.
- Notes: Collapse state stored in model (collapsedIds array), not in URL

### R012 — User can mark items as complete/incomplete via Space key or checkbox click
- Class: core-capability
- Status: validated
- Description: User can mark items as complete/incomplete via Space key or checkbox click
- Why it matters: Task completion is a core outliner workflow
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: M001/S02
- Validation: toggleComplete tests prove complete/uncomplete toggle with undo. Integration workflow exercises complete in realistic session.
- Notes: Amber checked, muted unchecked. Visual styling in S03.

### R013 — Deleting an item archives it (isArchived: true) instead of permanently destroying it. Archived items are hidden from view but remain in data.
- Class: core-capability
- Status: validated
- Description: Deleting an item archives it (isArchived: true) instead of permanently destroying it. Archived items are hidden from view but remain in data.
- Why it matters: Data safety — accidental deletion should be recoverable beyond undo history
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: M001/S02
- Validation: archiveItem tests prove soft-delete with cascade to descendants, hidden from queries, and full undo restore. Integration test confirms archive+undo in realistic workflow.
- Notes: Restore from archive is desirable but not required for M001. Archive must survive persistence round-trip.

## Deferred

### R020 — Search across all items and notes, with results highlighted
- Class: primary-user-loop
- Status: deferred
- Description: Search across all items and notes, with results highlighted
- Why it matters: The user's stated use case — brain dump fast, search for references later
- Source: user
- Primary owning slice: M002
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred to Phase 2

### R021 — Hoist into a subtree with breadcrumb navigation to focus on one area
- Class: differentiator
- Status: deferred
- Description: Hoist into a subtree with breadcrumb navigation to focus on one area
- Why it matters: Deep work on a subtopic without visual noise from the rest of the outline
- Source: user
- Primary owning slice: M002
- Supporting slices: none
- Validation: unmapped
- Notes: URL-driven via /list/:id/focus/:itemId

### R022 — Ctrl+Ctrl opens a searchable command palette for all available actions
- Class: differentiator
- Status: deferred
- Description: Ctrl+Ctrl opens a searchable command palette for all available actions
- Why it matters: Discoverability — "how do I do X?" answered without leaving the app
- Source: user
- Primary owning slice: M002
- Supporting slices: none
- Validation: unmapped
- Notes: Checkvist-style double-tap trigger

### R023 — ? key opens an overlay showing all keyboard shortcuts
- Class: launchability
- Status: deferred
- Description: ? key opens an overlay showing all keyboard shortcuts
- Why it matters: Learning aid for the keyboard-driven interface
- Source: user
- Primary owning slice: M002
- Supporting slices: none
- Validation: unmapped
- Notes: None

### R024 — Double-letter combos with timeout — ee (edit), dd (delete), nn (note), hc (hide completed)
- Class: differentiator
- Status: deferred
- Description: Double-letter combos with timeout — ee (edit), dd (delete), nn (note), hc (hide completed)
- Why it matters: Efficient keyboard shortcuts that don't conflict with single-key navigation
- Source: user
- Primary owning slice: M002
- Supporting slices: none
- Validation: unmapped
- Notes: Needs keyboard combo library research

### R025 — Back/forward navigation via g+arrow keys and browser history
- Class: differentiator
- Status: deferred
- Description: Back/forward navigation via g+arrow keys and browser history
- Why it matters: Natural navigation pattern for moving between focus contexts
- Source: user
- Primary owning slice: M002
- Supporting slices: none
- Validation: unmapped
- Notes: Integrates with browser history API

### R026 — Support for multiple separate outline lists with list switching
- Class: core-capability
- Status: deferred
- Description: Support for multiple separate outline lists with list switching
- Why it matters: Single list becomes limiting for diverse use cases
- Source: user
- Primary owning slice: M002+
- Supporting slices: none
- Validation: unmapped
- Notes: v1 starts with one list. Multiple lists added if time permits.

## Out of Scope

### R030 — Syncing data across multiple devices/browsers
- Class: constraint
- Status: out-of-scope
- Description: Syncing data across multiple devices/browsers
- Why it matters: Prevents scope creep — sync is a fundamentally different architecture
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: The user explicitly stated sync is not v1

### R031 — Touch-based interactions for mobile devices
- Class: constraint
- Status: out-of-scope
- Description: Touch-based interactions for mobile devices
- Why it matters: Keyboard-driven is the premise — mobile gestures are a separate product decision
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: None

### R032 — Sharing outlines with others or collaborative editing
- Class: constraint
- Status: out-of-scope
- Description: Sharing outlines with others or collaborative editing
- Why it matters: Single-user is the premise — collaboration is a fundamentally different product
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: None

### R033 — User-selectable themes beyond the dark theme
- Class: constraint
- Status: out-of-scope
- Description: User-selectable themes beyond the dark theme
- Why it matters: One good theme is better than three mediocre ones
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: None

### R034 — Task management features like due dates, tags, and assignees
- Class: constraint
- Status: out-of-scope
- Description: Task management features like due dates, tags, and assignees
- Why it matters: The product is an outliner, not a project management tool
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Topbar shows Due/Tags as disabled placeholders to hint at future vision

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | validated | M001/S01 | M001/S02 | 57 passing tests prove CRUD operations on tree structure — insertBelow/insertAbove, getItem/getChildren/getVisibleItems, setContent, archiveItem with cascade, all with undo/redo |
| R002 | core-capability | validated | M001/S01 | M001/S02 | 15 tests prove indent (6), outdent with sibling re-parenting (5), moveUp/moveDown (4) including boundary no-ops, all with undo/redo |
| R003 | primary-user-loop | validated | M001/S02 | none | 14 keyboard handler tests prove all 16 navigation-mode shortcuts: j/k cursor, o/O insert+edit, Tab/Shift+Tab indent/outdent, Space complete, h/l collapse, Backspace archive-empty, Enter edit, Ctrl+Z/Shift+Z undo/redo, Ctrl+Arrow reorder. Edit-mode passthrough verified. |
| R004 | primary-user-loop | validated | M001/S02 | none | 7 edit-mode tests prove Enter/Esc/blur commit paths, auto-focus, content persistence via setContent, and Enter-in-edit creates new item below in edit mode. Double-commit guard on blur prevents stale commits after Escape/Enter. |
| R005 | core-capability | validated | M001/S01 | M001/S02 | 14 undo/redo tests prove every operation type undoes/redoes with cursor restore via attachedState. Compound operations undo as single step. Integration test exercises multi-undo/redo chains. |
| R006 | launchability | validated | M001/S03 | none | S03 delivers @theme tokens with all spec colors, three font families (IBM Plex Sans, Space Grotesk, JetBrains Mono) via CDN, centered 900px layout, amber accents on selection/checkboxes/edit input. 81 tests pass. |
| R007 | continuity | validated | M001/S04 | none | App.tsx wires onSnapshot → debounced saveState (2s). persistence.ts saves full snapshot to IDB. On reload, loadState reads snapshot, fromSnapshot hydrates it. 10 persistence tests + manual refresh path confirm data survives. |
| R008 | continuity | active | M001/S04 | none | unmapped |
| R009 | launchability | validated | M001/S03 | none | StatusBar.tsx — MobX observer showing NAVIGATE/EDIT mode, non-archived item count, completed count, contextual shortcut hints. Fixed bottom bar with JetBrains Mono. |
| R010 | launchability | validated | M001/S03 | none | Topbar.tsx — Space Grotesk amber logo, disabled search input with / hint, disabled Due/Tags/Lists nav links, help button, avatar placeholder. Fixed top bar. |
| R011 | core-capability | validated | M001/S01 | M001/S02 | toggleCollapse tests + 8 cursor navigation tests prove collapsed subtrees are correctly hidden. Deep collapse test (3+ levels) and integration workflow confirm behavior. |
| R012 | core-capability | validated | M001/S01 | M001/S02 | toggleComplete tests prove complete/uncomplete toggle with undo. Integration workflow exercises complete in realistic session. |
| R013 | core-capability | validated | M001/S01 | M001/S02 | archiveItem tests prove soft-delete with cascade to descendants, hidden from queries, and full undo restore. Integration test confirms archive+undo in realistic workflow. |
| R020 | primary-user-loop | deferred | M002 | none | unmapped |
| R021 | differentiator | deferred | M002 | none | unmapped |
| R022 | differentiator | deferred | M002 | none | unmapped |
| R023 | launchability | deferred | M002 | none | unmapped |
| R024 | differentiator | deferred | M002 | none | unmapped |
| R025 | differentiator | deferred | M002 | none | unmapped |
| R026 | core-capability | deferred | M002+ | none | unmapped |
| R030 | constraint | out-of-scope | none | none | n/a |
| R031 | constraint | out-of-scope | none | none | n/a |
| R032 | constraint | out-of-scope | none | none | n/a |
| R033 | constraint | out-of-scope | none | none | n/a |
| R034 | constraint | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 1
- Mapped to slices: 1
- Validated: 12 (R001, R002, R003, R004, R005, R006, R007, R009, R010, R011, R012, R013)
- Unmapped active requirements: 0
