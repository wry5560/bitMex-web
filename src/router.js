import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import(/* webpackChunkName: "about" */ './views/Home.vue')
    },
    {
      path: '/celveB',
      name: 'CelveB',
      component: () => import(/* webpackChunkName: "about" */ './views/CelveB.vue')
    },
    {
      path: '/serve',
      name: 'serve',
      component: () => import(/* webpackChunkName: "about" */ './views/Serve.vue')
    },
    {
      path: '/servePosition',
      name: 'servePosition',
      component: () => import(/* webpackChunkName: "about" */ './views/ServePosition.vue')
    },
    {
      path: '/login',
      name: 'login',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ './views/Login.vue')
    }
  ]
})
