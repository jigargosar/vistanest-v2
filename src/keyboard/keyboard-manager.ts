import { makeAutoObservable } from 'mobx'
import type { Mode } from './shortcuts'

export class KeyboardManager {
    mode: Mode = 'normal'

    constructor() {
        makeAutoObservable(this)
    }

    setMode(mode: Mode) {
        this.mode = mode
    }

    enterEditMode() {
        this.mode = 'edit'
    }

    exitEditMode() {
        this.mode = 'normal'
    }
}
