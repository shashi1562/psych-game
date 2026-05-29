<template>
  <div class="min-h-screen flex flex-col max-w-lg mx-auto px-4 pt-4 pb-6 safe-bottom">

    <!-- Top bar -->
    <div class="flex items-center justify-between mb-4">
      <!-- Progress pips -->
      <div class="flex items-center gap-2">
        <div class="flex gap-1">
          <div v-for="i in (room?.totalRounds||8)" :key="i"
            class="h-1.5 rounded-full transition-all duration-500"
            :style="`width:${i<=(room?.currentRound||0)?22:10}px;background:${i<=(room?.currentRound||0)?'#9333ea':'rgba(255,255,255,0.1)'}`"/>
        </div>
        <span class="text-white/35 text-xs font-mono">{{ room?.currentRound }}/{{ room?.totalRounds }}</span>
      </div>

      <!-- Phase label -->
      <div class="phase-badge" :style="phaseStyle">{{ phaseText }}</div>

      <!-- Timer -->
      <TimerRing :time="gameStore.timeLeft" :total="totalTime"/>
    </div>

    <!-- Question card -->
    <Transition name="page" mode="out-in">
      <div :key="room?.currentRound" class="question-drop mb-4 rounded-2xl p-5"
        style="background:linear-gradient(145deg,rgba(147,51,234,0.11),rgba(37,99,235,0.07));border:1px solid rgba(147,51,234,0.22);box-shadow:0 8px 32px rgba(147,51,234,0.1)">
        <span class="chip mb-3 inline-flex">{{ room?.question?.cat }}</span>
        <p class="text-xl sm:text-2xl font-black leading-snug text-white">{{ room?.question?.q }}</p>
      </div>
    </Transition>

    <!-- Phase panels -->
    <Transition name="page" mode="out-in">

      <!-- ── WRITING ── -->
      <div v-if="room?.status==='writing'" key="writing" class="flex flex-col gap-4 flex-1">

        <div v-if="gameStore.iHaveSubmitted"
          class="flex flex-col items-center gap-3 py-8 rounded-2xl"
          style="background:rgba(34,197,94,0.07);border:1px solid rgba(34,197,94,0.18)">
          <div class="text-5xl animate-float">✅</div>
          <p class="font-black text-green-400 text-lg">Bluff locked in!</p>
          <p class="text-white/35 text-sm">Waiting for the others…</p>
        </div>

        <div v-else class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-bold text-white/60">Write a <span class="text-purple-400">convincing fake</span></p>
            <span class="text-xs font-mono" :class="fakeAnswer.length>100?'text-red-400':'text-white/28'">
              {{ fakeAnswer.length }}/120
            </span>
          </div>
          <textarea v-model="fakeAnswer" class="bluff-input" rows="3"
            placeholder="Make it sound believable…" maxlength="120"
            @keydown.enter.prevent="submitAnswer"/>
          <button class="btn-primary py-4 text-base w-full"
            :disabled="!fakeAnswer.trim()||busy" @click="submitAnswer">
            <span v-if="busy" class="flex items-center justify-center gap-2">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>Locking in…
            </span>
            <span v-else>🔒 Lock In My Bluff</span>
          </button>
        </div>

        <!-- Who's submitted -->
        <div class="card">
          <p class="text-white/30 text-[10px] uppercase tracking-[0.13em] mb-3">
            {{ submitCount }}/{{ players.length }} submitted
          </p>
          <div class="flex flex-col gap-2.5">
            <div v-for="p in players" :key="p.id" class="flex items-center gap-3">
              <div class="status-dot" :class="room?.submissions?.[p.uid]!=null ? 'done':'waiting'"/>
              <span class="text-sm font-semibold flex-1">{{ p.name }}</span>
              <span v-if="room?.submissions?.[p.uid]!=null" class="text-green-400 text-xs font-bold">✓ done</span>
              <span v-else class="text-white/22 text-xs">writing…</span>
            </div>
          </div>
        </div>

        <button v-if="isHost" class="btn-ghost py-2.5 text-sm" @click="forceVoting">
          ⚡ Skip to Voting
        </button>
      </div>

      <!-- ── VOTING ── -->
      <div v-else-if="room?.status==='voting'" key="voting" class="flex flex-col gap-3 flex-1">
        <p class="text-center font-bold text-white/55 text-sm mb-1">
          🔍 Which is the <span class="font-black text-yellow-300">real</span> answer?
        </p>

        <div class="flex flex-col gap-2.5">
          <button
            v-for="(opt, i) in room.options" :key="opt.id"
            class="opt-card"
            :class="{
              'selected':                selectedOpt===opt.id,
              'opacity-35 pointer-events-none': opt.id===myUid,
            }"
            :style="`background:${OPT_COLORS[i]}16;border-color:${selectedOpt===opt.id?OPT_COLORS[i]:'transparent'}`"
            :disabled="gameStore.iHaveVoted"
            @click="vote(opt.id, i)"
          >
            <span class="inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black mr-3 flex-shrink-0"
              :style="`background:${OPT_COLORS[i]}28;color:${OPT_COLORS[i]}`">
              {{ LETTERS[i] }}
            </span>
            {{ opt.text }}
            <span v-if="opt.id===myUid" class="ml-2 text-white/22 text-xs font-normal">(yours)</span>
          </button>
        </div>

        <p v-if="gameStore.iHaveVoted" class="text-center text-white/35 text-sm py-1 animate-pulse">
          Vote locked! Waiting for others… 🕐
        </p>

        <!-- Vote progress -->
        <div class="flex flex-wrap gap-2 justify-center mt-1">
          <div v-for="p in players" :key="p.id"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all"
            :style="room?.votes?.[p.uid]!=null
              ? 'background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.28);color:#4ade80'
              : 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.28)'">
            <span>{{ p.avatar }}</span>
            <span>{{ room?.votes?.[p.uid]!=null ? '✓' : '…' }}</span>
          </div>
        </div>

        <button v-if="isHost" class="btn-ghost py-2.5 text-sm mt-1" @click="forceReveal">
          ⚡ Reveal Answers
        </button>
      </div>

      <!-- ── REVEAL ── -->
      <div v-else-if="room?.status==='reveal'" key="reveal" class="flex flex-col gap-3 flex-1">
        <p class="text-center font-bold text-white/55 text-sm mb-1">🎭 Who fooled who?</p>

        <!-- Sequential reveal — cards appear one by one -->
        <div class="flex flex-col gap-2.5">
          <template v-for="(opt, i) in room.revealOptions" :key="opt.id">
            <div v-if="i < visibleCount"
              class="opt-card card-in"
              :class="{
                'revealed-real':  opt.isReal,
                'revealed-wrong': !opt.isReal && !opt.voters?.length,
              }"
              :style="`background:${opt.isReal?'rgba(34,197,94,0.1)':OPT_COLORS[i]+'13'};border-color:${opt.isReal?'#22c55e':OPT_COLORS[i]+'48'};animation-delay:0s`"
            >
              <!-- Answer text -->
              <div class="flex items-start gap-2 justify-between mb-2">
                <span class="flex-1 font-bold">{{ opt.text }}</span>
                <span v-if="opt.isReal" class="text-green-400 text-lg flex-shrink-0">✅</span>
                <span v-else-if="opt.voters?.length" class="text-red-400 text-lg flex-shrink-0">😈</span>
              </div>

              <!-- Author + voters -->
              <div class="flex flex-wrap gap-x-3 gap-y-1">
                <span class="text-xs font-black" :class="opt.isReal?'text-green-400':'text-white/45'">
                  {{ opt.isReal ? '✨ Real Answer' : `Written by ${opt.authorName}` }}
                </span>
                <span v-if="!opt.isReal && opt.voters?.length" class="text-xs text-purple-300">
                  Fooled {{ voterNames(opt.voters) }} ·
                  <span class="font-black text-purple-400">+{{ opt.voters.length * 500 }}</span>
                </span>
                <span v-if="opt.isReal && opt.voters?.length" class="text-xs text-green-300">
                  Correct: {{ voterNames(opt.voters) }} ·
                  <span class="font-black">+1,000</span>
                </span>
                <span v-if="opt.isReal && !opt.voters?.length" class="text-xs text-white/30">
                  Nobody found it!
                </span>
              </div>
            </div>
          </template>
        </div>

        <!-- Scoreboard -->
        <div v-if="visibleCount >= (room.revealOptions?.length||0)" class="card mt-1 card-in">
          <p class="text-white/30 text-[10px] uppercase tracking-[0.12em] mb-3">Scoreboard</p>
          <div class="flex flex-col gap-2">
            <div v-for="(p, i) in sortedPlayers" :key="p.id"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              :style="p.uid===myUid?'background:rgba(147,51,234,0.1);border:1px solid rgba(147,51,234,0.22)':'background:rgba(255,255,255,0.03)'">
              <span class="w-6 text-center text-sm"
                :class="i===0?'text-yellow-400':i===1?'text-slate-400':i===2?'text-orange-400':'text-white/20'">
                {{ i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1 }}
              </span>
              <span class="text-xl">{{ p.avatar }}</span>
              <span class="flex-1 font-bold text-sm">{{ p.name }}</span>
              <span v-if="p.lastScore>0" class="text-purple-300 text-xs font-black">+{{ p.lastScore }}</span>
              <span class="font-black font-mono text-white/65 tabular-nums">{{ p.score }}</span>
            </div>
          </div>
        </div>

        <template v-if="visibleCount >= (room.revealOptions?.length||0)">
          <button v-if="isHost" class="btn-primary py-4 text-lg w-full mt-1" @click="next">
            {{ isLastRound ? '🏆 Final Results' : 'Next Round →' }}
          </button>
          <p v-else class="text-center text-white/30 text-sm py-3 animate-pulse">Waiting for host…</p>
        </template>
      </div>

    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, inject } from 'vue'
import { useRoute, useRouter }  from 'vue-router'
import { useAuthStore }         from '@/stores/auth.js'
import { useGameStore }         from '@/stores/game.js'
import { sounds }               from '@/utils/sounds.js'
import TimerRing                from '@/components/TimerRing.vue'

const LETTERS    = ['A','B','C','D','E','F','G','H']
const OPT_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#a855f7','#ec4899','#14b8a6']

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()
const gameStore = useGameStore()
const showToast = inject('showToast')
const roomId    = route.params.roomId

const myUid   = computed(() => authStore.user?.uid)
const room    = computed(() => gameStore.room)
const players = computed(() => gameStore.players)
const isHost  = computed(() => room.value?.hostId === myUid.value)
const sortedPlayers = computed(() => gameStore.sortedPlayers)
const isLastRound   = computed(() => (room.value?.currentRound||0) >= (room.value?.totalRounds||8))
const submitCount   = computed(() => Object.keys(room.value?.submissions||{}).length)

const fakeAnswer  = ref('')
const selectedOpt = ref(null)
const busy        = ref(false)
const visibleCount= ref(0)   // for sequential reveal

// Phase styling
const phaseText  = computed(() => ({ writing:'✍️ Write', voting:'🗳️ Vote', reveal:'🎭 Reveal' })[room.value?.status] || '')
const phaseStyle = computed(() => ({
  writing: 'background:rgba(59,130,246,0.16);border:1px solid rgba(59,130,246,0.38);color:#93c5fd',
  voting:  'background:rgba(234,179,8,0.16);border:1px solid rgba(234,179,8,0.38);color:#fde047',
  reveal:  'background:rgba(147,51,234,0.16);border:1px solid rgba(147,51,234,0.38);color:#c084fc',
})[room.value?.status] || '')

const totalTime   = computed(() => room.value?.status==='voting' ? (room.value?.settings?.votingTime||25) : (room.value?.settings?.writingTime||45))

function voterNames(uids) {
  return uids.map(uid => players.value.find(p=>p.uid===uid)?.name || '?').join(', ')
}

onMounted(async () => {
  if (!authStore.user) await authStore.init()
  gameStore.myUid = myUid.value
  if (!gameStore.room) gameStore.subscribe(roomId)

  // Keep player marked as connected
  gameStore.startHeartbeat(roomId, myUid.value)

  // Host periodically checks for stale players
  if (isHost.value) {
    setInterval(() => gameStore.checkStalePages?.(roomId), 30000)
  }

  onPhaseChange(room.value?.status)
})

// Handle phase transitions
watch(() => room.value?.status, (s) => {
  fakeAnswer.value  = ''
  selectedOpt.value = null
  onPhaseChange(s)
})

// Host: auto-vote when everyone submits
watch(submitCount, (n) => {
  if (!isHost.value || room.value?.status !== 'writing') return
  if (n >= players.value.length && players.value.length > 0) forceVoting()
})

// Host: auto-reveal when everyone votes
watch(() => Object.keys(room.value?.votes||{}).length, (n) => {
  if (!isHost.value || room.value?.status !== 'voting') return
  if (n >= players.value.length && players.value.length > 0) forceReveal()
})

// Route to results
watch(() => room.value?.status, s => {
  if (s === 'final_results') router.push({ name:'results', params:{roomId} })
})

// Sequential reveal
let revealTimers = []
function triggerSequentialReveal(options) {
  revealTimers.forEach(clearTimeout)
  revealTimers = []
  visibleCount.value = 0
  options.forEach((opt, i) => {
    const t = setTimeout(() => {
      visibleCount.value = i + 1
      if (opt.isReal) sounds.realAnswer()
      else if (opt.voters?.length) sounds.psyched()
      else sounds.reveal()
    }, i * 900)
    revealTimers.push(t)
  })
}

function onPhaseChange(status) {
  if (!status) return
  if (status === 'writing') {
    sounds.start()
    gameStore.startTimer(room.value?.settings?.writingTime||45, () => { if(isHost.value) forceVoting() })
  }
  if (status === 'voting') {
    sounds.reveal()
    gameStore.startTimer(room.value?.settings?.votingTime||25, () => { if(isHost.value) forceReveal() })
  }
  if (status === 'reveal') {
    gameStore.stopTimer()
    gameStore.timeLeft = 0
    const opts = room.value?.revealOptions || []
    if (opts.length) triggerSequentialReveal(opts)
  }
}

async function submitAnswer() {
  if (!fakeAnswer.value.trim()) return
  busy.value = true
  try { await gameStore.submitFakeAnswer(roomId, myUid.value, fakeAnswer.value); sounds.submit() }
  catch(e) { showToast(e.message, 'error') } finally { busy.value = false }
}
async function vote(optId, i) {
  if (gameStore.iHaveVoted || optId === myUid.value) return
  selectedOpt.value = optId; sounds.vote()
  await gameStore.submitVote(roomId, myUid.value, optId)
}
async function forceVoting()  { try { await gameStore.startVoting(roomId) }  catch(e){ showToast(e.message,'error') } }
async function forceReveal()  { try { await gameStore.startReveal(roomId) }  catch(e){ showToast(e.message,'error') } }
async function next() {
  if (isLastRound.value) await gameStore.endGame(roomId)
  else await gameStore.startRound(roomId)
}

onBeforeUnmount(() => {
  gameStore.stopTimer()
  gameStore.stopHeartbeat()
  gameStore.markDisconnected(roomId, myUid.value)
  revealTimers.forEach(clearTimeout)
})
</script>
