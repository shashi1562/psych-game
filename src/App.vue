<template>
  <div class="min-h-screen font-game relative overflow-x-hidden" style="background:#08080f;color:#f1f1ff">

    <!-- Background orbs -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div class="orb orb-purple"/>
      <div class="orb orb-blue"/>
      <div class="orb orb-pink"/>
    </div>

    <!-- Boot loader -->
    <Transition name="fade">
      <div v-if="loading" class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4" style="background:#08080f">
        <div class="text-6xl animate-float">🎭</div>
        <div class="flex gap-1.5">
          <span v-for="i in 3" :key="i" class="w-2 h-2 rounded-full bg-purple-500"
            :style="`animation:dotPulse 1.2s ease-in-out ${(i-1)*0.2}s infinite`"/>
        </div>
      </div>
    </Transition>

    <RouterView v-slot="{Component}">
      <Transition name="page" mode="out-in">
        <component :is="Component"/>
      </Transition>
    </RouterView>

    <!-- Toast stack -->
    <div class="fixed bottom-5 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
      <TransitionGroup name="list">
        <div v-for="t in toasts" :key="t.id"
          class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-semibold max-w-[300px]"
          :style="t.type==='error'
            ? 'background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.35);color:#fca5a5'
            : 'background:rgba(147,51,234,0.15);border:1px solid rgba(147,51,234,0.35);color:#d8b4fe'"
        >
          <span class="text-base flex-shrink-0">{{ t.type==='error'?'❌':'✨' }}</span>
          <span>{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
import { ref, provide, onMounted } from 'vue'
import { useAuthStore }            from '@/stores/auth.js'

const authStore = useAuthStore()
const loading   = ref(true)
const toasts    = ref([])

function showToast(message, type='info') {
  const id = Date.now() + Math.random()
  toasts.value.push({ id, message, type })
  setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, 3500)
}
provide('showToast', showToast)

onMounted(async () => { await authStore.init(); loading.value = false })
</script>

<style>
@keyframes dotPulse { 0%,100%{opacity:0.2;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
</style>
