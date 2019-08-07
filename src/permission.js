import Vue from 'vue'
import router from './router'
import store from './store'
import { permission } from './api'
// import NProgress from 'nprogress' // progress bar
// import 'nprogress/nprogress.css' // progress bar style
// import notification from 'ant-design-vue/es/notification'
// import { ACCESS_TOKEN } from '@/store/mutation-types'

// NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['login', 'servePosition'] // no redirect whitelist

router.beforeEach((to, from, next) => {
  // NProgress.start() // start progress bar
  if (whiteList.includes(to.name)) {
    // 在免登录白名单，直接进入
    next()
  } else {
    permission()
      .then(res => {
        if (res.success) {
          store.commit('INIT_USER', res.user[0])
          next()
        }
        console.log(res)
        if (!res.success && res.error && res.error === 'login error') {
          next({ path: '/login' })
        }
      })
      .catch(err => {
        console.log(err)
        next({ path: '/login' })
      })
  }
})
