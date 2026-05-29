import { defineStore }        from 'pinia'
import { ref, computed }      from 'vue'
import { db }                 from '@/firebase.js'
import {
  doc, collection, setDoc, updateDoc, onSnapshot,
  getDocs, writeBatch, serverTimestamp, deleteDoc
} from 'firebase/firestore'
import { getQuestionSet }     from '@/data/questions.js'
import { MELONI, meloniBluff } from '@/utils/aiPlayers.js'

const ANSWER_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#a855f7','#ec4899','#14b8a6']
const HISTORY_KEY   = 'psych_history'
const HEARTBEAT_TTL = 45000   // mark disconnected after 45s no heartbeat

function genCode() {
  return Array.from({length:5}, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*33)]).join('')
}
function shuffle(arr) { return [...arr].sort(() => Math.random() - .5) }

export const useGameStore = defineStore('game', () => {
  const room     = ref(null)
  const players  = ref([])
  const loading  = ref(false)
  const error    = ref(null)
  const timeLeft = ref(0)
  const myUid    = ref(null)

  let unsubRoom     = null
  let unsubPlayers  = null
  let timerInterval = null
  let heartbeatInt  = null
  let botTimers     = []

  const history = ref(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'))

  // ── Derived ───────────────────────────────────────────────────────
  const me           = computed(() => players.value.find(p => p.uid === myUid.value))
  const isHost       = computed(() => room.value?.hostId === myUid.value)
  const activePlayers= computed(() => players.value.filter(p => p.isConnected !== false))
  const sortedPlayers= computed(() => [...players.value].sort((a,b) => (b.score||0) - (a.score||0)))

  const iHaveSubmitted = computed(() => myUid.value in (room.value?.submissions || {}))
  const iHaveVoted     = computed(() => myUid.value in (room.value?.votes || {}))

  // ── Subscribe ─────────────────────────────────────────────────────
  function subscribe(roomId) {
    unsubRoom?.(); unsubPlayers?.()
    unsubRoom    = onSnapshot(doc(db, 'rooms', roomId), s => {
      room.value = s.exists() ? { id: s.id, ...s.data() } : null
    })
    unsubPlayers = onSnapshot(collection(db, 'rooms', roomId, 'players'), s => {
      players.value = s.docs.map(d => ({ id: d.id, ...d.data() }))
    })
  }

  function unsubscribe() {
    unsubRoom?.(); unsubPlayers?.()
    stopHeartbeat(); clearBotTimers()
    room.value = null; players.value = []
  }

  // ── History ───────────────────────────────────────────────────────
  function saveHistory(roomId, name, myName) {
    const list = [{ roomId, name, myName, at: Date.now() }, ...history.value.filter(h => h.roomId !== roomId)].slice(0, 5)
    history.value = list
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
  }

  // ── Heartbeat — keeps player "alive" ─────────────────────────────
  function startHeartbeat(roomId, uid) {
    stopHeartbeat()
    const ping = () => updateDoc(doc(db, 'rooms', roomId, 'players', uid), {
      lastSeen: serverTimestamp(), isConnected: true
    }).catch(() => {})
    ping()
    heartbeatInt = setInterval(ping, 20000)
  }

  function stopHeartbeat() {
    clearInterval(heartbeatInt)
    heartbeatInt = null
  }

  async function markDisconnected(roomId, uid) {
    await updateDoc(doc(db, 'rooms', roomId, 'players', uid), { isConnected: false }).catch(() => {})
  }

  // Host: scan for stale players and mark them disconnected
  async function checkStalePlayers(roomId) {
    const now = Date.now()
    for (const p of players.value) {
      if (p.isBot) continue
      const lastSeen = p.lastSeen?.toMillis?.() || 0
      const stale    = now - lastSeen > HEARTBEAT_TTL
      if (stale && p.isConnected !== false) {
        await updateDoc(doc(db, 'rooms', roomId, 'players', p.id), { isConnected: false }).catch(() => {})
      }
    }
  }

  // ── Create Room ───────────────────────────────────────────────────
  async function createRoom({ myName, uid, settings }) {
    loading.value = true; error.value = null
    try {
      const code   = genCode()
      const roomId = doc(collection(db, 'rooms')).id
      const batch  = writeBatch(db)
      batch.set(doc(db, 'rooms', roomId), {
        code, name: `${myName}'s Room`,
        hostId: uid, status: 'lobby',
        settings: {
          rounds:      settings.rounds      || 8,
          writingTime: settings.writingTime || 45,
          votingTime:  settings.votingTime  || 25,
        },
        currentRound: 0, totalRounds: settings.rounds || 8,
        question: null, submissions: {}, options: [], votes: {},
        createdAt: serverTimestamp()
      })
      batch.set(doc(db, 'rooms', roomId, 'players', uid), {
        uid, name: myName, isHost: true, isBot: false,
        score: 0, avatar: randAvatar(), color: randColor(),
        isConnected: true, lastSeen: serverTimestamp(),
        joinedAt: serverTimestamp()
      })
      await batch.commit()
      saveHistory(roomId, `${myName}'s Room`, myName)
      return roomId
    } finally { loading.value = false }
  }

  // ── Join Room — allows rejoining mid-game ─────────────────────────
  async function joinRoom({ code, myName, uid }) {
    loading.value = true; error.value = null
    try {
      const { query, where } = await import('firebase/firestore')
      const q    = query(collection(db, 'rooms'), where('code', '==', code.toUpperCase()))
      const snap = await getDocs(q)
      if (snap.empty) throw new Error('Room not found!')

      const roomDoc  = snap.docs[0]
      const roomData = roomDoc.data()

      // Check duplicate name (skip if it's the same uid rejoining)
      const plSnap = await getDocs(collection(db, 'rooms', roomDoc.id, 'players'))
      const dup    = plSnap.docs.find(d => d.data().name === myName && d.id !== uid)
      if (dup) throw new Error('Name already taken in this room!')

      // Always allow joining — even mid-game (rejoining)
      await setDoc(doc(db, 'rooms', roomDoc.id, 'players', uid), {
        uid, name: myName, isHost: false, isBot: false,
        score: 0, avatar: randAvatar(), color: randColor(),
        isConnected: true, lastSeen: serverTimestamp(),
        joinedAt: serverTimestamp()
      }, { merge: true })  // merge:true preserves existing score on rejoin

      saveHistory(roomDoc.id, roomData.name, myName)
      return { roomId: roomDoc.id, status: roomData.status }
    } finally { loading.value = false }
  }

  // ── Add Meloni bot ────────────────────────────────────────────────
  async function addMeloni(roomId) {
    const botId = `bot_meloni`
    const existing = players.value.find(p => p.id === botId)
    if (existing) return   // already added
    await setDoc(doc(db, 'rooms', roomId, 'players', botId), {
      uid: botId, name: MELONI.name, isHost: false, isBot: true,
      score: 0, avatar: MELONI.emoji, color: MELONI.color,
      isConnected: true, lastSeen: serverTimestamp(),
      joinedAt: serverTimestamp()
    })
  }

  async function removeBot(roomId, botId) {
    await deleteDoc(doc(db, 'rooms', roomId, 'players', botId))
  }

  // ── Schedule Meloni's actions for a round ────────────────────────
  function scheduleMeloniBots(roomId, question) {
    clearBotTimers()
    const bots = players.value.filter(p => p.isBot)
    bots.forEach(bot => {
      // Submit fake answer during writing phase
      const t1 = setTimeout(async () => {
        const bluff = meloniBluff(question.cat)
        await updateDoc(doc(db, 'rooms', roomId), {
          [`submissions.${bot.uid}`]: bluff
        }).catch(() => {})
      }, MELONI.bluffDelay())
      botTimers.push(t1)
    })
  }

  function scheduleMeloniVote(roomId, options) {
    clearBotTimers()
    const bots = players.value.filter(p => p.isBot)
    bots.forEach(bot => {
      const t = setTimeout(async () => {
        // Vote for a random option that isn't the bot's own answer
        const choices = options.filter(o => o.id !== bot.uid)
        if (!choices.length) return
        const pick = choices[Math.floor(Math.random() * choices.length)]
        await updateDoc(doc(db, 'rooms', roomId), {
          [`votes.${bot.uid}`]: pick.id
        }).catch(() => {})
      }, MELONI.voteDelay())
      botTimers.push(t)
    })
  }

  function clearBotTimers() {
    botTimers.forEach(clearTimeout)
    botTimers = []
  }

  // ── Start Round ───────────────────────────────────────────────────
  async function startRound(roomId) {
    const r         = room.value
    const nextRound = (r?.currentRound || 0) + 1
    const pack      = r?.questionPack || getQuestionSet(r?.settings?.rounds || 8).map(q => ({...q}))
    const question  = pack[nextRound - 1]
    if (!question) { await endGame(roomId); return }

    const batch = writeBatch(db)
    players.value.forEach(p => {
      batch.update(doc(db, 'rooms', roomId, 'players', p.id), { lastScore: 0 })
    })
    batch.update(doc(db, 'rooms', roomId), {
      status:       'writing',
      currentRound: nextRound,
      questionPack: nextRound === 1 ? pack : r.questionPack,
      question,
      submissions:  {},
      options:      [],
      votes:        {},
      roundStartedAt: serverTimestamp()
    })
    await batch.commit()

    // Schedule bots
    if (isHost.value) scheduleMeloniBots(roomId, question)
  }

  // ── Submit Fake Answer ────────────────────────────────────────────
  async function submitFakeAnswer(roomId, uid, text) {
    await updateDoc(doc(db, 'rooms', roomId), {
      [`submissions.${uid}`]: text.trim().slice(0, 120)
    })
  }

  // ── Start Voting ──────────────────────────────────────────────────
  async function startVoting(roomId) {
    const r    = room.value
    const subs = r?.submissions || {}
    const real = r?.question?.real || ''

    const opts = shuffle([
      ...Object.entries(subs).map(([uid, text]) => ({ id: uid, text, isReal: false })),
      { id: '__real__', text: real, isReal: true }
    ])

    await updateDoc(doc(db, 'rooms', roomId), {
      status: 'voting', options: opts, votes: {}
    })

    // Schedule bot votes
    if (isHost.value) scheduleMeloniVote(roomId, opts)
  }

  // ── Submit Vote ───────────────────────────────────────────────────
  async function submitVote(roomId, uid, optionId) {
    await updateDoc(doc(db, 'rooms', roomId), {
      [`votes.${uid}`]: optionId
    })
  }

  // ── Reveal ────────────────────────────────────────────────────────
  async function startReveal(roomId) {
    const r     = room.value
    const votes = r?.votes   || {}

    const tally = {}
    Object.entries(votes).forEach(([voter, optId]) => {
      if (!tally[optId]) tally[optId] = []
      tally[optId].push(voter)
    })

    const deltas = {}
    Object.entries(votes).forEach(([voter, optId]) => {
      if (optId === '__real__') deltas[voter] = (deltas[voter] || 0) + 1000
    })
    Object.entries(tally).forEach(([optId, voters]) => {
      if (optId === '__real__') return
      voters.forEach(() => { deltas[optId] = (deltas[optId] || 0) + 500 })
    })

    const batch = writeBatch(db)
    players.value.forEach(p => {
      const delta = deltas[p.uid] || 0
      batch.update(doc(db, 'rooms', roomId, 'players', p.id), {
        score:     (p.score || 0) + delta,
        lastScore: delta
      })
    })

    const revealOptions = (r?.options || []).map(opt => ({
      ...opt,
      authorName: opt.isReal ? '✨ Real Answer' : (players.value.find(p => p.uid === opt.id)?.name || 'Unknown'),
      voters: tally[opt.id] || []
    }))

    batch.update(doc(db, 'rooms', roomId), { status: 'reveal', revealOptions })
    await batch.commit()
    clearBotTimers()
  }

  // ── End Game / Reset ──────────────────────────────────────────────
  async function endGame(roomId) {
    await updateDoc(doc(db, 'rooms', roomId), { status: 'final_results' })
  }

  async function resetToLobby(roomId) {
    loading.value = true
    try {
      const batch = writeBatch(db)
      players.value.forEach(p => {
        batch.update(doc(db, 'rooms', roomId, 'players', p.id), { score: 0, lastScore: 0 })
      })
      batch.update(doc(db, 'rooms', roomId), {
        status: 'lobby', currentRound: 0,
        question: null, submissions: {}, options: [], votes: {},
        questionPack: null, revealOptions: null
      })
      await batch.commit()
    } finally { loading.value = false }
  }

  // ── Timer ─────────────────────────────────────────────────────────
  function startTimer(secs, onEnd) {
    clearInterval(timerInterval)
    timeLeft.value = secs
    timerInterval  = setInterval(() => {
      timeLeft.value = Math.max(0, timeLeft.value - 1)
      if (timeLeft.value <= 0) { clearInterval(timerInterval); onEnd?.() }
    }, 1000)
  }
  function stopTimer() { clearInterval(timerInterval) }

  // ── Utils ─────────────────────────────────────────────────────────
  function randAvatar() {
    return ['😎','🤩','🥳','😏','🤪','🦊','🐼','🦁','🤖','👾','😈','💀','🧙','🦸','🎭'][Math.floor(Math.random()*15)]
  }
  function randColor() {
    return ANSWER_COLORS[Math.floor(Math.random() * ANSWER_COLORS.length)]
  }

  return {
    room, players, loading, error, timeLeft, myUid,
    me, isHost, activePlayers, sortedPlayers,
    iHaveSubmitted, iHaveVoted, history,
    subscribe, unsubscribe, saveHistory,
    startHeartbeat, stopHeartbeat, markDisconnected, checkStalePages: checkStalePlayers,
    createRoom, joinRoom,
    addMeloni, removeBot,
    startRound, submitFakeAnswer, startVoting, submitVote, startReveal, endGame, resetToLobby,
    startTimer, stopTimer
  }
})
