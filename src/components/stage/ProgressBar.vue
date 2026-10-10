<script setup>
defineProps({
  progress: { type: Number, default: 0 },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  canSkip: { type: Boolean, default: false },
  showSkip: { type: Boolean, default: false },
})

defineEmits(['skip'])
</script>

<template>
  <div class="bar-wrap">
    <div class="label-row">
      <span class="title">{{ title }}</span>
      <span class="spacer" />
      <span class="small muted">{{ subtitle }}</span>
    </div>
    <div class="bar">
      <span :style="{ width: `${Math.round(progress * 100)}%` }" />
    </div>
    <div v-if="showSkip" class="skip-row">
      <button
        class="ghost small"
        :disabled="!canSkip"
        v-tooltip="
          canSkip
            ? 'Jump straight to the result of this session.'
            : 'Skipping unlocks once you have done this session a few times — or turn on fast mode in settings.'
        "
        @click="$emit('skip')"
      >
        {{ canSkip ? 'Skip ⏩' : 'Skip (do it a few times first)' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.bar-wrap {
  padding: 8px 10px 10px;
  background: linear-gradient(180deg, rgba(13, 15, 20, 0.55), rgba(13, 15, 20, 0.92));
  backdrop-filter: blur(2px);
}

.label-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.title {
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.bar {
  height: 14px;
}

.skip-row {
  margin-top: 6px;
  text-align: right;
}

.skip-row button {
  padding: 3px 8px;
}
</style>
