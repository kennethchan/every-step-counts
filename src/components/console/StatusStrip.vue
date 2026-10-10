<script setup>
/**
 * Status strip: day/week, money, fatigue, location, settings.
 * Fatigue shows as a bar only; an HR monitor reveals the precise number.
 */
import { computed } from 'vue'
import { fmtMoney } from '@/utils/format.js'

const props = defineProps({
  day: { type: Number, required: true },
  week: { type: Number, required: true },
  money: { type: Number, required: true },
  fatigue: { type: Number, required: true },
  showPreciseFatigue: { type: Boolean, default: false },
  locations: { type: Array, default: () => [] },
  locationId: { type: String, default: 'park' },
})

defineEmits(['settings', 'location'])

const fatigueTip = computed(
  () =>
    `Fatigue — accumulated tiredness from hard training.\n\n` +
    `Now: ${Math.round(props.fatigue)}/100\n\n` +
    `High fatigue scales DOWN the gains of your next session (to 20% when maxed).\n` +
    `Rest clears the most; a recovery run clears less but still earns a little fitness.`,
)

const locationTip = computed(
  () =>
    `Location — purely cosmetic scenery. New locations unlock as milestone rewards,\n` +
    `from The Park all the way to The Stadium. Switching never changes the simulation.`,
)
</script>

<template>
  <div class="status">
    <div class="left">
      <span class="day" v-tooltip="'In-game day. One training session advances one day.'">Day {{ day }}</span>
      <span class="muted small">· Week {{ week }}</span>
    </div>

    <div class="fatigue" v-tooltip="fatigueTip">
      <span class="lbl small">Fatigue</span>
      <div class="bar fatigue">
        <span :style="{ width: `${fatigue}%` }" />
      </div>
      <span class="val small">{{ showPreciseFatigue ? Math.round(fatigue) : '??' }}</span>
    </div>

    <div class="spacer" />

    <select
      class="loc"
      :value="locationId"
      v-tooltip="locationTip"
      aria-label="Location"
      @change="$emit('location', $event.target.value)"
    >
      <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
    </select>

    <span
      class="money gold"
      v-tooltip="'Money — won from race prizes. Spent in the Shop on gear, which is permanent.'"
    >
      {{ fmtMoney(money) }}
    </span>
    <button
      class="ghost"
      v-tooltip="{ text: 'Settings — playback speed, save info and reset.', place: 'left' }"
      aria-label="Settings"
      @click="$emit('settings')"
    >
      ⚙
    </button>
  </div>
</template>

<style scoped>
.status {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
  padding: 8px 12px;
  background: var(--panel-2);
  border-bottom: 2px solid var(--line);
}

.left {
  white-space: nowrap;
}

.day {
  font-weight: 700;
}

.fatigue {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: 1 1 70px;
  min-width: 58px;
}

.fatigue .lbl {
  color: var(--muted);
  white-space: nowrap;
}

.fatigue .bar {
  flex: 1;
  min-width: 26px;
  height: 10px;
}

.val {
  width: 18px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.money {
  font-weight: 700;
  white-space: nowrap;
  flex: 0 0 auto;
  font-variant-numeric: tabular-nums;
}

.loc {
  background: var(--panel);
  color: var(--text);
  border: 2px solid var(--line);
  border-radius: var(--radius);
  padding: 3px 4px;
  font-family: inherit;
  font-size: 11px;
  flex: 0 0 auto;
}
</style>
