<template>
  <div class="timer-wrap" :class="{ danger: isDanger }">
    <svg viewBox="0 0 44 44" class="timer-svg">
      <circle cx="22" cy="22" r="18" class="timer-track"/>
      <circle cx="22" cy="22" r="18" class="timer-fill"
        :stroke="isDanger ? '#ef4444' : '#9333ea'"
        :stroke-dashoffset="offset"/>
    </svg>
    <span class="timer-num" :class="{ 'timer-blink': isDanger }">{{ time }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  time:  { type: Number, default: 0 },
  total: { type: Number, default: 45 }
})

const CIRCUMFERENCE = 113.1
const isDanger = computed(() => props.time <= 5 && props.time > 0)
const offset   = computed(() => CIRCUMFERENCE * (1 - props.time / Math.max(props.total, 1)))
</script>

<style scoped>
.timer-wrap {
  position: relative;
  width: 44px; height: 44px;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.timer-svg {
  position: absolute; inset: 0;
  transform: rotate(-90deg);
  width: 100%; height: 100%;
}
.timer-track {
  fill: none;
  stroke: rgba(255,255,255,0.07);
  stroke-width: 3.5;
}
.timer-fill {
  fill: none;
  stroke-width: 3.5;
  stroke-linecap: round;
  stroke-dasharray: 113.1;
  transition: stroke-dashoffset 1s linear, stroke 0.3s ease;
}
.timer-num {
  position: relative; z-index: 1;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem; font-weight: 700;
  color: rgba(255,255,255,0.8);
  transition: color 0.3s;
}
.danger .timer-num { color: #ef4444; }
.timer-blink { animation: blink 0.5s ease-in-out infinite; }
@keyframes blink { 0%,100%{ opacity:1 } 50%{ opacity:0.5 } }
</style>
