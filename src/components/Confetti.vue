<script setup>
/**
 * Confetti burst over the stage for the big moments (first race, first win,
 * marathon finish).
 */
import { computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  count: { type: Number, default: 60 },
})

const emit = defineEmits(['done'])

const COLORS = ['#ffd166', '#ef476f', '#06d6a0', '#118ab2', '#f78c6b', '#b39ddb']

const pieces = computed(() =>
  Array.from({ length: props.count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 1.6 + Math.random() * 1.2,
    color: COLORS[i % COLORS.length],
    size: 5 + Math.random() * 6,
    rotate: Math.random() * 360,
  })),
)

let timer = null
onMounted(() => {
  timer = setTimeout(() => emit('done'), 2600)
})
onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <div class="confetti">
    <span
      v-for="p in pieces"
      :key="p.id"
      class="piece"
      :style="{
        left: `${p.left}%`,
        width: `${p.size}px`,
        height: `${p.size}px`,
        background: p.color,
        animationDelay: `${p.delay}s`,
        animationDuration: `${p.duration}s`,
        transform: `rotate(${p.rotate}deg)`,
      }"
    />
  </div>
</template>

<style scoped>
.confetti {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 60;
}

.piece {
  position: absolute;
  top: -12px;
  border-radius: 1px;
  animation-name: fall;
  animation-timing-function: ease-in;
  animation-fill-mode: forwards;
}

@keyframes fall {
  to {
    transform: translateY(360px) rotate(540deg);
    opacity: 0.2;
  }
}
</style>
