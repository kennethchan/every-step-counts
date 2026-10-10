<script setup>
/**
 * Runner — an inline-SVG limb rig, styled after the flat-vector running sprite
 * reference (brown hair, black singlet, teal shorts, tan skin, dark shoes with
 * teal soles, seen in profile facing the direction of travel).
 *
 * Rather than a raster sprite sheet the figure is a bone rig: each limb is a
 * two-segment chain — thigh -> shin (knee) and upper arm -> forearm (elbow) —
 * whose joints sit on the child's transform origin, so rotations compose like a
 * real skeleton. Eight authored poses are stepped through sprite-sheet style,
 * with the far-side limbs half a cycle out of phase. That counter-phase is what
 * makes a run cycle read correctly instead of looking like flapping sticks.
 *
 * To swap in the actual PNG later: replace this component with a div using
 * `background-position` steps. The pace-driven frame timing below stays valid.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  /** 0..1 — higher is faster, which shortens the stride cycle. */
  pace: { type: Number, default: 0.2 },
  /** 0..1 — harder efforts lean the torso further forward. */
  effort: { type: Number, default: 0 },
  running: { type: Boolean, default: true },
})

/** Stride period in ms: faster pace = quicker turnover. */
const strideMs = computed(() => Math.round(560 - props.pace * 360))

/** While idle the runner still jogs, just far more gently. */
const IDLE_SLOWDOWN = 2.7
const effectiveStride = computed(() => strideMs.value * (props.running ? 1 : IDLE_SLOWDOWN))

/**
 * One full run cycle, eight poses. Angles are degrees with FORWARD swing
 * positive; the template negates them for SVG, where a positive rotation swings
 * a downward limb backwards. `knee`/`elbow` are always positive bends; `bob` is
 * the vertical body offset (positive = lower).
 */
const CYCLE = [
  { thigh: 27, knee: 10, arm: -30, elbow: 74, bob: 1.6 }, // 0 contact
  { thigh: 13, knee: 33, arm: -19, elbow: 72, bob: 0.4 }, // 1 absorb
  { thigh: 0, knee: 29, arm: -5, elbow: 78, bob: -1.6 }, // 2 mid-stance
  { thigh: -16, knee: 11, arm: 12, elbow: 82, bob: 0 }, // 3 push
  { thigh: -29, knee: 33, arm: 27, elbow: 78, bob: 1.6 }, // 4 toe-off
  { thigh: -17, knee: 90, arm: 17, elbow: 74, bob: 0.4 }, // 5 flight, heel up
  { thigh: 4, knee: 95, arm: -4, elbow: 72, bob: -1.6 }, // 6 swing through
  { thigh: 19, knee: 48, arm: -21, elbow: 76, bob: 0 }, // 7 reach
]
const FRAMES = CYCLE.length
const HALF = FRAMES / 2

/** Joint anchors, shared by both sides so the profile overlaps cleanly. */
const HIP = { x: 50, y: 76 }
const SHOULDER = { x: 50, y: 47 }
const THIGH = 21
const SHIN = 21

const frame = ref(0)

/** Current pose: near-side limbs at the frame, far-side limbs half a cycle on. */
const front = computed(() => CYCLE[frame.value])
const back = computed(() => CYCLE[(frame.value + HALF) % FRAMES])

const lean = computed(() => 5 + props.effort * 11)
const bodyY = computed(() => front.value.bob * (0.5 + props.pace * 0.9))

/** Whole-body transform: a little vertical bob, then a forward lean at the feet. */
const bodyTransform = computed(
  () => `translate(0 ${bodyY.value.toFixed(2)}) rotate(${lean.value.toFixed(1)} 50 118)`,
)

let raf = null
let last = 0
let acc = 0

function tick(now) {
  const dt = last ? Math.min(120, now - last) : 16
  last = now
  acc += dt
  const per = effectiveStride.value / FRAMES
  while (acc >= per) {
    acc -= per
    frame.value = (frame.value + 1) % FRAMES
  }
  raf = requestAnimationFrame(tick)
}

onMounted(() => {
  raf = requestAnimationFrame(tick)
})
onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <svg class="runner" viewBox="0 0 104 130" aria-hidden="true">
    <g :transform="bodyTransform">
      <!-- ================= FAR SIDE (behind) ================= -->
      <g class="far">
        <!-- far arm -->
        <g :transform="`translate(${SHOULDER.x} ${SHOULDER.y}) rotate(${-back.arm})`">
          <line class="upper-arm" x1="0" y1="0" x2="0" y2="14" />
          <g :transform="`translate(0 13) rotate(${-back.elbow})`">
            <line class="forearm" x1="0" y1="0" x2="0" y2="14" />
            <circle class="hand" cx="0" cy="15" r="3.3" />
          </g>
        </g>

        <!-- far leg -->
        <g :transform="`translate(${HIP.x} ${HIP.y}) rotate(${-back.thigh})`">
          <line class="thigh" x1="0" y1="0" x2="0" y2="21" />
          <g :transform="`translate(0 20) rotate(${back.knee})`">
            <line class="shin" x1="0" y1="0" x2="0" y2="21" />
            <g transform="translate(0 21)">
              <rect class="shoe" x="-3.6" y="-1" width="15.4" height="7.7" rx="3.8" />
              <rect class="sole" x="-3.6" y="4.5" width="15.4" height="2.6" rx="1.3" />
            </g>
          </g>
        </g>
      </g>

      <!-- ================= BODY ================= -->
      <line class="neck" x1="52" y1="44" x2="56" y2="35" />
      <path
        class="singlet"
        d="M46.5 42 h7.5 a4.2 4.2 0 0 1 4.2 4.3 l-1 24.2 a3.5 3.5 0 0 1 -3.5 3.4 h-6.4 a3.5 3.5 0 0 1 -3.5 -3.4 l-1 -24.2 A4.2 4.2 0 0 1 46.5 42 z"
      />

      <!-- ================= NEAR SIDE (front) ================= -->
      <!-- near leg -->
      <g :transform="`translate(${HIP.x} ${HIP.y}) rotate(${-front.thigh})`">
        <line class="thigh" x1="0" y1="0" x2="0" y2="21" />
        <g :transform="`translate(0 20) rotate(${front.knee})`">
          <line class="shin" x1="0" y1="0" x2="0" y2="21" />
          <g transform="translate(0 21)">
            <rect class="shoe" x="-3.6" y="-1" width="15.9" height="7.9" rx="3.9" />
            <rect class="sole" x="-3.6" y="4.7" width="15.9" height="2.6" rx="1.3" />
          </g>
        </g>
      </g>

      <!-- shorts sit over the top of both thighs -->
      <path
        class="shorts"
        d="M43 64.5 a2.2 2.2 0 0 1 2.2 -2.2 h11.6 a2.2 2.2 0 0 1 2.2 2.2 l-1.4 12 a2.2 2.2 0 0 1 -2.2 2 h-1.4 a2.2 2.2 0 0 1 -2.1 -1.7 l-1.4 -5.3 -1.4 5.3 a2.2 2.2 0 0 1 -2.1 1.7 h-1.4 a2.2 2.2 0 0 1 -2.2 -2 z"
      />

      <!-- near arm -->
      <g :transform="`translate(${SHOULDER.x} ${SHOULDER.y}) rotate(${-front.arm})`">
        <line class="upper-arm" x1="0" y1="0" x2="0" y2="14" />
        <g :transform="`translate(0 13) rotate(${-front.elbow})`">
          <line class="forearm" x1="0" y1="0" x2="0" y2="14" />
          <circle class="hand" cx="0" cy="15" r="3.5" />
        </g>
      </g>

      <!-- ================= HEAD ================= -->
      <g>
        <ellipse class="face" cx="61.5" cy="30" rx="8.3" ry="9.5" />
        <circle class="ear" cx="57" cy="32.5" r="2.6" />
        <circle class="hair" cx="57" cy="26.5" r="10.6" />
        <path class="nose" d="M69.2 27.8 l2.8 2.3 -2.8 2.2 z" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.runner {
  --skin: #f0c193;
  --skin-dark: #dcae82;
  --hair: #7b4a24;
  --singlet: #1f1f1f;
  --shorts: #57c6d6;
  --shoe: #22303a;
  --sole: #57c6d6;

  display: block;
  width: 74px;
  height: 92px;
  overflow: visible;
}

.upper-arm,
.forearm,
.thigh,
.shin {
  stroke: var(--skin);
  stroke-linecap: round;
  fill: none;
}

.upper-arm {
  stroke-width: 7;
}
.forearm {
  stroke-width: 6.2;
}
.thigh {
  stroke-width: 10.5;
}
.shin {
  stroke-width: 8.6;
}

.neck {
  stroke: var(--skin-dark);
  stroke-width: 7.5;
  stroke-linecap: round;
}

.hand,
.face {
  fill: var(--skin);
}

.ear {
  fill: var(--skin-dark);
}

.nose {
  fill: var(--skin);
}

.shoe {
  fill: var(--shoe);
}

.sole {
  fill: var(--sole);
}

.singlet {
  fill: var(--singlet);
}

.shorts {
  fill: var(--shorts);
}

.hair {
  fill: var(--hair);
}

/* Far-side limbs sit slightly darker so the near side reads clearly. */
.far {
  filter: brightness(0.86);
}
</style>
