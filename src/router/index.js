import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'

// Hash history for GitHub Pages (no server-side routing needed)
// Web history for Firebase Hosting
const history = import.meta.env.VITE_ROUTER_HASH === 'true'
  ? createWebHashHistory()
  : createWebHistory()

export default createRouter({
  history,
  routes: [
    { path:'/',             name:'home',    component:()=>import('@/views/HomeView.vue') },
    { path:'/lobby/:roomId',name:'lobby',   component:()=>import('@/views/LobbyView.vue') },
    { path:'/game/:roomId', name:'game',    component:()=>import('@/views/GameView.vue') },
    { path:'/results/:roomId',name:'results',component:()=>import('@/views/ResultsView.vue') },
    { path:'/:pathMatch(.*)*', redirect:'/' }
  ],
  scrollBehavior:()=>({top:0})
})
