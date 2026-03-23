import { makeAutoObservable } from 'mobx'

export interface Checkpoint {
    id: string
    name: string | null
    snapshot: unknown
    createdAt: number
}

export class CheckpointStore {
    checkpoints: Checkpoint[] = []

    constructor() {
        makeAutoObservable(this)
    }

    createCheckpoint(snapshot: unknown, name: string | null) {
        this.checkpoints.push({
            id: crypto.randomUUID(),
            name,
            snapshot,
            createdAt: Date.now(),
        })
    }
}
