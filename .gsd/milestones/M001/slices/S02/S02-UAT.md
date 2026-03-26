# S02: Keyboard-Driven Interaction — UAT

**Milestone:** M001
**Written:** 2026-03-26T03:08:08.102Z

# S02: Keyboard-Driven Interaction — UAT

**Milestone:** M001
**Written:** 2026-03-26

## UAT Type

- UAT mode: mixed (artifact-driven test suite + live-runtime browser verification)
- Why this mode is sufficient: 81 automated tests prove all keyboard shortcuts and edit-mode flows work correctly. Live browser verification confirms the reactive rendering pipeline and keyboard interaction work end-to-end.

## Preconditions

- Run `pnpm dev` — Vite dev server must be running at localhost:5173
- Browser open to the app URL
- App should show 3 seeded items

## Smoke Test

Open app, confirm 3 items visible with first highlighted. Press j — cursor moves down. Press k — cursor moves up.

## Test Cases

### 1. Cursor Navigation (j/k)
1. Load the app — cursor on first item
2. Press j three times
3. **Expected:** Cursor moves down, stops at last item
4. Press k three times
5. **Expected:** Cursor moves back up, stops at first item

### 2. Insert Below (o)
1. Cursor on first item, press o
2. **Expected:** New empty item below in edit mode with input focused
3. Type "New item", press Escape
4. **Expected:** Content saved, static text displayed

### 3. Indent/Outdent (Tab/Shift+Tab)
1. Cursor on non-first root item, press Tab
2. **Expected:** Item indents, becomes child of item above
3. Press Shift+Tab
4. **Expected:** Item outdents back to root

### 4. Toggle Complete (Space)
1. Cursor on any item, press Space
2. **Expected:** Completion indicator shown, page doesn't scroll
3. Press Space again
4. **Expected:** Completion removed

### 5. Edit Mode — Enter/Escape
1. Cursor on item, press Enter
2. **Expected:** Editable input with existing text, auto-focused
3. Modify text, press Escape
4. **Expected:** Modified text saved

### 6. Edit Mode — Enter Creates New Item
1. In edit mode, press Enter
2. **Expected:** Content saved, new item below in edit mode

### 7. Undo/Redo (Ctrl+Z/Ctrl+Shift+Z)
1. Create item with o, type text, Escape
2. Press Ctrl+Z
3. **Expected:** Item disappears
4. Press Ctrl+Shift+Z
5. **Expected:** Item reappears

## Edge Cases

### Cursor at boundaries
1. First item, press k — nothing happens
2. Last item, press j — nothing happens

### Backspace only on empty items
1. Cursor on item with content, press Backspace — nothing happens
2. Cursor on empty item, press Backspace — item archived

### Shortcuts don't fire in edit mode
1. Enter edit mode, press j/k/o/Space
2. **Expected:** Characters typed into input, shortcuts don't fire

## Failure Signals
- Key press with no visual change (MobX reactivity broken)
- Console errors about observer or context
- Browser scrolling on Space or tab-switching on Tab

## Not Proven By This UAT
- Visual design (S03)
- Data persistence (S04)
- Mouse/touch interaction
- Large item count performance
- Accessibility/ARIA
