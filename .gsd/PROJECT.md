# VistaNest

## What This Is

A keyboard-driven outliner web app — a Checkvist clone you own. Local-first, single-user, dark theme with amber accents. Brain dump thoughts fast, search for references later. Data lives in IndexedDB on your device.

## Core Value

Fast keyboard-driven outlining with data you own — create, rearrange, and find items without touching a mouse, with data that never leaves your browser.

## Current State

M001 (Core Outliner) feature-complete. All four slices delivered: core model + API (S01), keyboard-driven UI (S02), visual design (S03), and persistence + export (S04). OutlineItem/AppState Keystone models with full API: CRUD, indent/outdent, move, collapse, complete, archive (with cascade), undo/redo with cursor restore. Fractional indexing (fraci) for sort order. React ↔ MobX observer rendering with 16 keyboard shortcuts and inline edit mode. Dark theme with Tailwind v4 @theme tokens, IBM Plex Sans / Space Grotesk / JetBrains Mono typography, amber accent. Three-zone layout with fixed topbar (logo, search/nav placeholders, Export button), scrollable centered 900px content area, and fixed status bar. IndexedDB persistence with 2s debounced auto-save via onSnapshot, snapshot hydration on reload via fromSnapshot, and demo seed for first-time users. JSON export download from Topbar. 91 passing tests, zero type errors.

Prior art: detailed v1 design spec at `docs/superpowers/specs/2026-03-25-vistanest-v1-design.md` and Phase 1 implementation plan at `docs/superpowers/plans/2026-03-25-vistanest-phase1.md`.

## Architecture / Key Patterns

- **React 19 + TypeScript 6 + Vite 8 + Tailwind v4** — frontend stack
- **MobX Keystone** — state management with snapshots, undo middleware, model actions
- **mobx-react-lite** — React integration via `observer()` HOC
- **idb** — IndexedDB wrapper for local persistence
- **Encapsulated core API** — ~15 functions that own all invariants, outside code cannot produce invalid state
- **Flat Keystone model** — document data + UI state in one tree, extract only when proven independent
- **Dark theme** — `#0c0c0e` background, `#e5a832` amber accent
- **Fonts** — IBM Plex Sans (body), Space Grotesk (headings/logo), JetBrains Mono (code/status)
- **Soft-delete** — items are archived, not permanently destroyed

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [x] M001: Core Outliner — Working keyboard-driven outliner with tree operations, undo/redo, visual design, persistence, and JSON export (91 tests, 13 requirements validated)
