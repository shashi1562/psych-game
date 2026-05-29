<template>
  <Teleport to="body">
    <Transition name="fade">
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/75 backdrop-blur-md" @click="$emit('close')"/>

        <!-- Panel -->
        <div class="modal-panel relative w-full max-w-sm">
          <!-- Close -->
          <button
            class="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition z-10"
            @click="$emit('close')"
          >✕</button>

          <div class="pb-1">
            <h2 class="font-black text-2xl leading-tight mb-1">{{ title }}</h2>
            <p v-if="subtitle" class="text-white/35 text-sm mb-6">{{ subtitle }}</p>
            <div v-else class="mb-5"/>
            <slot/>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({ title: String, subtitle: String })
defineEmits(['close'])
</script>

<style scoped>
.modal-panel {
  background: linear-gradient(160deg, #161627 0%, #0f0f1c 100%);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 28px;
  padding: 1.5rem;
  box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset;
  animation: modalIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
}
@keyframes modalIn {
  from { opacity:0; transform:translateY(32px) scale(0.93); }
  to   { opacity:1; transform:translateY(0)    scale(1); }
}
</style>
