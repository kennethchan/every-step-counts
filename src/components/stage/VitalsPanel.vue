<script setup>
/**
 * Vitals block — lives under the scene on the stage side, so stats are always
 * visible next to the animation.
 *
 * Progressive disclosure: without a GPS watch the bars are UNLABELLED BY NUMBER
 * (you can feel your fitness but not measure it). Buying tech adds numbers.
 */
import { computed } from 'vue'
import { VITAL_META, VITALS, MAX_DISTANCE } from '@/data/balance.js'

const props = defineProps({
  vitals: { type: Object, required: true },
  maxKm: { type: Number, required: true },
  showNumbers: { type: Boolean, default: false },
})

const COLORS = {
  capacity: '#ef476f',
  efficiency: '#118ab2',
  threshold: '#06d6a0',
  economy: '#ffd166',
  speed: '#f78c6b',
  durability: '#9d8df1',
}

/** What each vital actually does on race day. */
const EFFECTS = {
  capacity: 'Raises your ceiling pace over every distance.',
  efficiency: 'Lets you use more of your ceiling, and extends your range.',
  threshold: 'Lets you hold a faster pace for longer.',
  economy: 'Speed per unit of effort — free pace at any distance.',
  speed: 'Your finishing kick, and short-race pace.',
  durability: 'Reduces fading over distance and extends your range.',
}

const rows = computed(() =>
  VITALS.map((id) => ({
    id,
    label: VITAL_META[id].short,
    full: VITAL_META[id].label,
    desc: VITAL_META[id].desc,
    value: props.vitals[id],
    color: COLORS[id],
    tip: tooltipFor(id),
  })),
)

/** Rich tooltip: what the vital is, plus what it currently does for you. */
function tooltipFor(id) {
  const meta = VITAL_META[id]
  const value = props.vitals[id]
  const effect = EFFECTS[id] ?? ''
  const reading = props.showNumbers ? `${Math.round(value)}/100` : 'unmeasured (buy a GPS watch)'
  return `${meta.label} — ${meta.desc}\n\nNow: ${reading}\n${effect}`.trim()
}

/** Next distance milestone the runner is working toward. */
const nextMilestone = computed(() => {
  const targets = [3, 5, 10, 21.097, 42.195, 50]
  return targets.find((t) => props.maxKm < t) ?? 50
})

const distanceProgress = computed(() => {
  const prevTargets = [2, 3, 5, 10, 21.097, 42.195]
  const target = nextMilestone.value
  const from = [...prevTargets].reverse().find((t) => t <= props.maxKm) ?? 2
  const pct = ((props.maxKm - from) / (target - from)) * 100
  return Math.max(0, Math.min(100, pct))
})

/** Tooltip for the max-distance row. */
const distanceTip = computed(
  () =>
    `Maximum sustainable distance — how far you can currently cover.\n\n` +
    `Now: ${props.maxKm.toFixed(1)} km\n` +
    `Next milestone: ${nextMilestone.value} km\n\n` +
    `You cannot enter a race beyond this distance. It grows with durability and efficiency.`,
)
</script>

<template>
  <div class="vitals">
    <div class="vitals-head">
      <h3>Vitals</h3>
      <span class="small muted">{{ showNumbers ? 'measured' : 'unmeasured — buy a GPS watch' }}</span>
    </div>

    <div v-for="row in rows" :key="row.id" class="vital" v-tooltip="row.tip">
      <span class="vital-label">{{ row.label }}</span>
      <div class="bar">
        <span :style="{ width: `${row.value}%`, background: row.color }" />
      </div>
      <span class="vital-value" :class="{ hidden: !showNumbers }">
        {{ showNumbers ? Math.round(row.value) : '??' }}
      </span>
    </div>

    <div class="vital distance-row" v-tooltip="distanceTip">
      <span class="vital-label">Max dist</span>
      <div class="bar distance">
        <span :style="{ width: `${distanceProgress}%` }" />
      </div>
      <span class="vital-value">{{ maxKm.toFixed(1) }}k</span>
    </div>
    <div class="next small muted" v-tooltip="'The distance milestone you are currently working toward. Extend max distance by training durability and efficiency.'">
      next milestone: {{ nextMilestone }} km
    </div>
  </div>
</template>

<style scoped>
.vitals {
  padding: 10px 12px;
  border-top: 2px solid var(--line);
  background: var(--panel);
}

.vitals-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}

.vitals-head h3 {
  margin: 0;
}

.vital {
  display: grid;
  grid-template-columns: 74px 1fr 42px;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.vital-label {
  font-size: 11px;
  color: var(--muted);
}

.vital-value {
  text-align: right;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.vital-value.hidden {
  opacity: 0.35;
}

.distance-row {
  margin-top: 8px;
}

.next {
  text-align: right;
  margin-top: 2px;
}
</style>
