<template>
  <div class="min-h-screen flex flex-col max-w-lg mx-auto px-4 pt-6 pb-8 safe-bottom">

    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <button class="text-white/40 hover:text-white transition text-sm font-semibold flex items-center gap-1" @click="leave">
        ← Home
      </button>
      <div class="text-center">
        <p class="font-black text-lg">{{ room?.name }}</p>
        <p class="text-purple-400 font-mono tracking-[0.28em] text-sm font-bold">{{ room?.code }}</p>
      </div>
      <button class="text-sm font-bold px-3 py-1.5 rounded-xl transition"
        style="background:rgba(147,51,234,0.15);border:1px solid rgba(147,51,234,0.35);color:#c084fc"
        @click="copy">
        {{ copied ? '✓ Copied' : '📋 Share' }}
      </button>
    </div>

    <!-- Players -->
    <div class="flex flex-col gap-2.5 mb-6">
      <TransitionGroup name="list">
        <PlayerRow
          v-for="p in players" :key="p.id"
          :player="p" :is-me="p.uid===myUid"
        />
      </TransitionGroup>

      <!-- Waiting slot -->
      <div class="flex items-center gap-4 px-4 py-3 rounded-2xl"
        style="background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.08)">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-white/15 text-xl flex-shrink-0"
          style="background:rgba(255,255,255,0.03)">+</div>
        <p class="text-white/22 text-sm">Waiting for players to join…</p>
      </div>
    </div>

    <!-- Settings row -->
    <div class="grid grid-cols-3 gap-2 mb-8">
      <div v-for="s in settingsSummary" :key="s.label"
        class="flex flex-col items-center gap-1 py-3 rounded-2xl"
        style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07)">
        <span class="text-xl font-black text-gradient">{{ s.value }}</span>
        <span class="text-white/30 text-[10px] uppercase tracking-wider font-bold">{{ s.label }}</span>
      </div>
    </div>

    <!-- Action area -->
    <div class="mt-auto flex flex-col gap-3">
      <button v-if="isHost" class="btn-primary w-full py-4 text-lg"
        :disabled="players.length < 2 || gameStore.loading" @click="start">
        <span v-if="gameStore.loading" class="flex items-center justify-center gap-2">
          <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg> Starting…
        </span>
        <span v-else>🎭 Start Psych!</span>
      </button>
      <p v-if="isHost && players.length < 2" class="text-center text-white/28 text-xs">
        Need at least 2 players to start
      </p>

      <div v-if="!isHost" class="flex flex-col items-center gap-3 py-5">
        <div class="flex gap-1.5">
          <span v-for="i in 3" :key="i"
            class="w-2 h-2 rounded-full bg-purple-500"
            :style="`animation:dotPulse 1.2s ease-in-out ${(i-1)*0.18}s infinite`"/>
        </div>
        <p class="text-white/35 text-sm">Waiting for host to start…</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch, inject, ref } from 'vue'
import { useRoute, useRouter }  from 'vue-router'
import { useAuthStore }         from '@/stores/auth.js'
import { useGameStore }         from '@/stores/game.js'
import { sounds }               from '@/utils/sounds.js'
import PlayerRow                from '@/components/PlayerRow.vue'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()
const gameStore = useGameStore()
const showToast = inject('showToast')
const roomId    = route.params.roomId
const copied    = ref(false)

const myUid  = computed(() => authStore.user?.uid)
const room   = computed(() => gameStore.room)
const players= computed(() => gameStore.players)
const isHost = computed(() => room.value?.hostId === myUid.value)

const settingsSummary = computed(() => [
  { label: 'Rounds',   value: room.value?.settings?.rounds    || '—' },
  { label: 'Write',    value: `${room.value?.settings?.writingTime || '—'}s` },
  { label: 'Vote',     value: `${room.value?.settings?.votingTime  || '—'}s` },
])

onMounted(async () => {
  if (!authStore.user) await authStore.init()
  gameStore.myUid = myUid.value
  gameStore.subscribe(roomId)
})

watch(() => room.value?.status, s => {
  if (s === 'writing') { sounds.start(); router.push({ name:'game', params:{roomId} }) }
})

async function start() {
  try { await gameStore.startRound(roomId) }
  catch(e) { showToast(e.message, 'error') }
}

function leave() { gameStore.unsubscribe(); router.push({ name:'home' }) }

async function copy() {
  await navigator.clipboard.writeText(`${location.origin}/lobby/${roomId}`).catch(() => {})
  copied.value = true; setTimeout(() => copied.value = false, 2000)
  showToast('Room link copied!', 'info')
}
</script>

<style scoped>
@keyframes dotPulse { 0%,100%{opacity:0.2;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
</style>
