import { defineStore }        from 'pinia'
import { ref }                 from 'vue'
import { auth, ensureAuth }    from '@/firebase.js'
import { onAuthStateChanged }  from 'firebase/auth'

export const useAuthStore = defineStore('auth', () => {
  const user    = ref(null)
  const loading = ref(true)

  async function init() {
    return new Promise(resolve => {
      onAuthStateChanged(auth, async u => {
        if (u) { user.value = u; loading.value = false; resolve(u) }
        else {
          try { user.value = await ensureAuth() } catch {}
          loading.value = false; resolve(user.value)
        }
      })
    })
  }

  return { user, loading, init }
})
