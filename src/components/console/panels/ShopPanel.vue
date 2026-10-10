<script setup>
/**
 * Shop. Gear APPEARS once its milestone is reached, then costs money. Two kinds
 * of unlock: efficiency (numbers up) and capability (a new mechanic/screen).
 */
import { computed } from 'vue'
import { GEAR_CATEGORIES } from '@/data/gear.js'
import { fmtMoney } from '@/utils/format.js'

const props = defineProps({
  gear: { type: Array, required: true },
  owned: { type: Array, default: () => [] },
  lockedCount: { type: Number, default: 0 },
  money: { type: Number, required: true },
})

defineEmits(['buy'])

const byCategory = computed(() =>
  GEAR_CATEGORIES.map((cat) => ({
    ...cat,
    items: props.gear.filter((g) => g.def.category === cat.id),
  })).filter((cat) => cat.items.length),
)

function isCapability(def) {
  return def.flags.length > 0
}

/** Human summary of what a gear item's modifiers actually do. */
const MOD_LABELS = {
  capacity: 'VO2 max',
  efficiency: 'aerobic efficiency',
  threshold: 'lactate threshold',
  economy: 'running economy',
  speed: 'top-end speed',
  durability: 'durability',
  all: 'all vitals',
}

/** Tooltip describing an item, including its exact mechanical effect. */
function itemTip(def) {
  const lines = [def.name, def.desc, '']
  const m = def.modifiers
  const effects = []
  if (m.gainMult) {
    for (const [k, v] of Object.entries(m.gainMult)) {
      effects.push(`${Math.round((v - 1) * 100)}% ${MOD_LABELS[k] ?? k} gains`)
    }
  }
  if (m.sessionGainMult) {
    for (const [k, v] of Object.entries(m.sessionGainMult)) {
      effects.push(`${Math.round((v - 1) * 100)}% gains on ${k}`)
    }
  }
  if (m.fatigueMult) {
    for (const [k, v] of Object.entries(m.fatigueMult)) {
      effects.push(`${Math.round((1 - v) * 100)}% less fatigue on ${k}`)
    }
  }
  if (m.restRecoveryBonus) effects.push(`+${m.restRecoveryBonus} rest recovery`)
  if (m.recoveryRunBonus) effects.push(`+${m.recoveryRunBonus} recovery-run recovery`)
  if (m.racePaceMult) effects.push(`${Math.round((m.racePaceMult - 1) * 100)}% race pace`)

  lines.push(effects.length ? `Effects: ${effects.join(', ')}.` : 'No passive effects.')
  if (isCapability(def)) lines.push('Capability unlock — adds a new screen or session type.')
  lines.push('Permanent — gear never wears out.')
  return lines.join('\n')
}

/** Tooltip for the buy button. */
function buyTip(item) {
  if (props.money < item.def.price) {
    return `Costs ${fmtMoney(item.def.price)} — you have ${fmtMoney(props.money)}.\nWin more prize money by racing.`
  }
  return `Buy ${item.def.name} for ${fmtMoney(item.def.price)}.`
}
</script>

<template>
  <div class="shop">
    <div class="row between head">
      <h3 style="margin: 0">Shop</h3>
      <span class="gold">{{ fmtMoney(money) }}</span>
    </div>

    <div v-if="!gear.length && !owned.length" class="panel empty small muted">
      Win some prize money and gear will start appearing here.
    </div>

    <div v-for="cat in byCategory" :key="cat.id" class="cat">
      <div class="cat-label small">{{ cat.label }}</div>
      <div
        v-for="item in cat.items"
        :key="item.def.id"
        class="item"
        :class="{ afford: item.affordable }"
        v-tooltip="itemTip(item.def)"
      >
        <div class="item-main">
          <div class="name">
            {{ item.def.name }}
            <span
              v-if="isCapability(item.def)"
              class="badge"
              v-tooltip="'Capability unlock — this adds a new screen, readout or session type rather than just a bonus.'"
            >
              capability
            </span>
          </div>
          <div class="small muted">{{ item.def.desc }}</div>
        </div>
        <div class="item-buy">
          <span class="price" :class="{ gold: item.affordable }">{{ fmtMoney(item.def.price) }}</span>
          <button
            class="primary"
            :disabled="!item.affordable"
            v-tooltip="buyTip(item)"
            @click="$emit('buy', item.def.id)"
          >
            Buy
          </button>
        </div>
      </div>
    </div>

    <div v-if="owned.length" class="cat">
      <div class="cat-label small">Owned</div>
      <div
        class="owned small muted"
        v-tooltip="'Owned gear is permanent and its effects are already applied to your gains.'"
      >
        {{ owned.length }} item(s) owned
      </div>
    </div>

    <p v-if="lockedCount" class="small muted note" v-tooltip="'More gear appears in the shop as you reach milestones — first races, longer max distances, faster times.'">
      {{ lockedCount }} more item(s) unlock as you progress.
    </p>
  </div>
</template>

<style scoped>
.shop {
  padding: 12px;
}

.head {
  margin-bottom: 10px;
}

.cat {
  margin-bottom: 10px;
}

.cat-label {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
  margin-bottom: 4px;
}

.item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  background: var(--panel);
  border: 2px solid var(--line);
  border-radius: var(--radius);
  margin-bottom: 5px;
  opacity: 0.8;
}

.item.afford {
  opacity: 1;
  border-color: #3d4a63;
}

.item-main {
  flex: 1;
  min-width: 0;
}

.name {
  font-weight: 700;
}

.badge {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--accent-2);
  border: 1px solid #2c5f5a;
  border-radius: 3px;
  padding: 0 4px;
  margin-left: 6px;
}

.item-buy {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price {
  font-variant-numeric: tabular-nums;
}

.empty {
  margin-bottom: 10px;
}

.note {
  margin-top: 8px;
}
</style>
