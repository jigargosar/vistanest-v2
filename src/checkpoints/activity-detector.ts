export class ActivityDetector {
    private timer: ReturnType<typeof setTimeout> | null = null
    private hasActivity = false
    private inactivityMs: number
    private onBurst: () => void

    constructor(options: { inactivityMs: number; onBurst: () => void }) {
        this.inactivityMs = options.inactivityMs
        this.onBurst = options.onBurst
    }

    recordActivity() {
        this.hasActivity = true
        if (this.timer) clearTimeout(this.timer)
        this.timer = setTimeout(() => {
            if (this.hasActivity) {
                this.onBurst()
                this.hasActivity = false
            }
        }, this.inactivityMs)
    }

    dispose() {
        if (this.timer) clearTimeout(this.timer)
    }
}
