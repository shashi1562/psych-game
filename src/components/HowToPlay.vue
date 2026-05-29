<template>
  <div class="htp-card">
    <div class="htp-header">
      <span class="htp-title">How to Play</span>
    </div>

    <div class="htp-steps">
      <div v-for="(step, i) in steps" :key="i" class="htp-step">
        <div class="htp-num">{{ i + 1 }}</div>
        <div class="htp-body">
          <div class="htp-icon">{{ step.icon }}</div>
          <div>
            <p class="htp-label">{{ step.label }}</p>
            <p class="htp-desc">{{ step.desc }}</p>
          </div>
        </div>
        <div v-if="i < steps.length - 1" class="htp-divider"/>
      </div>
    </div>

    <div class="htp-score">
      <div class="htp-score-item">
        <span class="htp-score-val">+1,000</span>
        <span class="htp-score-label">You spotted the real answer</span>
      </div>
      <div class="htp-score-sep"/>
      <div class="htp-score-item">
        <span class="htp-score-val" style="color:#c084fc">+500</span>
        <span class="htp-score-label">Per person you fooled</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const steps = [
  {
    icon: '✍️',
    label: 'Write a fake answer',
    desc:  'A question appears. You write a bluff that sounds like the real answer. Everyone does the same — but no one sees each other\'s.'
  },
  {
    icon: '🗳️',
    label: 'Vote on the real one',
    desc:  'All answers (your bluffs + the actual real answer) are shown. Pick the one you think is genuinely correct.'
  },
  {
    icon: '🎭',
    label: 'Watch the reveal',
    desc:  'Each answer flips to show who wrote it and who voted for it. The more people you fool, the more points you score!'
  }
]
</script>

<style scoped>
.htp-card {
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.08);
  background: linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%);
}
.htp-header {
  padding: 14px 18px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.htp-title {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);
}
.htp-steps { padding: 4px 0; }
.htp-step  { position: relative; }
.htp-body  {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 14px 18px 12px;
}
.htp-num {
  position: absolute; top: 14px; right: 18px;
  width: 20px; height: 20px; border-radius: 50%;
  background: rgba(147,51,234,0.18);
  border: 1px solid rgba(147,51,234,0.3);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.65rem; font-weight: 800; color: #c084fc;
  flex-shrink: 0;
}
.htp-icon {
  font-size: 1.4rem;
  width: 36px; height: 36px;
  border-radius: 10px;
  background: rgba(255,255,255,0.05);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.htp-label {
  font-size: 0.875rem;
  font-weight: 800;
  color: rgba(255,255,255,0.9);
  margin-bottom: 3px;
}
.htp-desc {
  font-size: 0.775rem;
  color: rgba(255,255,255,0.38);
  line-height: 1.5;
}
.htp-divider {
  height: 1px;
  background: rgba(255,255,255,0.05);
  margin: 0 18px;
}
.htp-score {
  display: flex;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.htp-score-item {
  flex: 1;
  display: flex; flex-direction: column; align-items: center;
  gap: 2px; padding: 12px 10px;
}
.htp-score-sep {
  width: 1px;
  background: rgba(255,255,255,0.06);
  align-self: stretch;
}
.htp-score-val {
  font-size: 1.1rem; font-weight: 900;
  color: #4ade80;
  font-family: 'JetBrains Mono', monospace;
}
.htp-score-label {
  font-size: 0.68rem; color: rgba(255,255,255,0.35);
  text-align: center; line-height: 1.4;
}
</style>
