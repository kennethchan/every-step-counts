<script setup>
/**
 * The stage: layered parallax background + the runner. Renders whatever overlay
 * the current mode needs via the default slot (a training progress bar, or the
 * race course).
 */
import { computed } from 'vue'
import ParallaxLayer from './ParallaxLayer.vue'
import RunnerSprite from './RunnerSprite.vue'

const props = defineProps({
  palette: { type: Object, required: true },
  /** 0..1 current pace factor — drives scroll speed + stride. */
  pace: { type: Number, default: 0.15 },
  effort: { type: Number, default: 0 },
  running: { type: Boolean, default: true },
  locationName: { type: String, default: '' },
})

/** Build parallax layers from the location palette. */
const layers = computed(() => {
  const p = props.palette
  return [
    {
      image: `linear-gradient(180deg, ${p.sky} 0%, #eef3f7 78%, ${p.far} 100%)`,
      size: '100% 100%',
      repeat: 'no-repeat',
      speed: 0,
      top: '0',
      height: '100%',
      z: 0,
    },
    {
      // distant rolling hills
      image: `radial-gradient(ellipse 120px 60px at 60px 100%, ${p.far} 0 60px, transparent 61px)`,
      size: '150px 100%',
      speed: 0.18,
      loop: 600,
      top: '40%',
      height: '42%',
      z: 1,
    },
    {
      // mid-ground: tree canopies / buildings
      image: `radial-gradient(circle at 28px 100%, ${p.mid} 0 28px, transparent 29px)`,
      size: '104px 100%',
      speed: 0.42,
      loop: 520,
      top: '56%',
      height: '26%',
      z: 2,
    },
    {
      // near bushes
      image: `radial-gradient(circle at 22px 100%, ${p.near} 0 24px, transparent 25px)`,
      size: '84px 100%',
      speed: 0.85,
      loop: 420,
      top: '66%',
      height: '22%',
      z: 3,
    },
    {
      // ground band with subtle scrolling texture
      image: `repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.14) 0 7px, transparent 7px 58px), linear-gradient(180deg, ${p.ground}, #5a4d3d)`,
      size: '58px 100%, 100% 100%',
      speed: 1.3,
      loop: 232,
      top: '84%',
      height: '16%',
      z: 4,
    },
  ]
})
</script>

<template>
  <div class="scene">
    <ParallaxLayer
      v-for="(layer, i) in layers"
      :key="i"
      :image="layer.image"
      :size="layer.size"
      :repeat="layer.repeat || 'repeat-x'"
      :speed="layer.speed"
      :loop="layer.loop"
      :pace="pace"
      :top="layer.top"
      :height="layer.height"
      :z="layer.z"
    />

    <div class="runner-anchor">
      <RunnerSprite :pace="pace" :effort="effort" :running="running" />
    </div>

    <div class="overlay">
      <slot />
    </div>

    <div class="location-tag">{{ locationName }}</div>
  </div>
</template>

<style scoped>
.scene {
  position: relative;
  flex: 1;
  min-height: 220px;
  overflow: hidden;
  border-bottom: 2px solid var(--line);
  background: #0d0f14;
}

.runner-anchor {
  position: absolute;
  left: 22%;
  bottom: 15%;
  z-index: 10;
  /* No CSS bob here — the sprite rig animates its own vertical bounce, and a
     second one on the anchor would fight it. */
}

.overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
}

.location-tag {
  position: absolute;
  top: 8px;
  left: 10px;
  z-index: 20;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.55);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.25);
  pointer-events: none;
}
</style>
