<script setup>
/**
 * Journal — personal bests, the milestone shelf, and progression charts.
 * Only visible once the Training Log has been bought.
 */
import { computed } from 'vue'
import LineChart from '../charts/LineChart.vue'
import { fmtTime, fmtPace, paceOf, ordinal, fmtDistance } from '@/utils/format.js'

const props = defineProps({
  pbs: { type: Object, required: true },
  milestones: { type: Array, required: true },
  results: { type: Array, default: () => [] },
  vitalsHistory: { type: Array, default: () => [] },
  distances: { type: Array, default: () => [] },
})

const pbRows = computed(() =>
  props.distances
    .filter((d) => props.pbs[String(d.metres)] !== undefined)
    .map((d) => ({
      label: d.label,
      short: d.short,
      time: props.pbs[String(d.metres)],
      pace: paceOf(props.pbs[String(d.metres)], d.metres),
    })),
)

const earned = computed(() => props.milestones.filter((m) => m.earned))
const unearned = computed(() => props.milestones.filter((m) => !m.earned))

/** Tooltip for a milestone trophy. */
function milestoneTip(m) {
  const how =
    m.kind === 'distance'
      ? 'Earned by extending your max sustainable distance.'
      : m.kind === 'race'
        ? 'Earned by racing.'
        : 'Earned by hitting a target time.'
  return `${m.label}\n\n${how}\n${m.earned ? 'Earned.' : 'Not yet earned.'}`
}

const VITAL_COLORS = {
  capacity: '#ef476f',
  efficiency: '#118ab2',
  threshold: '#06d6a0',
  economy: '#ffd166',
  speed: '#f78c6b',
  durability: '#9d8df1',
}

const vitalSeries = computed(() =>
  ['capacity', 'threshold', 'durability', 'economy'].map((id) => ({
    label: id,
    color: VITAL_COLORS[id],
    points: props.vitalsHistory.map((h) => ({ x: h.day, y: h.vitals[id] })),
  })),
)

const distanceSeries = computed(() => [
  {
    label: 'max distance (km)',
    color: '#b39ddb',
    points: props.vitalsHistory.map((h) => ({ x: h.day, y: h.maxDistance })),
  },
])
</script>

<template>
  <div class="journal">
    <h3>Personal bests</h3>
    <div v-if="!pbRows.length" class="small muted">No races yet — enter one from the Race tab.</div>
    <div v-else class="panel pbs">
      <div
        v-for="row in pbRows"
        :key="row.short"
        class="pb"
        v-tooltip="`${row.label} personal best.\n\nTime: ${fmtTime(row.time)}\nPace: ${fmtPace(row.pace)}`"
      >
        <span class="short">{{ row.short }}</span>
        <span class="spacer" />
        <span class="mono muted">{{ fmtTime(row.time) }}</span>
        <span class="mono gold">{{ fmtPace(row.pace) }}</span>
      </div>
    </div>

    <h3>Progression</h3>
    <LineChart :series="vitalSeries" :max-y="100" />
    <p class="small muted" v-tooltip="'Your six trainable vitals, on their 0–100 scale, sampled once per training day.'">
      Vitals over time (0–100)
    </p>
    <div style="height: 8px" />
    <LineChart :series="distanceSeries" :height="110" y-label="km" />
    <p class="small muted" v-tooltip="'How far you could sustain, rising as durability and efficiency grow. Cross 42.195 km and you could race a marathon.'">
      Max sustainable distance over time
    </p>

    <h3>Milestones ({{ earned.length }}/{{ milestones.length }})</h3>
    <div class="shelf">
      <span
        v-for="m in milestones"
        :key="m.id"
        class="trophy"
        :class="{ on: m.earned }"
        v-tooltip="milestoneTip(m)"
      >
        {{ m.earned ? '★' : '☆' }} {{ m.label }}
      </span>
    </div>

    <h3>Race history</h3>
    <div v-if="!results.length" class="small muted">Nothing yet.</div>
    <div v-else class="panel history">
      <div v-for="(r, i) in results.slice(0, 12)" :key="i" class="row-line small">
        <span class="muted">d{{ r.day }}</span>
        <span class="mono">{{ fmtDistance(r.distance) }}</span>
        <span class="muted">{{ r.tier }}</span>
        <span class="spacer" />
        <span class="mono">{{ fmtPace(paceOf(r.time, r.distance)) }}</span>
        <span class="mono muted">{{ fmtTime(r.time) }}</span>
        <span class="muted">{{ ordinal(r.place) }}/{{ r.fieldSize }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.journal {
  padding: 12px;
}

.journal h3 {
  margin-top: 12px;
}

.pbs .pb {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 2px 0;
}

.short {
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}

.mono {
  font-variant-numeric: tabular-nums;
}

.shelf {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.trophy {
  color: #4a5568;
}

.trophy.on {
  color: var(--gold);
}

.row-line {
  display: flex;
  gap: 8px;
  align-items: baseline;
  padding: 2px 0;
}
</style>
