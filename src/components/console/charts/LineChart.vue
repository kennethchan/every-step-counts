<script setup>
/**
 * Lightweight hand-rolled SVG line chart. No charting dependency — time-series
 * lines are simple, and hand-rolling keeps the pixel look and full control.
 */
import { computed } from 'vue'

const props = defineProps({
  series: { type: Array, required: true }, // [{ label, color, points: [{x,y}] }]
  height: { type: Number, default: 130 },
  width: { type: Number, default: 320 },
  maxY: { type: Number, default: null },
  yLabel: { type: String, default: '' },
})

const pad = { top: 8, right: 8, bottom: 16, left: 22 }

const bounds = computed(() => {
  const xs = props.series.flatMap((s) => s.points.map((p) => p.x))
  const ys = props.series.flatMap((s) => s.points.map((p) => p.y))
  const minX = xs.length ? Math.min(...xs) : 0
  const maxX = xs.length ? Math.max(...xs) : 1
  const minY = 0
  const maxY = props.maxY ?? (ys.length ? Math.max(...ys) : 1)
  return { minX, maxX: maxX === minX ? minX + 1 : maxX, minY, maxY: maxY === minY ? minY + 1 : maxY }
})

function px(x) {
  const { minX, maxX } = bounds.value
  const w = props.width - pad.left - pad.right
  return pad.left + ((x - minX) / (maxX - minX)) * w
}

function py(y) {
  const { minY, maxY } = bounds.value
  const h = props.height - pad.top - pad.bottom
  return pad.top + (1 - (y - minY) / (maxY - minY)) * h
}

function path(points) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ')
}

const hasData = computed(() => props.series.some((s) => s.points.length > 1))
</script>

<template>
  <div class="chart">
    <svg :viewBox="`0 0 ${width} ${height}`" :height="height" preserveAspectRatio="none">
      <!-- axes -->
      <line :x1="pad.left" :y1="pad.top" :x2="pad.left" :y2="height - pad.bottom" stroke="#2a3141" />
      <line
        :x1="pad.left"
        :y1="height - pad.bottom"
        :x2="width - pad.right"
        :y2="height - pad.bottom"
        stroke="#2a3141"
      />
      <text :x="2" :y="pad.top + 6" fill="#98a2b8" font-size="8">{{ Math.round(bounds.maxY) }}</text>
      <text :x="2" :y="height - pad.bottom" fill="#98a2b8" font-size="8">0</text>

      <path
        v-for="(s, i) in series"
        :key="i"
        :d="path(s.points)"
        fill="none"
        :stroke="s.color"
        stroke-width="1.7"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
    <div v-if="!hasData" class="small muted overlay">not enough data yet</div>
    <div class="legend">
      <span v-for="(s, i) in series" :key="i" class="legend-item small">
        <i :style="{ background: s.color }" />{{ s.label }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.chart {
  position: relative;
  background: #14171f;
  border: 2px solid var(--line);
  border-radius: var(--radius);
  padding: 4px;
}

svg {
  display: block;
  width: 100%;
}

.overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 2px 4px 4px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--muted);
}

.legend-item i {
  width: 10px;
  height: 3px;
  border-radius: 2px;
  display: inline-block;
}
</style>
