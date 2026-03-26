# M001: M001: Core Outliner

## Vision
A working keyboard-driven outliner with tree operations, undo/redo, soft-delete, visual design matching the spec, IndexedDB persistence, and JSON export — enough to try on one device and give feedback.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Keystone Model + Core API | high | — | ✅ | After this: all tree operations work in tests — CRUD, indent/outdent, move, collapse, complete, archive, undo/redo with cursor restore. The riskiest technical unknowns (Keystone undo, single-parent tree ops, archive+undo composition) are proven. |
| S02 | Keyboard-Driven Interaction | high | S01 | ✅ | After this: user can navigate with j/k, insert items with o/O, edit inline with Enter/Esc, indent with Tab, complete with Space, archive with Backspace on empty, undo with Ctrl+Z — all in the browser. UI is functional but unstyled. |
| S03 | Visual Design + Layout | medium | S02 | ✅ | After this: app matches the design spec — dark theme with amber accents, IBM Plex Sans / Space Grotesk / JetBrains Mono typography, topbar with logo and nav placeholders, status bar with mode and counts, styled item rows with selection highlighting and checkboxes. |
| S04 | Persistence + Export | low | S02 | ✅ | After this: data survives page refresh via IndexedDB auto-save. User can export all data as a JSON file download. First-time users see a pre-populated demo list. |
