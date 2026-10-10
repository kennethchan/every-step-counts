/**
 * Drives a single training session: a fixed real-time animation (5–30s, or
 * shortened once the session is familiar / fast mode is on), then dispatches
 * RESOLVE_SESSION. The sim itself has no concept of real time.
 */

import { ref } from 'vue'
import { getSession } from '@/data/sessions.js'

/**
 * @param {ReturnType<import('@/stores/game.js').useGameStore>} store
 */
export function useSession(store) {
  const running = ref(false)
  const progress = ref(0)
  const currentId = ref(null)
  const canSkip = ref(false)

  /** @type {number|null} */
  let raf = null
  let startTime = 0
  let duration = 1
  /** @type {(() => void)|null} */
  let finish = null

  /**
   * Real-time length of a session in ms. Familiar sessions and fast mode are
   * much shorter so a long journey never means watching 180 full animations.
   * @param {any} session
   */
  function durationFor(session) {
    const reps = store.repetitionCount(session.id)
    const fast = store.settings.fastMode || (store.settings.autoFastMode && reps >= 3)
    if (fast) return 1400
    if (session.rest) return 2200
    return 5000 + session.intensity * 4000
  }

  /**
   * Run a session to completion.
   * @param {string} sessionId
   * @returns {Promise<void>}
   */
  function start(sessionId) {
    if (running.value) return Promise.resolve()
    const session = getSession(sessionId)
    if (!session) return Promise.resolve()

    duration = durationFor(session)
    canSkip.value = store.fastAvailable(sessionId)
    store.dispatch({ type: 'START_SESSION', payload: { sessionId } })
    running.value = true
    progress.value = 0
    currentId.value = sessionId
    startTime = performance.now()

    return new Promise((resolvePromise) => {
      finish = () => {
        if (!running.value) return
        running.value = false
        if (raf !== null) cancelAnimationFrame(raf)
        raf = null
        progress.value = 1
        store.dispatch({ type: 'RESOLVE_SESSION' })
        currentId.value = null
        resolvePromise()
      }
      const step = (now) => {
        const t = Math.min(1, (now - startTime) / duration)
        progress.value = t
        if (t >= 1) finish()
        else raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    })
  }

  /** Jump straight to the result (only offered once fast is available). */
  function skip() {
    if (running.value && canSkip.value) finish?.()
  }

  /** Abandon without resolving. */
  function stop() {
    if (raf !== null) cancelAnimationFrame(raf)
    raf = null
    running.value = false
    progress.value = 0
    currentId.value = null
    store.abandonSession()
  }

  return { running, progress, currentId, canSkip, start, skip, stop }
}
