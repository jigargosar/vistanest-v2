import { describe, it, expect } from 'vitest'
import { createItem, TOutlineItem } from './outline-item'

describe('createItem', () => {
    it('creates an item with defaults', () => {
        const item = createItem()
        expect(item.id).toBeDefined()
        expect(item.content).toBe('')
        expect(item.note).toBe('')
        expect(item.isCompleted).toBe(false)
        expect(item.showCheckbox).toBe(false)
        expect(item.isCollapsed).toBe(false)
        expect(item.children).toEqual([])
    })

    it('creates an item with provided content', () => {
        const item = createItem({ content: 'hello' })
        expect(item.content).toBe('hello')
    })

    it('creates an item with provided id', () => {
        const item = createItem({ id: 'test-id' })
        expect(item.id).toBe('test-id')
    })
})

describe('TOutlineItem.setContent', () => {
    it('sets item content', () => {
        const item = createItem()
        TOutlineItem.setContent(item, 'new content')
        expect(item.content).toBe('new content')
    })
})

describe('TOutlineItem.toggleComplete', () => {
    it('toggles completion', () => {
        const item = createItem()
        expect(item.isCompleted).toBe(false)
        TOutlineItem.toggleComplete(item)
        expect(item.isCompleted).toBe(true)
        TOutlineItem.toggleComplete(item)
        expect(item.isCompleted).toBe(false)
    })
})

describe('TOutlineItem.toggleCollapse', () => {
    it('toggles collapsed state', () => {
        const item = createItem()
        expect(item.isCollapsed).toBe(false)
        TOutlineItem.toggleCollapse(item)
        expect(item.isCollapsed).toBe(true)
    })
})

describe('TOutlineItem.setNote', () => {
    it('sets note content', () => {
        const item = createItem()
        TOutlineItem.setNote(item, 'a note')
        expect(item.note).toBe('a note')
    })
})

describe('TOutlineItem.toggleCheckbox', () => {
    it('toggles showCheckbox', () => {
        const item = createItem()
        expect(item.showCheckbox).toBe(false)
        TOutlineItem.toggleCheckbox(item)
        expect(item.showCheckbox).toBe(true)
    })
})
