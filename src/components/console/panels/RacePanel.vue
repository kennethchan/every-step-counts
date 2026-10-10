<script setup>
/**
 * Race panel — pick a distance, a tier (gated by an absolute qualifying
 * standard), and a pre-race pacing strategy. No in-race control: the drama is
 * watching the strategy play out.
 */
import { computed, ref } from 'vue'
import { fmtTime, fmtPace, paceOf, ordinal } from '@/utils/format.js'
import { RACE } from '@/data/balance.js'

const props = defineProps({
  distances: { type: Array, required: true },
  tiers: { type: Array, required: true },
  showPredictedTimes: { type: Boolean, default: false },
  pbs: { type: Object, required: true },
  results: { type: Array, default: () => [] },
  predictedFor: { type: Function, required: true },
  fatigue: { type: Number, default: 0 },
})

const emit = defineEmits(['race'])

const selectedDistance = ref(null)
const selectedTier = ref('local')
const pacing = ref('even')

const coverable = computed(() => props.distances.filter((d) => d.coverable))

// Default to the longest race the runner can currently cover.
if (selectedDistance.value === null && coverable.value.length) {
  selectedDistance.value = coverable.value[coverable.value.length - 1].metres
}

/** Predicted 5k from current fitness — used for tier qualification. */
const predicted5k = computed(() => props.predictedFor(5000))

function qualified(tier) {
  if (tier.qualifier === null || tier.qualifier === undefined) return true
  return predicted5k.value <= tier.qualifier
}

const currentTier = computed(() => props.tiers.find((t) => t.id === selectedTier.value))
const currentDistance = computed(() => props.distances.find((d) => d.metres === selectedDistance.value))

const prediction = computed(() =>
  selectedDistance.value ? props.predictedFor(selectedDistance.value) : null,
)

/** Race-day fatigue penalty (display only; the sim applies it via pace). */
const fatigueNote = computed(() => {
  if (props.fatigue < 40) return null
  return props.fatigue > 70 ? 'Heavy legs — expect a slow one.' : 'A little tired.'
})

const canRace = computed(
  () =>
    selectedDistance.value !== null &&
    currentTier.value !== undefined &&
    qualified(currentTier.value),
)

/** Tooltip for the enter button, explaining any blocker. */
const enterTip = computed(() => {
  if (selectedDistance.value === null) return 'Pick a distance first.'
  if (!currentDistance.value?.coverable) return 'You cannot yet cover this distance.'
  if (!currentTier.value) return 'Pick a field tier.'
  if (!qualified(currentTier.value)) {
    return `Not qualified for the ${currentTier.value.name} field — it needs a 5k under ${fmtTime(
      currentTier.value.qualifier,
    )}.`
  }
  const parts = [
    `Start the ${currentTier.value.name} ${currentDistance.value.short} race.`,
    `Pacing: ${RACE.pacing[pacing.value]?.label ?? pacing.value}.`,
  ]
  if (props.showPredictedTimes && prediction.value) {
    parts.push(`Predicted: ${fmtTime(prediction.value)} (${fmtPace(paceOf(prediction.value, selectedDistance.value))}).`)
  }
  return parts.join('\n')
})

function enter() {
  if (!canRace.value) return
  emit('race', {
    distance: selectedDistance.value,
    tier: selectedTier.value,
    pacing: pacing.value,
  })
}

/** Tooltip for a distance chip. */
function distanceTip(d) {
  const km = d.metres >= 1000 ? d.metres / 1000 : d.metres
  if (!d.coverable) {
    return `${d.short} (${km} km) — locked.\n\nYou cannot yet cover this far. Raise your max distance by training durability and efficiency (long and easy runs).`
  }
  return `${d.label} (${km} km).\n\nClick to select. ${
    props.showPredictedTimes ? `Predicted: ${fmtTime(props.predictedFor(d.metres))}` : 'Buy a GPS watch to see predicted times.'
  }`
}

/** Tooltip for a tier chip. */
function tierTip(t) {
  const qual = t.qualifier
  if (!qual) {
    return `${t.name} — open to all.\n\nA casual field. Prize on a win: about $${t.prize} at 5k.`
  }
  const ok = qualified(t)
  return (
    `${t.name} field — needs a 5k under ${fmtTime(qual)}.\n\n` +
    `Your current 5k: ${props.showPredictedTimes ? fmtTime(predicted5k.value) : '??'}.\n` +
    (ok ? 'You qualify.' : 'Not yet qualified — get faster first.') +
    `\nBigger field, bigger prize (about $${t.prize} at 5k).`
  )
}

const pacingTips = {
  even: 'Even split — hold one pace the whole way.\n\nBalanced and safe. No penalty for any runner profile.',
  negative: 'Negative split — start about 3% slower, finish faster.\n\nRewards high durability. Gives up early position.',
  positive: 'Positive split — start about 3% faster, then fade.\n\nRewards high top-end speed and short races. Blows up if durability is low.',
  auto: 'Auto — the coach picks the best strategy for your profile.',
}
</script>

<template>
  <div class="race">
    <h3>Choose a race</h3>

    <div class="group">
      <div class="group-label small muted" v-tooltip="'How far you will race. Distances unlock as your max sustainable distance grows.'">Distance</div>
      <div class="chips">
        <button
          v-for="d in distances"
          :key="d.metres"
          class="chip"
          :class="{ on: d.metres === selectedDistance, off: !d.coverable }"
          :disabled="!d.coverable"
          v-tooltip="distanceTip(d)"
          @click="selectedDistance = d.metres"
        >
          {{ d.short }}
        </button>
      </div>
    </div>

    <div class="group">
      <div class="group-label small muted" v-tooltip="'Field strength, set by absolute standards. Higher tiers need a qualifying 5k time but pay much more.'">Field tier (absolute standards)</div>
      <div class="chips">
        <button
          v-for="t in tiers"
          :key="t.id"
          class="chip"
          :class="{ on: t.id === selectedTier, off: !qualified(t) }"
          :disabled="!qualified(t)"
          v-tooltip="tierTip(t)"
          @click="selectedTier = t.id"
        >
          {{ t.name }}
        </button>
      </div>
    </div>

    <div class="group">
      <div class="group-label small muted" v-tooltip="'Chosen before the race — there is no in-race control. Your stats decide which strategy suits you.'">Pacing strategy</div>
      <div class="chips">
        <button
          v-for="(p, key) in RACE.pacing"
          :key="key"
          class="chip"
          :class="{ on: pacing === key }"
          v-tooltip="pacingTips[key]"
          @click="pacing = key"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <div class="panel summary">
      <div class="row between" v-tooltip="'Your pace per kilometre at this distance. Hidden until you own a GPS watch.'">
        <span class="small muted">Predicted pace</span>
        <span v-if="showPredictedTimes && prediction" class="mono pace">
          {{ fmtPace(paceOf(prediction, selectedDistance)) }}
        </span>
        <span v-else class="small muted">?? (buy a GPS watch)</span>
      </div>
      <div class="row between" v-tooltip="'Total predicted finish time at this distance.'">
        <span class="small muted">Predicted time</span>
        <span v-if="showPredictedTimes && prediction" class="mono">{{ fmtTime(prediction) }}</span>
        <span v-else class="small muted">??</span>
      </div>
      <div class="row between" v-tooltip="'Your predicted 5k pace — this is also what decides tier qualification.'">
        <span class="small muted">Your 5k pace</span>
        <span v-if="showPredictedTimes" class="mono">{{ fmtPace(paceOf(predicted5k, 5000)) }}</span>
        <span v-else class="small muted">??</span>
      </div>
      <div v-if="fatigueNote" class="small bad">{{ fatigueNote }}</div>
    </div>

    <button class="primary full" :disabled="!canRace" v-tooltip="enterTip" @click="enter">Enter race</button>

    <div v-if="results.length" class="panel">
      <h3>Recent races</h3>
      <div v-for="(r, i) in results.slice(0, 6)" :key="i" class="result small">
        <span class="mono">{{ r.distance >= 1000 ? r.distance / 1000 + 'k' : r.distance + 'm' }}</span>
        <span class="muted">{{ r.tier }}</span>
        <span class="spacer" />
        <span class="mono">{{ fmtPace(paceOf(r.time, r.distance)) }}</span>
        <span class="muted">{{ fmtTime(r.time) }}</span>
        <span class="muted">{{ ordinal(r.place) }}</span>
        <span v-if="r.isPb" class="gold">PB</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.race {
  padding: 12px;
}

.group {
  margin-bottom: 10px;
}

.group-label {
  margin-bottom: 4px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  padding: 5px 10px;
  font-size: 12px;
}

.chip.on {
  border-color: var(--accent);
  background: #2f2617;
  color: var(--accent);
}

.chip.off {
  opacity: 0.35;
}

.summary {
  margin: 10px 0;
}

.summary .row {
  margin-bottom: 2px;
}

.pace {
  color: var(--accent);
  font-weight: 700;
}

.mono {
  font-variant-numeric: tabular-nums;
}

.full {
  width: 100%;
  padding: 9px;
}

.result {
  display: flex;
  gap: 8px;
  align-items: baseline;
  padding: 2px 0;
}
</style>
