<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-5 py-14 text-center">

    <!-- Hero -->
    <div class="mb-8" style="animation:slideUp 0.5s 0.05s both">
      <div class="text-8xl mb-5 animate-float inline-block">🎭</div>
      <h1 class="text-6xl sm:text-7xl font-black leading-none text-gradient mb-3">Psych!</h1>
      <p class="text-white/45 text-base max-w-[300px] mx-auto leading-relaxed">
        The bluffing party game.<br/>
        Write fake answers. Fool your friends.
      </p>
    </div>

    <!-- CTAs -->
    <div class="w-full max-w-[300px] flex flex-col gap-3 mb-8" style="animation:slideUp 0.5s 0.12s both">
      <button class="btn-primary text-lg py-4 w-full" @click="showCreate=true">🎮 Create Room</button>
      <button class="btn-ghost text-lg py-4 w-full" @click="showJoin=true">🔑 Join with Code</button>
    </div>

    <!-- How to play box -->
    <div class="w-full max-w-[340px] mb-8" style="animation:slideUp 0.5s 0.2s both">
      <HowToPlay/>
    </div>

    <!-- Recent rooms -->
    <div v-if="gameStore.history.length" class="w-full max-w-[300px]" style="animation:slideUp 0.5s 0.28s both">
      <p class="text-white/25 text-[10px] uppercase tracking-[0.14em] mb-2">Recent Rooms</p>
      <div class="flex flex-col gap-1.5">
        <div v-for="h in gameStore.history" :key="h.roomId"
          class="flex items-center gap-3 py-2.5 px-3 rounded-2xl cursor-pointer transition-all"
          style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07)"
          @mouseenter="e=>e.currentTarget.style.background='rgba(255,255,255,0.07)'"
          @mouseleave="e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'"
          @click="router.push({name:'lobby',params:{roomId:h.roomId}})"
        >
          <span class="text-xl">🎭</span>
          <div class="flex-1 text-left min-w-0">
            <p class="text-sm font-bold truncate">{{ h.name }}</p>
            <p class="text-white/28 text-xs">as {{ h.myName }}</p>
          </div>
          <span class="text-purple-400 text-xs font-bold">Rejoin ↩</span>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <BaseModal v-if="showCreate" title="Create Room" subtitle="Set up your Psych! game" @close="showCreate=false">
      <form class="flex flex-col gap-4" @submit.prevent="create">
        <div>
          <label class="field-label">Your Name</label>
          <input v-model="myName" class="input" placeholder="Enter your name" maxlength="20" required autofocus/>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="field-label">Rounds</label>
            <select v-model.number="rounds" class="input text-sm">
              <option :value="5">5 — Quick</option>
              <option :value="8">8 — Standard</option>
              <option :value="10">10 — Marathon</option>
            </select>
          </div>
          <div>
            <label class="field-label">Write Time</label>
            <select v-model.number="writingTime" class="input text-sm">
              <option :value="30">30s — Fast</option>
              <option :value="45">45s — Normal</option>
              <option :value="60">60s — Relaxed</option>
            </select>
          </div>
        </div>
        <p v-if="err" class="text-red-400 text-sm text-center">{{ err }}</p>
        <button type="submit" class="btn-primary py-4 w-full" :disabled="busy">
          <Spinner v-if="busy" text="Creating…"/>
          <span v-else>🚀 Create & Play</span>
        </button>
      </form>
    </BaseModal>

    <BaseModal v-if="showJoin" title="Join Room" subtitle="Enter the code your friend shared" @close="showJoin=false">
      <form class="flex flex-col gap-4" @submit.prevent="join">
        <div>
          <label class="field-label">Your Name</label>
          <input v-model="myName" class="input" placeholder="Enter your name" maxlength="20" required/>
        </div>
        <div>
          <label class="field-label">Room Code</label>
          <input v-model="roomCode"
            class="input font-mono uppercase text-center text-3xl tracking-[0.35em] py-4"
            placeholder="XXXXX" maxlength="5" required
            @input="roomCode=roomCode.toUpperCase()"/>
        </div>
        <p v-if="err" class="text-red-400 text-sm text-center">{{ err }}</p>
        <button type="submit" class="btn-primary py-4 w-full" :disabled="busy||roomCode.length<5">
          <Spinner v-if="busy" text="Joining…"/>
          <span v-else>🎮 Join Game</span>
        </button>
      </form>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref }          from 'vue'
import { useRouter }    from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useGameStore } from '@/stores/game.js'
import BaseModal        from '@/components/BaseModal.vue'
import HowToPlay        from '@/components/HowToPlay.vue'

// Inline micro-component — only used here
const Spinner = { props:['text'], template:`<span class="flex items-center gap-2"><svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>{{ text }}</span>` }

const router    = useRouter()
const authStore = useAuthStore()
const gameStore = useGameStore()

const showCreate  = ref(false)
const showJoin    = ref(false)
const myName      = ref(localStorage.getItem('psych_name') || '')
const roomCode    = ref('')
const rounds      = ref(8)
const writingTime = ref(45)
const busy        = ref(false)
const err         = ref(null)

async function create() {
  busy.value=true; err.value=null
  try {
    if (!authStore.user) await authStore.init()
    localStorage.setItem('psych_name', myName.value.trim())
    const id = await gameStore.createRoom({ myName:myName.value.trim(), uid:authStore.user.uid, settings:{rounds:rounds.value,writingTime:writingTime.value,votingTime:25} })
    router.push({ name:'lobby', params:{roomId:id} })
  } catch(e) { err.value=e.message } finally { busy.value=false }
}
async function join() {
  busy.value=true; err.value=null
  try {
    if (!authStore.user) await authStore.init()
    localStorage.setItem('psych_name', myName.value.trim())
    const { roomId, status } = await gameStore.joinRoom({ code:roomCode.value, myName:myName.value.trim(), uid:authStore.user.uid })
    // If game already in progress, go straight to game view
    const dest = (status && status !== 'lobby' && status !== 'final_results') ? 'game' : 'lobby'
    router.push({ name: dest, params:{ roomId } })
  } catch(e) { err.value=e.message } finally { busy.value=false }
}
</script>

<style>
.field-label { display:block; font-size:0.68rem; font-weight:800; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.35); margin-bottom:6px; }
</style>
