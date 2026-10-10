/**
 * Race playback. The sim already produced the full result; this composable just
 * animates the splits over a duration that scales with distance (5k ~20s,
 * marathon ~110s) so the drama can be watched — or skipped.
 */

import { ref } from 'vue'
import { playbackMs } from '@/sim/index.js'

export function useRacePlayback() {
  const playing = ref(false)
  const done = ref(false)
  const progress = ref(0)
  const segment = ref(0)
  const total = ref(0)

  /** @type {number|null} */
  let raf = null
  let startTime = 0
  let duration = 1

  /**
   * Begin playback for a staged race.
   * @param {{ distance: number, lane: { splits: number[] } }} race
   */
  function play(race) {
    stop()
    total.value = race.lane.splits.length
    duration = playbackMs(race.distance)
    playing.value = true
    done.value = false
    progress.value = 0
    segment.value = 0
    startTime = performance.now()

    const step = (now) => {
      const t = Math.min(1, (now - startTime) / duration)
      progress.value = t
      segment.value = Math.min(total.value - 1, Math.floor(t * total.value))
      if (t >= 1) {
        playing.value = false
        done.value = true
        raf = null
        return
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
  }

  /** Skip to the end result. */
  function skip() {
    if (raf !== null) cancelAnimationFrame(raf)
    raf = null
    progress.value = 1
    segment.value = Math.max(0, total.value - 1)
    playing.value = false
    done.value = true
  }

  /** Stop / reset. */
  function stop() {
    if (raf !== null) cancelAnimationFrame(raf)
    raf = null
    playing.value = false
    done.value = false
    progress.value = 0
    segment.value = 0
  }

  return { playing, done, progress, segment, total, play, skip, stop }
}
