<script setup>
/**
 * A single parallax layer. Scrolls a repeating CSS background horizontally; the
 * scroll speed scales with the runner's current pace, so a fitter runner moves
 * through a faster world.
 */
import { computed } from 'vue'

const props = defineProps({
  image: { type: String, required: true },
  size: { type: String, default: 'auto' },
  /** relative scroll speed (1 = baseline) */
  speed: { type: Number, default: 1 },
  /** 0..1 current pace factor */
  pace: { type: Number, default: 0 },
  /** pixels travelled per animation cycle (a multiple of the tile width) */
  loop: { type: Number, default: 400 },
  top: { type: String, default: '0' },
  height: { type: String, default: '100%' },
  z: { type: Number, default: 0 },
  repeat: { type: String, default: 'repeat-x' },
})

const duration = computed(() => {
  const factor = 0.35 + props.pace * 1.65
  const pxPerSec = 200 * props.speed * factor
  return `${Math.max(300, (props.loop / pxPerSec) * 1000)}ms`
})

const style = computed(() => ({
  backgroundImage: props.image,
  backgroundSize: props.size,
  backgroundRepeat: props.repeat,
  backgroundPosition: '0 bottom',
  top: props.top,
  height: props.height,
  zIndex: props.z,
  '--loop': `-${props.loop}px`,
  animationDuration: duration.value,
}))
</script>

<template>
  <div class="parallax" :style="style" />
</template>

<style scoped>
.parallax {
  position: absolute;
  left: 0;
  right: 0;
  animation-name: scroll-x;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: background-position;
}

@keyframes scroll-x {
  from {
    background-position-x: 0;
  }
  to {
    background-position-x: var(--loop);
  }
}
</style>
