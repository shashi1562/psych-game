/**
 * Psych! style bluffing game store.
 *
 * STATUS FLOW:
 *   lobby → writing → voting → reveal → (next round) → final_results
 *
 * SCORING:
 *   +1000  correctly picked real answer
 *   +500   per player you psyched with your fake answer
 */
import { defineStore }          from 'pinia'
import { ref, computed }        from 'vue'
import { db }                   from '@/firebase.js'
import {
  doc, collection, setDoc, updateDoc, onSnapshot,
  getDocs, writeBatch, serverTimestamp, deleteDoc
} from 'firebase/firestore'
import { getQuestionSet }       from '@/data/questions.js'

const ANSWER_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#a855f7','#ec4899','#14b8a6']
const HISTORY_KEY   = 'psych_history'

function genCode() {
  return Array.from({length:5},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*33)]).join('')
}
function shuffle(arr) { return [...arr].sort(()=>Math.random()-.5) }
function uid2color(uid, players) {
  const idx = players.findIndex(p=>p.uid===uid)
  return ANSWER_COLORS[idx % ANSWER_COLORS.length]
}

export const useGameStore = defineStore('game', () => {
  const room     = ref(null)
  const players  = ref([])
  const loading  = ref(false)
  const error    = ref(null)
  const timeLeft = ref(0)
  const myUid    = ref(null)

  let unsubRoom    = null
  let unsubPlayers = null
  let timerInterval= null

  const history = ref(JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]'))

  // ── Derived ───────────────────────────────────────────────────────
  const me          = computed(()=> players.value.find(p=>p.uid===myUid.value))
  const isHost      = computed(()=> room.value?.hostId === myUid.value)
  const sortedPlayers= computed(()=>[...players.value].sort((a,b)=>(b.score||0)-(a.score||0)))

  const iHaveSubmitted = computed(()=> {
    const subs = room.value?.submissions || {}
    return myUid.value in subs
  })
  const iHaveVoted = computed(()=> {
    const votes = room.value?.votes || {}
    return myUid.value in votes
  })

  // ── Subscribe ─────────────────────────────────────────────────────
  function subscribe(roomId) {
    unsubRoom?.()
    unsubPlayers?.()
    unsubRoom = onSnapshot(doc(db,'rooms',roomId), s=>{
      room.value = s.exists() ? {id:s.id,...s.data()} : null
    })
    unsubPlayers = onSnapshot(collection(db,'rooms',roomId,'players'), s=>{
      players.value = s.docs.map(d=>({id:d.id,...d.data()}))
    })
  }

  function unsubscribe() {
    unsubRoom?.(); unsubPlayers?.()
    room.value=null; players.value=[]
  }

  // ── History ───────────────────────────────────────────────────────
  function saveHistory(roomId, name, myName) {
    const list=[{roomId,name,myName,at:Date.now()},...history.value.filter(h=>h.roomId!==roomId)].slice(0,5)
    history.value=list; localStorage.setItem(HISTORY_KEY,JSON.stringify(list))
  }

  // ── Create Room ───────────────────────────────────────────────────
  async function createRoom({ myName, uid, settings }) {
    loading.value=true; error.value=null
    try {
      const code   = genCode()
      const roomId = doc(collection(db,'rooms')).id
      const batch  = writeBatch(db)
      batch.set(doc(db,'rooms',roomId),{
        code, name:`${myName}'s Room`,
        hostId:uid, status:'lobby',
        settings:{
          rounds:      settings.rounds    || 8,
          writingTime: settings.writingTime|| 45,
          votingTime:  settings.votingTime || 25,
        },
        currentRound:0, totalRounds:settings.rounds||8,
        question:null, submissions:{}, options:[], votes:{},
        createdAt:serverTimestamp()
      })
      batch.set(doc(db,'rooms',roomId,'players',uid),{
        uid, name:myName, isHost:true,
        score:0, avatar:randAvatar(), color:randColor(),
        joinedAt:serverTimestamp()
      })
      await batch.commit()
      saveHistory(roomId, `${myName}'s Room`, myName)
      return roomId
    } finally { loading.value=false }
  }

  // ── Join Room ─────────────────────────────────────────────────────
  async function joinRoom({ code, myName, uid }) {
    loading.value=true; error.value=null
    try {
      const { query, where } = await import('firebase/firestore')
      const q    = query(collection(db,'rooms'),where('code','==',code.toUpperCase()))
      const snap = await getDocs(q)
      if (snap.empty) throw new Error('Room not found!')
      const roomDoc  = snap.docs[0]
      const roomData = roomDoc.data()
      if (roomData.status !== 'lobby') throw new Error('Game already started!')
      const plSnap = await getDocs(collection(db,'rooms',roomDoc.id,'players'))
      if (plSnap.docs.some(d=>d.data().name===myName && d.id!==uid))
        throw new Error('Name taken in this room!')
      await setDoc(doc(db,'rooms',roomDoc.id,'players',uid),{
        uid, name:myName, isHost:false,
        score:0, avatar:randAvatar(), color:randColor(),
        joinedAt:serverTimestamp()
      },{merge:true})
      saveHistory(roomDoc.id, roomData.name, myName)
      return roomDoc.id
    } finally { loading.value=false }
  }

  // ── START ROUND (host) ────────────────────────────────────────────
  async function startRound(roomId) {
    const r         = room.value
    const nextRound = (r?.currentRound||0) + 1
    const pack      = r?.questionPack || getQuestionSet(r?.settings?.rounds||8).map(q=>({...q}))
    const question  = pack[nextRound-1]
    if (!question) { await endGame(roomId); return }

    const batch = writeBatch(db)
    // Reset player answers for new round
    players.value.forEach(p=>{
      batch.update(doc(db,'rooms',roomId,'players',p.id),{lastScore:0})
    })
    batch.update(doc(db,'rooms',roomId),{
      status:       'writing',
      currentRound: nextRound,
      questionPack: nextRound===1 ? pack : r.questionPack,
      question,
      submissions:  {},
      options:      [],
      votes:        {},
      roundStartedAt: serverTimestamp()
    })
    await batch.commit()
  }

  // ── SUBMIT FAKE ANSWER (any player) ───────────────────────────────
  async function submitFakeAnswer(roomId, uid, text) {
    const clean = text.trim().slice(0,120)
    await updateDoc(doc(db,'rooms',roomId),{
      [`submissions.${uid}`]: clean
    })
  }

  // ── START VOTING (host) ───────────────────────────────────────────
  async function startVoting(roomId) {
    const r    = room.value
    const subs = r?.submissions || {}
    const real = r?.question?.real || ''

    // Build options: all fake answers + real answer, shuffled
    const opts = shuffle([
      ...Object.entries(subs).map(([uid,text])=>({ id:uid, text, isReal:false })),
      { id:'__real__', text:real, isReal:true }
    ])

    await updateDoc(doc(db,'rooms',roomId),{
      status:  'voting',
      options: opts,
      votes:   {}
    })
  }

  // ── SUBMIT VOTE (any player) ──────────────────────────────────────
  async function submitVote(roomId, uid, optionId) {
    await updateDoc(doc(db,'rooms',roomId),{
      [`votes.${uid}`]: optionId
    })
  }

  // ── REVEAL (host) ─────────────────────────────────────────────────
  async function startReveal(roomId) {
    const r       = room.value
    const votes   = r?.votes   || {}
    const options = r?.options || {}
    const subs    = r?.submissions || {}

    // Tally: who voted for what
    const tally = {} // optionId → [voterUids]
    Object.entries(votes).forEach(([voterUid, optId])=>{
      if (!tally[optId]) tally[optId]=[]
      tally[optId].push(voterUid)
    })

    // Score delta per player
    const deltas = {}
    Object.entries(votes).forEach(([voterUid, optId])=>{
      if (optId==='__real__') {
        deltas[voterUid] = (deltas[voterUid]||0) + 1000
      }
    })
    // +500 per person fooled by your fake answer
    Object.entries(tally).forEach(([optId, voters])=>{
      if (optId==='__real__') return
      const authorUid = optId // optionId IS the author uid for fakes
      voters.forEach(()=>{
        deltas[authorUid] = (deltas[authorUid]||0) + 500
      })
    })

    // Update scores
    const batch = writeBatch(db)
    players.value.forEach(p=>{
      const delta = deltas[p.uid] || 0
      batch.update(doc(db,'rooms',roomId,'players',p.id),{
        score:    (p.score||0) + delta,
        lastScore: delta
      })
    })

    // Build enriched reveal options (now show authorship)
    const revealOptions = (r?.options||[]).map(opt=>({
      ...opt,
      authorName: opt.isReal ? '✨ Real Answer' : (players.value.find(p=>p.uid===opt.id)?.name || 'Unknown'),
      voters: tally[opt.id] || []
    }))

    batch.update(doc(db,'rooms',roomId),{
      status:        'reveal',
      revealOptions,
      roundScores:   deltas
    })
    await batch.commit()
  }

  // ── END GAME (host) ───────────────────────────────────────────────
  async function endGame(roomId) {
    await updateDoc(doc(db,'rooms',roomId),{ status:'final_results' })
  }

  // ── RESET (host) ─────────────────────────────────────────────────
  async function resetToLobby(roomId) {
    loading.value=true
    try {
      const batch = writeBatch(db)
      players.value.forEach(p=>{
        batch.update(doc(db,'rooms',roomId,'players',p.id),{score:0,lastScore:0})
      })
      batch.update(doc(db,'rooms',roomId),{
        status:'lobby', currentRound:0,
        question:null, submissions:{}, options:[], votes:{},
        questionPack:null, revealOptions:null
      })
      await batch.commit()
    } finally { loading.value=false }
  }

  // ── Timer ─────────────────────────────────────────────────────────
  function startTimer(secs, onEnd) {
    clearInterval(timerInterval)
    timeLeft.value = secs
    timerInterval = setInterval(()=>{
      timeLeft.value = Math.max(0, timeLeft.value-1)
      if (timeLeft.value<=0) { clearInterval(timerInterval); onEnd?.() }
    }, 1000)
  }
  function stopTimer() { clearInterval(timerInterval) }

  // ── Utils ─────────────────────────────────────────────────────────
  function randAvatar() {
    return ['😎','🤩','🥳','😏','🤪','🦊','🐼','🦁','🤖','👾','😈','💀','🧙','🦸','🎭'][Math.floor(Math.random()*15)]
  }
  function randColor() {
    return ANSWER_COLORS[Math.floor(Math.random()*ANSWER_COLORS.length)]
  }

  return {
    room, players, loading, error, timeLeft, myUid,
    me, isHost, sortedPlayers, iHaveSubmitted, iHaveVoted, history,
    subscribe, unsubscribe, saveHistory,
    createRoom, joinRoom,
    startRound, submitFakeAnswer, startVoting, submitVote, startReveal, endGame, resetToLobby,
    startTimer, stopTimer
  }
})
