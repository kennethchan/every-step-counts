<script setup>
/**
 * Settings: fast-mode controls, save info, and a hard reset.
 */
import { computed } from 'vue'

const props = defineProps({
  settings: { type: Object, required: true },
  day: { type: Number, required: true },
  money: { type: Number, required: true },
  sessionsCompleted: { type: Number, default: 0 },
  racesCompleted: { type: Number, default: 0 },
})

defineEmits(['set-settings', 'reset'])

const efficiency = computed(() => {
  if (props.settings.fastMode) return 'all sessions resolve instantly'
  if (props.settings.autoFastMode) return 'repeated sessions speed up automatically'
  return 'every session plays in full'
})
</script>

<template>
  <div class="settings">
    <h3>Playback</h3>
    <label
      class="toggle"
      v-tooltip="'Resolve every session instantly, with no animation. Best once you know the game.'"
    >
      <input
        type="checkbox"
        :checked="settings.fastMode"
        @change="$emit('set-settings', { fastMode: $event.target.checked })"
      />
      <span>Fast mode (skip the animation entirely)</span>
    </label>
    <label
      class="toggle"
      v-tooltip="'Sessions you have performed several times resolve in about a second instead of the full animation.'"
    >
      <input
        type="checkbox"
        :checked="settings.autoFastMode"
        @change="$emit('set-settings', { autoFastMode: $event.target.checked })"
      />
      <span>Speed up sessions I've done several times</span>
    </label>
    <p class="small muted">{{ efficiency }}</p>

    <h3>Save</h3>
    <div class="panel small" v-tooltip="'Your game autosaves to this browser after every action. There is no cloud save.'">
      <div>Day {{ day }} · {{ sessionsCompleted }} sessions · {{ racesCompleted }} races</div>
      <div class="muted">Autosaves to localStorage after every action.</div>
    </div>

    <button
      class="danger"
      v-tooltip="'Permanently erases your save and restarts the journey from day 1. There is no undo.'"
      @click="$emit('reset')"
    >
      Reset game (erase save)
    </button>
    <p class="small muted">
      This is a finite journey: get fit enough, race every distance, and finish a marathon.
    </p>
  </div>
</template>

<style scoped>
.settings {
  padding: 12px;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  cursor: pointer;
}

.toggle input {
  accent-color: var(--accent);
}

.danger {
  margin-top: 12px;
  width: 100%;
  border-color: #6b2f2c;
  color: #ffb4ae;
  background: #2a1a19;
}

.danger:hover {
  background: #3a2220;
}
</style>
