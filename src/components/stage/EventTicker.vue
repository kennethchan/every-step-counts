<script setup>
/**
 * Recent-events ticker under the scene — a quiet running commentary of what
 * just happened (sessions, PBs, unlocks, purchases).
 */
defineProps({
  events: { type: Array, default: () => [] },
})
</script>

<template>
  <div class="ticker" v-tooltip="{ text: 'Recent events — sessions, races, purchases and milestones, newest first.', place: 'top' }">
    <div v-if="!events.length" class="small muted empty">Nothing yet — run your first session.</div>
    <div v-for="(ev, i) in events.slice(0, 4)" :key="i" class="line" :class="ev.kind">
      <span class="day small muted">d{{ ev.day }}</span>
      <span class="text small">{{ ev.text }}</span>
      <span v-if="ev.prize" class="gold small">+${{ ev.prize }}</span>
      <span v-if="ev.isPb" class="gold small">PB</span>
    </div>
  </div>
</template>

<style scoped>
.ticker {
  padding: 6px 12px 8px;
  border-top: 1px solid var(--line-soft);
  background: var(--panel);
  min-height: 62px;
}

.line {
  display: flex;
  gap: 8px;
  align-items: baseline;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.line.milestone .text {
  color: var(--gold);
}

.line.race .text {
  color: var(--accent-2);
}

.line.gear .text {
  color: #b39ddb;
}

.empty {
  padding-top: 14px;
}
</style>
