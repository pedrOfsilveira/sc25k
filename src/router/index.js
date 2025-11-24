import { route } from 'quasar/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'
// 1. IMPORTANTE: Importar o cliente do supabase que criámos no boot file
import { supabase } from 'src/boot/supabase'

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  Router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

    const { data: { session } } = await supabase.auth.getSession()

    if (requiresAuth && !session) {
      next('/login')
    }
    else if (to.path === '/login' && session) {
      next('/')
    }
    else {
      next()
    }
  })


  return Router
})
