import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'init',
      component: require('@/pages/Init').default
    },
    {
      path: '/bookdetailed',
      name: 'bookdetailed',
      component: require('@/pages/Book').default
    },
    {
      path: '/bookaccount',
      name: 'bookaccount',
      component: require('@/pages/Account').default
    },
    {
      path: '/bookmanage',
      name: 'bookmanage',
      component: require('@/pages/Manage').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
