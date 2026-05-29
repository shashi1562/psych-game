<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-5 py-12 relative overflow-hidden">
    <canvas ref="confettiEl" class="fixed inset-0 pointer-events-none z-50"/>

    <div class="w-full max-w-md" style="animation:slideUp 0.55s cubic-bezier(0.34,1.2,0.64,1) both">

      <!-- Title -->
      <div class="text-center mb-10">
        <div class="text-8xl mb-4 animate-float inline-block">🏆</div>
        <h1 class="text-5xl font-black text-gradient mb-2">Final Psych!</h1>
        <p class="text-white/35">{{ room?.totalRounds }} rounds · game over</p>
      </div>

      <!-- Podium -->
      <div class="flex items-end justify-center gap-3 mb-8" style="height:155px">
        <!-- 2nd -->
        <div v-if="top[1]" class="flex flex-col items-center gap-1.5 flex-1" style="animation:slideUp 0.5s 0.15s both">
          <span class="text-4xl">{{ top[1].avatar }}</span>
          <p class="text-xs font-bold text-white/55 text-center truncate px-1 w-full">{{ top[1].name }}</p>
          <div class="w-full rounded-t-2xl flex flex-col items-center justify-start pt-2.5"
            style="height:78px;background:linear-gradient(to bottom,rgba(148,163,184,0.14),rgba(148,163,184,0.04));border:1px solid rgba(148,163,184,0.18);border-bottom:none">
            <span class="text-2xl font-black text-slate-400">2</span>
            <span class="text-[10px] font-mono text-white/30 mt-1">{{ top[1].score }}</span>
          </div>
        </div>
        <!-- 1st -->
        <div v-if="top[0]" class="flex flex-col items-center gap-1.5 flex-1" style="animation:slideUp 0.5s 0.05s both">
          <span class="text-5xl" style="animation:float 3s ease-in-out infinite">{{ top[0].avatar }}</span>
          <p class="text-sm font-black text-yellow-300 text-center truncate px-1 w-full">{{ top[0].name }}</p>
          <div class="w-full rounded-t-2xl flex flex-col items-center justify-start pt-2.5"
            style="height:112px;background:linear-gradient(to bottom,rgba(234,179,8,0.18),rgba(234,179,8,0.04));border:1px solid rgba(234,179,8,0.32);border-bottom:none;box-shadow:0 -6px 28px rgba(234,179,8,0.12)">
            <span class="text-2xl">👑</span>
            <span class="text-[10px] font-mono text-yellow-300/50 mt-1">{{ top[0].score }}</span>
          </div>
        </div>
        <!-- 3rd -->
        <div v-if="top[2]" class="flex flex-col items-center gap-1.5 flex-1" style="animation:slideUp 0.5s 0.25s both">
          <span class="text-4xl">{{ top[2].avatar }}</span>
          <p class="text-xs font-bold text-white/45 text-center truncate px-1 w-full">{{ top[2].name }}</p>
          <div class="w-full rounded-t-2xl flex flex-col items-center justify-start pt-2.5"
            style="height:52px;background:linear-gradient(to bottom,rgba(251,146,60,0.12),rgba(251,146,60,0.03));border:1px solid rgba(251,146,60,0.18);border-bottom:none">
            <span class="text-lg font-black text-orange-400/55">3</span>
          </div>
        </div>
      </div>

      <!-- Full scoreboard -->
      <div class="card mb-6" style="animation:slideUp 0.5s 0.3s both">
        <p class="text-white/28 text-[10px] uppercase tracking-[0.14em] mb-4">All Players</p>
        <div class="flex flex-col gap-2">
          <div v-for="(p, i) in sortedPlayers" :key="p.id"
            class="flex items-center gap-3 px-3 py-3 rounded-xl transition"
            :style="p.uid===myUid?'background:rgba(147,51,234,0.1);border:1px solid rgba(147,51,234,0.25)':'background:rgba(255,255,255,0.03)'">
            <span class="w-6 text-center text-sm">{{ i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1 }}</span>
            <span class="text-2xl">{{ p.avatar }}</span>
            <span class="flex-1 font-bold truncate">{{ p.name }}</span>
            <span class="font-black font-mono text-lg" :class="i===0?'text-yellow-300':'text-white/65'">
              {{ p.score || 0 }}
            </span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-col gap-3" style="animation:slideUp 0.5s 0.38s both">
        <button v-if="isHost" class="btn-primary w-full py-4 text-lg"
          :disabled="gameStore.loading" @click="again">
          {{ gameStore.loading ? 'Loading…' : '🔄 Play Again' }}
        </button>
        <button class="btn-ghost w-full py-3" @click="home">🏠 Back to Home</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter }      from 'vue-router'
import { useAuthStore }             from '@/stores/auth.js'
import { useGameStore }             from '@/stores/game.js'
import { sounds }                   from '@/utils/sounds.js'
import confetti                     from 'canvas-confetti'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()
const gameStore = useGameStore()
const roomId    = route.params.roomId
const confettiEl= ref(null)

const myUid         = computed(() => authStore.user?.uid)
const room          = computed(() => gameStore.room)
const sortedPlayers = computed(() => gameStore.sortedPlayers)
const isHost        = computed(() => room.value?.hostId === myUid.value)
const top           = computed(() => sortedPlayers.value.slice(0, 3))

onMounted(() => {
  if (!gameStore.room) gameStore.subscribe(roomId)
  setTimeout(() => {
    sounds.win()
    const fire = confetti.create(confettiEl.value, { resize:true, useWorker:true })
    fire({ particleCount:170, spread:95, origin:{y:0.38}, colors:['#a855f7','#ec4899','#3b82f6','#eab308','#22c55e','#f97316'] })
    setTimeout(() => fire({ particleCount:90, spread:65, origin:{y:0.62} }), 550)
  }, 380)
})

async function again() { await gameStore.resetToLobby(roomId); router.push({ name:'lobby', params:{roomId} }) }
function home()        { gameStore.unsubscribe(); router.push({ name:'home' }) }
</script>

<style scoped>
@keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
@keyframes slideUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
</style>
