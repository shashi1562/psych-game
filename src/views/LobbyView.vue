<template>
  <div class="min-h-screen flex flex-col max-w-lg mx-auto px-4 pt-6 pb-8 safe-bottom">

    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <button class="text-white/40 hover:text-white transition text-sm font-semibold" @click="leave">← Home</button>
      <div class="text-center">
        <p class="font-black text-lg">{{ room?.name }}</p>
        <p class="text-purple-400 font-mono tracking-[0.28em] text-sm font-bold">{{ room?.code }}</p>
      </div>
      <button class="text-sm font-bold px-3 py-1.5 rounded-xl transition"
        style="background:rgba(147,51,234,0.15);border:1px solid rgba(147,51,234,0.35);color:#c084fc"
        @click="copy">{{ copied ? '✓ Copied' : '📋 Share' }}</button>
    </div>

    <!-- Players -->
    <div class="flex flex-col gap-2.5 mb-5">
      <TransitionGroup name="list">
        <div v-for="p in players" :key="p.id"
          class="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all"
          :style="playerStyle(p)"
        >
          <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            :style="`background:${p.color}18;border:1.5px solid ${p.color}40`">
            {{ p.avatar }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-bold text-sm truncate">{{ p.name }}</p>
              <span v-if="p.uid===myUid" class="chip text-[10px]">you</span>
              <span v-if="p.isBot" class="chip text-[10px]" style="color:#06b6d4;border-color:rgba(6,182,212,0.35)">bot</span>
            </div>
            <p v-if="p.isConnected===false" class="text-red-400/60 text-xs mt-0.5">disconnected</p>
            <p v-else-if="p.isBot" class="text-cyan-400/50 text-xs mt-0.5">AI bluffer</p>
            <p v-else class="text-green-400/50 text-xs mt-0.5">● online</p>
          </div>
          <div class="flex items-center gap-2">
            <span v-if="p.isHost && !p.isBot" class="text-yellow-400">👑</span>
            <!-- Host can remove bot -->
            <button v-if="isHost && p.isBot"
              class="w-7 h-7 rounded-xl flex items-center justify-center text-white/25 hover:text-red-400 hover:bg-red-400/10 transition"
              @click="removeBot(p.id)">✕</button>
          </div>
        </div>
      </TransitionGroup>

      <!-- Waiting slot -->
      <div class="flex items-center gap-4 px-4 py-3 rounded-2xl"
        style="background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.08)">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-white/15 text-xl flex-shrink-0"
          style="background:rgba(255,255,255,0.03)">+</div>
        <p class="text-white/20 text-sm">Waiting for players…</p>
      </div>
    </div>

    <!-- Add Meloni bot -->
    <div v-if="isHost && !hasMeloni" class="mb-5">
      <button class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
        style="background:rgba(6,182,212,0.07);border:1px dashed rgba(6,182,212,0.3);color:rgba(6,182,212,0.8)"
        @click="addMeloni">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style="background:rgba(6,182,212,0.12);border:1px solid rgba(6,182,212,0.25)">🤖</div>
        <div class="flex-1 text-left">
          <p class="font-bold text-sm">Add Meloni</p>
          <p class="text-xs opacity-60">AI bot · writes bluffs · votes randomly</p>
        </div>
        <span class="text-lg opacity-60">+</span>
      </button>
    </div>

    <!-- Settings summary -->
    <div class="grid grid-cols-3 gap-2 mb-8">
      <div v-for="s in settingsSummary" :key="s.label"
        class="flex flex-col items-center gap-1 py-3 rounded-2xl"
        style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07)">
        <span class="text-xl font-black text-gradient">{{ s.value }}</span>
        <span class="text-white/30 text-[10px] uppercase tracking-wider font-bold">{{ s.label }}</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-auto flex flex-col gap-3">
      <button v-if="isHost" class="btn-primary w-full py-4 text-lg"
        :disabled="players.length < 2 || gameStore.loading" @click="start">
        <span v-if="gameStore.loading" class="flex items-center justify-center gap-2">
          <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>Starting…
        </span>
        <span v-else>🎭 Start Psych!</span>
      </button>
      <p v-if="isHost && players.length < 2" class="text-center text-white/28 text-xs">
        Need at least 2 players — or add Meloni 🤖
      </p>

      <div v-if="!isHost" class="flex flex-col items-center gap-3 py-5">
        <div class="flex gap-1.5">
          <span v-for="i in 3" :key="i" class="w-2 h-2 rounded-full bg-purple-500"
            :style="`animation:dotPulse 1.2s ease-in-out ${(i-1)*0.18}s infinite`"/>
        </div>
        <p class="text-white/35 text-sm">Waiting for host to start…</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, watch, inject, ref } from 'vue'
import { useRoute, useRouter }  from 'vue-router'
import { useAuthStore }         from '@/stores/auth.js'
import { useGameStore }         from '@/stores/game.js'
import { sounds }               from '@/utils/sounds.js'
import { MELONI }               from '@/utils/aiPlayers.js'

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
const hasMeloni = computed(() => players.value.some(p => p.id === 'bot_meloni'))

const settingsSummary = computed(() => [
  { label: 'Rounds',  value: room.value?.settings?.rounds     || '—' },
  { label: 'Write',   value: `${room.value?.settings?.writingTime || '—'}s` },
  { label: 'Vote',    value: `${room.value?.settings?.votingTime  || '—'}s` },
])

function playerStyle(p) {
  if (p.uid === myUid.value) return 'background:rgba(147,51,234,0.1);border:1px solid rgba(147,51,234,0.35)'
  if (p.isConnected === false) return 'background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);opacity:0.55'
  if (p.isBot) return 'background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.2)'
  return 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08)'
}

onMounted(async () => {
  if (!authStore.user) await authStore.init()
  gameStore.myUid = myUid.value
  gameStore.subscribe(roomId)
  gameStore.startHeartbeat(roomId, myUid.value)
})

// If game already started (rejoining), redirect immediately
watch(() => room.value?.status, s => {
  if (!s || s === 'lobby') return
  if (s === 'final_results') { router.push({ name:'results', params:{roomId} }); return }
  sounds.start()
  router.push({ name:'game', params:{roomId} })
}, { immediate: true })

onBeforeUnmount(() => {
  gameStore.stopHeartbeat()
})

async function start() {
  try { await gameStore.startRound(roomId) }
  catch(e) { showToast(e.message, 'error') }
}
async function addMeloni() {
  try { await gameStore.addMeloni(roomId) }
  catch(e) { showToast(e.message, 'error') }
}
async function removeBot(id) {
  await gameStore.removeBot(roomId, id)
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
