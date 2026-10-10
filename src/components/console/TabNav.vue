<script setup>
/**
 * Console tabs. Tabs REVEAL themselves as they unlock, so the UI grows with the
 * player — the same "capability unlock" idea, rendered.
 */
const props = defineProps({
  tabs: { type: Object, required: true },
  active: { type: String, required: true },
})

defineEmits(['select'])

const items = [
  { id: 'train', label: 'Train', key: 'train', tip: 'Pick a training session. Sessions move different vitals — variety beats spamming one.' },
  { id: 'race', label: 'Race', key: 'race', tip: 'Enter a race. Pick distance, field tier and pacing strategy, then watch it play out.' },
  { id: 'shop', label: 'Shop', key: 'shop', tip: 'Spend race prize money on gear. Some items add whole new screens (a GPS watch, the journal).' },
  { id: 'journal', label: 'Journal', key: 'journal', tip: 'Personal bests, milestone shelf, progression charts and full race history.' },
]
</script>

<template>
  <nav class="tabs">
    <button
      v-for="item in items.filter((i) => tabs[i.key])"
      :key="item.id"
      class="tab"
      :class="{ active: active === item.id }"
      v-tooltip="item.tip"
      @click="$emit('select', item.id)"
    >
      {{ item.label }}
    </button>
  </nav>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 4px;
  padding: 8px 12px 0;
  background: var(--panel-2);
}

.tab {
  border: 2px solid var(--line);
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  background: var(--panel);
  color: var(--muted);
  padding: 6px 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 11px;
}

.tab.active {
  background: var(--panel-2);
  color: var(--text);
  border-color: var(--accent);
  box-shadow: inset 0 2px 0 var(--accent);
}
</style>
