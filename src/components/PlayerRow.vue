<template>
  <div class="player-row" :class="{ 'player-row--me': isMe }">
    <div class="player-avatar" :style="`background:${player.color}18;border-color:${player.color}40`">
      {{ player.avatar }}
    </div>
    <div class="player-info">
      <div class="player-name">
        {{ player.name }}
        <span v-if="isMe" class="player-you">you</span>
        <span v-if="player.isHost" class="player-crown">👑</span>
      </div>
      <slot name="sub">
        <div class="player-score">{{ player.score || 0 }} pts</div>
      </slot>
    </div>
    <slot name="right"/>
  </div>
</template>

<script setup>
defineProps({
  player: { type: Object, required: true },
  isMe:   { type: Boolean, default: false }
})
</script>

<style scoped>
.player-row {
  display: flex; align-items: center; gap: 14px;
  padding: 12px 16px; border-radius: 18px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  transition: background 0.2s, border-color 0.2s;
}
.player-row--me {
  background: rgba(147,51,234,0.1);
  border-color: rgba(147,51,234,0.35);
}
.player-avatar {
  width: 44px; height: 44px;
  border-radius: 14px;
  border: 1.5px solid;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem; flex-shrink: 0;
}
.player-info { flex: 1; min-width: 0; }
.player-name {
  font-weight: 800; font-size: 0.9rem;
  display: flex; align-items: center; gap: 6px;
}
.player-you {
  font-size: 0.6rem; font-weight: 700;
  padding: 1px 7px; border-radius: 99px;
  background: rgba(147,51,234,0.25);
  border: 1px solid rgba(147,51,234,0.4);
  color: #c084fc; letter-spacing: 0.05em;
}
.player-crown { font-size: 1rem; }
.player-score { font-size: 0.72rem; color: rgba(255,255,255,0.3); margin-top: 1px; }
</style>
