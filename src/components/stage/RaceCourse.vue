<script setup>
/**
 * Race view for the stage side: the course, your marker, and a stylised pack
 * that reflects how many runners are ahead of you at the current split.
 */
import { computed } from 'vue'
import { ordinal } from '@/utils/format.js'

const props = defineProps({
  race: { type: Object, required: true },
  progress: { type: Number, default: 0 },
  segment: { type: Number, default: 0 },
})

/** How many runners are ahead at this split (from the sim's per-segment ranks). */
const ahead = computed(() => {
  const positions = props.race.lane.positions
  const p = positions[Math.min(props.segment, positions.length - 1)] ?? 1
  return p - 1
})

const totalAhead = computed(() => Math.min(ahead.value, 12))

const pack = computed(() => {
  const dots = []
  const n = totalAhead.value
  for (let i = 0; i < n; i++) {
    dots.push({ side: 'ahead', offset: 3 + i * 2.6 })
  }
  const behind = Math.min(props.race.result.fieldSize - 1 - n, 14)
  for (let i = 0; i < behind; i++) {
    dots.push({ side: 'behind', offset: 2.5 + i * 2.4 })
  }
  return dots
})

const position = computed(() => (props.race.lane.positions[Math.min(props.segment, props.race.lane.positions.length - 1)] ?? 1))
</script>

<template>
  <div class="course-wrap">
    <div class="course-meta">
      <span class="tag" v-tooltip="'Race distance.'">{{ race.result.distance >= 1000 ? race.result.distance / 1000 : race.result.distance }}{{ race.result.distance >= 1000 ? 'k' : 'm' }}</span>
      <span class="tag tier" v-tooltip="'Field tier — how strong the other runners are.'">{{ race.tier }}</span>
      <span class="tag pacing" v-tooltip="'The pacing strategy you chose before the start.'">{{ race.pacing }}</span>
      <span class="spacer" />
      <span class="pos" v-tooltip="'Your live position in the field, updating each split.'">{{ ordinal(position) }} / {{ race.result.fieldSize }}</span>
    </div>

    <div class="track" v-tooltip="'The course. Red dots are runners ahead of you, grey dots are behind. Your marker is the gold flag.'">
      <div class="pack">
        <span
          v-for="(dot, i) in pack"
          :key="i"
          class="dot"
          :class="dot.side"
          :style="{
            left: `calc(${progress * 100}% + ${dot.side === 'ahead' ? dot.offset : -dot.offset}px)`,
          }"
        />
      </div>
      <div class="player" :style="{ left: `${progress * 100}%` }">
        <span class="flag" />
      </div>
      <div class="finish" v-tooltip="'The finish line.'" />
    </div>

    <div class="split-row small">
      <span class="muted" v-tooltip="'Which split is being run right now.'">split {{ Math.min(segment + 1, race.lane.splits.length) }}/{{ race.lane.splits.length }}</span>
      <span class="spacer" />
      <span v-tooltip="'How long this split took.'">{{ race.lane.splits[Math.min(segment, race.lane.splits.length - 1)]?.toFixed(1) }}s</span>
    </div>
  </div>
</template>

<style scoped>
.course-wrap {
  padding: 8px 12px 12px;
  background: linear-gradient(180deg, rgba(13, 15, 20, 0.4), rgba(13, 15, 20, 0.94));
}

.course-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.tag {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 2px 6px;
  border: 1px solid var(--line);
  border-radius: 3px;
  color: var(--muted);
}

.tag.tier {
  color: var(--accent);
  border-color: #7a5a34;
}

.tag.pacing {
  color: var(--accent-2);
  border-color: #2c5f5a;
}

.pos {
  font-weight: 700;
}

.track {
  position: relative;
  height: 34px;
  border-top: 2px dashed var(--line);
  border-bottom: 2px dashed var(--line);
}

.finish {
  position: absolute;
  right: 0;
  top: -4px;
  bottom: -4px;
  width: 4px;
  background: repeating-linear-gradient(180deg, #eee 0 4px, #111 4px 8px);
}

.player {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  transition: left 0.12s linear;
}

.flag {
  display: block;
  width: 12px;
  height: 16px;
  background: var(--gold);
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(255, 209, 102, 0.7);
}

.pack {
  position: absolute;
  inset: 0;
}

.dot {
  position: absolute;
  top: 50%;
  width: 7px;
  height: 7px;
  margin-top: -3.5px;
  border-radius: 50%;
  transition: left 0.12s linear;
}

.dot.ahead {
  background: #e0685f;
}

.dot.behind {
  background: #4a5568;
}

.split-row {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}
</style>
