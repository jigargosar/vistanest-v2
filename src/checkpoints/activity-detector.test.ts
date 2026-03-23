import { describe, it, expect, vi } from 'vitest'
import { ActivityDetector } from './activity-detector'

describe('ActivityDetector', () => {
    it('fires callback after inactivity following activity', () => {
        vi.useFakeTimers()
        const onBurst = vi.fn()
        const detector = new ActivityDetector({ inactivityMs: 30000, onBurst })

        detector.recordActivity()
        detector.recordActivity()
        vi.advanceTimersByTime(30000)

        expect(onBurst).toHaveBeenCalledTimes(1)
        detector.dispose()
        vi.useRealTimers()
    })

    it('does not fire if no activity', () => {
        vi.useFakeTimers()
        const onBurst = vi.fn()
        const _detector = new ActivityDetector({ inactivityMs: 30000, onBurst })

        vi.advanceTimersByTime(30000)
        expect(onBurst).not.toHaveBeenCalled()
        _detector.dispose()
        vi.useRealTimers()
    })

    it('resets timer on new activity', () => {
        vi.useFakeTimers()
        const onBurst = vi.fn()
        const detector = new ActivityDetector({ inactivityMs: 30000, onBurst })

        detector.recordActivity()
        vi.advanceTimersByTime(20000)
        detector.recordActivity()
        vi.advanceTimersByTime(20000)
        expect(onBurst).not.toHaveBeenCalled()
        vi.advanceTimersByTime(10000)
        expect(onBurst).toHaveBeenCalledTimes(1)
        detector.dispose()
        vi.useRealTimers()
    })
})
