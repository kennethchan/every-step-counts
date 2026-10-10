<script setup>
/**
 * GameView — the split-panel layout.
 *
 *   LEFT  (stage)   : runner scene, live progress / race course, vitals, ticker
 *   RIGHT (console) : status strip, self-revealing tabs, panel content
 *
 * Components never mutate sim state; everything goes through the store.
 */
import { computed, ref, watch } from 'vue'
import { useGameStore } from '@/stores/game.js'
import { useSession } from '@/composables/useSession.js'
import { useRacePlayback } from '@/composables/useRacePlayback.js'
import { getSession } from '@/data/sessions.js'
import { gainMultiplier } from '@/sim/index.js'

import RunnerScene from '@/components/stage/RunnerScene.vue'
import ProgressBar from '@/components/stage/ProgressBar.vue'
import RaceCourse from '@/components/stage/RaceCourse.vue'
import VitalsPanel from '@/components/stage/VitalsPanel.vue'
import EventTicker from '@/components/stage/EventTicker.vue'
import StatusStrip from '@/components/console/StatusStrip.vue'
import TabNav from '@/components/console/TabNav.vue'
import TrainPanel from '@/components/console/panels/TrainPanel.vue'
import RacePanel from '@/components/console/panels/RacePanel.vue'
import ShopPanel from '@/components/console/panels/ShopPanel.vue'
import JournalPanel from '@/components/console/panels/JournalPanel.vue'
import SettingsPanel from '@/components/console/panels/SettingsPanel.vue'
import CelebrationBanner from '@/components/CelebrationBanner.vue'
import RaceResult from '@/components/RaceResult.vue'
import Confetti from '@/components/Confetti.vue'

const store = useGameStore()
const { running, progress, currentId, canSkip, start, skip } = useSession(store)
const playback = useRacePlayback()

const activeTab = ref('train')
const settingsOpen = ref(false)
const raceResultOpen = ref(false)
const showConfetti = ref(false)
const sessionFlash = ref(null)

/** Milestones that deserve a confetti burst. */
const BIG_MILESTONES = new Set([
  'first_1k',
  'first_race',
  'first_win',
  'first_half',
  'first_marathon',
  'marathon_finish',
])

// --- pace + effort drive the sprite and the parallax ------------------------
const pace = computed(() => {
  if (running.value) {
    const s = getSession(currentId.value)
    if (!s) return 0.3
    if (s.rest) return 0.05
    return 0.25 + (s.intensity / 5) * 0.65
  }
  if (playback.playing.value) return 0.95
  return 0.1 + (store.fitness / 100) * 0.3
})

const effort = computed(() => {
  if (running.value) {
    const s = getSession(currentId.value)
    return s ? s.intensity / 5 : 0.2
  }
  if (playback.playing.value) return 0.8
  return 0.12
})

const currentSessionName = computed(() => getSession(currentId.value)?.name ?? '')
const stageRunning = computed(() => running.value || playback.playing.value)

// --- session feedback ------------------------------------------------------
watch(
  () => store.lastSession,
  (ev) => {
    if (!ev) return
    sessionFlash.value = ev
    setTimeout(() => {
      if (sessionFlash.value === ev) sessionFlash.value = null
    }, 2200)
    store.clearLastSession()
  },
)

// --- celebrations ----------------------------------------------------------
watch(
  () => store.celebrations.length,
  (len, prev) => {
    if (len > (prev ?? 0)) {
      const ev = store.celebrations[len - 1]
      if (ev?.milestoneId && BIG_MILESTONES.has(ev.milestoneId)) showConfetti.value = true
    }
  },
)

// --- race playback ---------------------------------------------------------
watch(
  () => playback.done.value,
  (done) => {
    if (done && store.race) {
      raceResultOpen.value = true
      if (store.race.result.place === 1) showConfetti.value = true
    }
  },
)

function onStartSession(sessionId) {
  activeTab.value = 'train'
  start(sessionId)
}

function onRace(payload) {
  const staged = store.runRace(payload)
  if (!staged) return
  raceResultOpen.value = false
  playback.play(staged)
}

function closeRaceResult() {
  raceResultOpen.value = false
  playback.stop()
  store.clearRace()
}

function openSettings() {
  settingsOpen.value = true
  activeTab.value = 'settings'
}

function closeSettings() {
  settingsOpen.value = false
  activeTab.value = 'train'
}

function selectTab(id) {
  activeTab.value = id
  settingsOpen.value = false
}

function onReset() {
  if (window.confirm('Erase your save and start over from scratch?')) {
    store.hardReset()
    settingsOpen.value = false
    activeTab.value = 'train'
  }
}
</script>

<template>
  <div class="app">
    <!-- ---------------- STAGE (left) ---------------- -->
    <section class="stage">
      <RunnerScene
        :palette="store.location.palette"
        :pace="pace"
        :effort="effort"
        :running="stageRunning"
        :location-name="store.location.name"
      >
        <RaceCourse
          v-if="store.race"
          :race="store.race"
          :progress="playback.progress.value"
          :segment="playback.segment.value"
        />
        <ProgressBar
          v-else-if="running"
          :progress="progress"
          :title="currentSessionName"
          :subtitle="`${Math.round((1 - progress) * 100)}% to go`"
          show-skip
          :can-skip="canSkip"
          @skip="skip"
        />
      </RunnerScene>

      <div v-if="sessionFlash" class="flash">
        <span v-for="(v, k) in sessionFlash.gains" :key="k" class="gain">+{{ v }} {{ k }}</span>
        <span class="fatigue" :class="{ good: sessionFlash.fatigueDelta < 0 }">
          fatigue {{ sessionFlash.fatigueDelta > 0 ? '+' : '' }}{{ sessionFlash.fatigueDelta }}
        </span>
      </div>

      <VitalsPanel
        :vitals="store.vitals"
        :max-km="store.maxKm"
        :show-numbers="store.showPredictedTimes"
      />

      <EventTicker :events="store.events" />

      <Confetti v-if="showConfetti" @done="showConfetti = false" />
    </section>

    <!-- ---------------- CONSOLE (right) ---------------- -->
    <section class="console">
      <StatusStrip
        :day="store.day"
        :week="store.week"
        :money="store.money"
        :fatigue="store.fatigue"
        :show-precise-fatigue="store.showPreciseFatigue"
        :locations="store.locations"
        :location-id="store.state.location"
        @settings="openSettings"
        @location="store.setLocation"
      />

      <template v-if="!settingsOpen">
        <TabNav :tabs="store.tabs" :active="activeTab" @select="selectTab" />
      </template>
      <div v-else class="settings-head">
        <span>Settings</span>
        <span class="spacer" />
        <button class="ghost small" @click="closeSettings">Close ✕</button>
      </div>

      <div class="content">
        <p v-if="store.error" class="error small">⚠ {{ store.error }}</p>

        <SettingsPanel
          v-if="settingsOpen"
          :settings="store.settings"
          :day="store.day"
          :money="store.money"
          :sessions-completed="store.state.stats.sessionsCompleted"
          :races-completed="store.state.racesCompleted"
          @set-settings="store.setSettings"
          @reset="onReset"
        />

        <TrainPanel
          v-else-if="activeTab === 'train'"
          :sessions="store.sessions"
          :all-sessions="store.allSessions"
          :fatigue="store.fatigue"
          :running="running"
          :current-id="currentId"
          :show-coach="store.showCoach"
          :vitals="store.vitals"
          :fatigue-gain-multiplier="gainMultiplier(store.fatigue)"
          @start="onStartSession"
        />

        <RacePanel
          v-else-if="activeTab === 'race'"
          :distances="store.raceDistances"
          :tiers="store.tiers"
          :show-predicted-times="store.showPredictedTimes"
          :pbs="store.pbs"
          :results="store.raceResults"
          :predicted-for="store.predictedFor"
          :fatigue="store.fatigue"
          @race="onRace"
        />

        <ShopPanel
          v-else-if="activeTab === 'shop'"
          :gear="store.gear"
          :owned="store.state.ownedGear"
          :locked-count="store.lockedGearCount"
          :money="store.money"
          @buy="store.buyGear"
        />

        <JournalPanel
          v-else-if="activeTab === 'journal'"
          :pbs="store.pbs"
          :milestones="store.milestones"
          :results="store.raceResults"
          :vitals-history="store.vitalsHistory"
          :distances="store.raceDistances"
        />
      </div>
    </section>

    <CelebrationBanner
      v-if="store.celebrations.length"
      :event="store.celebrations[0]"
      @done="store.nextCelebration()"
    />

    <RaceResult v-if="raceResultOpen && store.race" :race="store.race" @close="closeRaceResult" />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ---- stage ---- */
.stage {
  position: relative;
  width: var(--stage);
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--bg);
}

.flash {
  position: absolute;
  left: 12px;
  top: 12px;
  z-index: 40;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(6, 8, 12, 0.8);
  border: 2px solid var(--line);
  border-radius: var(--radius);
  animation: floatup 2.2s ease-out forwards;
  pointer-events: none;
}

.flash .gain {
  color: var(--good);
}

.flash .fatigue {
  color: var(--accent);
}

@keyframes floatup {
  0% {
    opacity: 0;
    transform: translateY(6px);
  }
  15% {
    opacity: 1;
    transform: none;
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-10px);
  }
}

/* ---- console ---- */
.console {
  width: calc(100% - var(--stage));
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-left: 2px solid var(--line);
  background: var(--panel-2);
}

.settings-head {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: var(--panel-2);
  border-bottom: 2px solid var(--line);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}

.content {
  flex: 1;
  overflow-y: auto;
  background: var(--panel-2);
}

.error {
  margin: 10px 12px 0;
  padding: 6px 10px;
  border: 2px solid #6b2f2c;
  border-radius: var(--radius);
  background: #2a1a19;
  color: #ffb4ae;
}
</style>
