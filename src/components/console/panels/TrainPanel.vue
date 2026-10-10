<script setup>
/**
 * Train panel — pick a session. Each row is explicit about what it trains and
 * what it costs in fatigue, so the choice is informed.
 */
import { computed } from 'vue'
import { VITAL_META } from '@/data/balance.js'
import { getSession } from '@/data/sessions.js'

const props = defineProps({
  sessions: { type: Array, required: true },
  allSessions: { type: Array, required: true },
  fatigue: { type: Number, required: true },
  running: { type: Boolean, default: false },
  currentId: { type: String, default: null },
  showCoach: { type: Boolean, default: false },
  vitals: { type: Object, required: true },
  fatigueGainMultiplier: { type: Number, default: 1 },
})

defineEmits(['start'])

/** Vital a session primarily targets (its largest gain). */
function primaryVital(session) {
  const entries = Object.entries(session.gains ?? {})
  if (!entries.length) return null
  return entries.sort((a, b) => b[1] - a[1])[0][0]
}

/** "<+1.1 eff, +0.5 dur>" style summary. */
function gainSummary(session) {
  const entries = Object.entries(session.gains ?? {})
  if (!entries.length) return 'no gains'
  return entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, amount]) => `+${amount} ${VITAL_META[id].short.toLowerCase()}`)
    .join(', ')
}

function fatigueText(session) {
  if (session.fatigue === 0) return '±0'
  return session.fatigue > 0 ? `+${session.fatigue}` : `${session.fatigue}`
}

/** Tooltip explaining what a session does and what it costs. */
function sessionTip(session) {
  const lines = [session.name, session.desc, '']
  const entries = Object.entries(session.gains ?? {})
  if (entries.length) {
    lines.push('Builds:')
    for (const [id, amount] of entries.sort((a, b) => b[1] - a[1])) {
      lines.push(`  +${amount} ${VITAL_META[id].label}`)
    }
  } else {
    lines.push('Builds nothing — it exists purely to recover.')
  }
  lines.push('')
  lines.push(
    session.fatigue < 0
      ? `Fatigue: ${session.fatigue} (recovers)`
      : `Fatigue: +${session.fatigue} (adds tiredness)`,
  )
  lines.push('Gains are scaled by current freshness.')
  lines.push(`Takes ${session.days} day.`)
  return lines.join('\n')
}

/** Tooltip for the go button. */
function startTip(session) {
  if (props.running) return 'A session is already running.'
  return `Start ${session.name} — ${session.days} day, fatigue ${
    session.fatigue < 0 ? session.fatigue : `+${session.fatigue}`
  }.`
}

/** Hint for a locked session — the first unmet condition. */
function lockHint(session) {
  const u = session.unlock
  if (!u) return ''
  for (const [key, need] of Object.entries(u)) {
    if (key === 'flag') return `needs ${need}`
    if (key === 'durability' || key === 'efficiency' || key === 'capacity' || key === 'threshold' || key === 'economy') {
      if (props.vitals[key] < need) return `${VITAL_META[key].short} ≥ ${need}`
    }
  }
  return 'locked'
}

/** Coach suggestion: rest when tired, otherwise train your weakest area. */
const suggestion = computed(() => {
  if (props.fatigue > 58) return getSession('rest')
  const trainable = props.sessions.filter((s) => !s.rest)
  if (!trainable.length) return null
  let best = null
  let bestScore = Infinity
  for (const s of trainable) {
    const vital = primaryVital(s)
    if (!vital) continue
    const score = props.vitals[vital] - (s.gains[vital] ?? 0) * 5
    if (score < bestScore) {
      bestScore = score
      best = s
    }
  }
  return best
})
</script>

<template>
  <div class="train">
    <div v-if="showCoach && suggestion" class="panel coach" v-tooltip="'The club coach suggests a session based on your profile — your weakest vital, or rest if you are tired. A convenience, not a restriction.'">
      <span class="star">★</span>
      <span>Coach suggests <strong>{{ suggestion.name }}</strong></span>
    </div>

    <h3>Available sessions</h3>
    <div class="list">
      <div
        v-for="s in sessions"
        :key="s.id"
        class="session"
        :class="{ active: currentId === s.id, rest: s.rest }"
        v-tooltip="sessionTip(s)"
      >
        <div class="info">
          <div class="name">
            {{ s.name }}
            <span v-if="s.rest" class="badge">recovery</span>
          </div>
          <div class="small muted">{{ s.desc }}</div>
          <div class="small effects">
            <span class="gain">{{ gainSummary(s) }}</span>
            <span class="fatigue" :class="{ good: s.fatigue < 0, bad: s.fatigue >= 16 }">
              fatigue {{ fatigueText(s) }}
            </span>
          </div>
        </div>
        <button class="primary" :disabled="running" v-tooltip="startTip(s)" @click="$emit('start', s.id)">
          {{ currentId === s.id ? '…' : 'Go' }}
        </button>
      </div>
    </div>

    <div v-if="allSessions.some((s) => !s.unlocked)" class="panel locked">
      <h3>Coming up</h3>
      <div
        v-for="s in allSessions.filter((x) => !x.unlocked)"
        :key="s.id"
        class="locked-row"
        v-tooltip="`${s.name} — ${s.desc}\n\nUnlocks when: ${lockHint(s)}`"
      >
        <span class="name small">{{ s.name }}</span>
        <span class="spacer" />
        <span class="small muted">{{ lockHint(s) }}</span>
      </div>
    </div>

    <p
      class="small muted note"
      v-tooltip="'Fatigue scales everything you gain. At 0 fatigue you gain 100%; at 100 fatigue only 20%. Rest between hard sessions to keep this high.'"
    >
      Gains are scaled by freshness — currently ×{{ fatigueGainMultiplier.toFixed(2) }}. Rest to keep it high.
    </p>
  </div>
</template>

<style scoped>
.train {
  padding: 12px;
}

.coach {
  display: flex;
  align-items: center;
  gap: 8px;
  border-color: #7a5a34;
  background: #241d12;
  margin-bottom: 10px;
}

.star {
  color: var(--gold);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.session {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--panel);
  border: 2px solid var(--line);
  border-radius: var(--radius);
}

.session.active {
  border-color: var(--accent);
}

.session.rest {
  border-style: dashed;
}

.info {
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

.effects {
  display: flex;
  gap: 12px;
  margin-top: 2px;
}

.gain {
  color: var(--good);
}

.fatigue {
  color: var(--muted);
}

.locked {
  margin-top: 10px;
  opacity: 0.75;
}

.locked-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 2px 0;
}

.note {
  margin-top: 10px;
}
</style>
