<script setup>
/**
 * Milestone celebration banner. Pops for a few seconds then reports done.
 */
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  event: { type: Object, required: true },
})

const emit = defineEmits(['done'])

let timer = null
onMounted(() => {
  timer = setTimeout(() => emit('done'), 3600)
})
onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <div class="celebration">
    <div class="burst">★</div>
    <div class="text">
      <div class="title">{{ event.text }}</div>
      <div class="small sub">New milestone — day {{ event.day }}</div>
    </div>
  </div>
</template>

<style scoped>
.celebration {
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: linear-gradient(180deg, #2b2415, #1d1a11);
  border: 2px solid var(--gold);
  border-radius: var(--radius);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  animation: pop 0.28s ease-out, fade 0.5s ease-in 3.1s forwards;
}

.burst {
  font-size: 22px;
  color: var(--gold);
}

.title {
  font-weight: 700;
  color: var(--gold);
}

.sub {
  color: var(--muted);
}

@keyframes pop {
  from {
    transform: translateY(-12px) scale(0.96);
    opacity: 0;
  }
  to {
    transform: none;
    opacity: 1;
  }
}

@keyframes fade {
  to {
    opacity: 0;
    transform: translateY(-8px);
  }
}
</style>
