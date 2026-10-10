<script setup>
/**
 * Race result card, shown once playback finishes.
 */
import { computed } from 'vue'
import { fmtTime, fmtPace, paceOf, ordinal } from '@/utils/format.js'

const props = defineProps({
  race: { type: Object, required: true },
})

defineEmits(['close'])

const r = computed(() => props.race.result)
const splits = computed(() => props.race.lane.splits)

/** Pacings for each split, in seconds per km. */
const splitPaces = computed(() => {
  const segMetres = r.value.distance / splits.value.length
  return splits.value.map((s) => paceOf(s, segMetres))
})

const fastestPace = computed(() => Math.min(...splitPaces.value))

const placeClass = computed(() => (r.value.place === 1 ? 'gold' : r.value.place <= 3 ? 'good' : ''))
</script>

<template>
  <div class="backdrop" @click.self="$emit('close')">
    <div class="card">
      <div class="head">
        <span class="dist">{{ r.distance >= 1000 ? r.distance / 1000 + 'k' : r.distance + 'm' }}</span>
        <span class="tier muted" v-tooltip="'Field tier — set by absolute standards, not scaled to you.'">{{ r.tier }}</span>
        <span class="spacer" />
        <span class="place" :class="placeClass" v-tooltip="'Your finishing position in the field.'">{{ ordinal(r.place) }}</span>
        <span class="muted small">/ {{ r.fieldSize }}</span>
      </div>

      <div class="pace" v-tooltip="'Your average pace across the whole race.'">{{ fmtPace(paceOf(r.time, r.distance)) }}</div>
      <div class="time muted" v-tooltip="'Total finish time. Pace is the headline, but the clock still tells the story.'">
        finish time {{ fmtTime(r.time) }}
      </div>
      <div class="row">
        <span v-if="r.isPb" class="pb" v-tooltip="'Faster than any previous race at this distance.'">★ New personal best</span>
        <span class="spacer" />
        <span v-if="r.prize" class="gold" v-tooltip="'Prize money, scaled by distance, field tier and placement.'">+${{ r.prize }}</span>
      </div>

      <div class="splits" v-tooltip="'Per-kilometre pace. Bars are sized so a faster split is a longer bar — watch for fading (shortening bars).'">
        <div v-for="(p, i) in splitPaces" :key="i" class="split small">
          <span class="muted">{{ i + 1 }}</span>
          <div class="bar">
            <span :style="{ width: `${(fastestPace / p) * 100}%` }" />
          </div>
          <span class="mono">{{ fmtPace(p) }}</span>
        </div>
      </div>

      <button class="primary full" @click="$emit('close')">Continue</button>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(6, 8, 12, 0.72);
  display: grid;
  place-items: center;
  z-index: 80;
}

.card {
  width: 360px;
  background: var(--panel-2);
  border: 2px solid var(--accent);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
}

.head {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.dist {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.place {
  font-size: 20px;
  font-weight: 700;
}

.pace {
  font-size: 34px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  margin: 6px 0 0;
}

.time {
  font-size: 12px;
  margin-bottom: 8px;
}

.row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.pb {
  color: var(--gold);
}

.splits {
  margin-bottom: 12px;
}

.split {
  display: grid;
  grid-template-columns: 14px 1fr 84px;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}

.mono {
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.full {
  width: 100%;
  padding: 9px;
}
</style>
