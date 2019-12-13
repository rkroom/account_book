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
      path: '/newdiary',
      name: 'newdiary',
      component: require('@/Pages/NewDiary').default
    },
    {
      path: '/listdiary',
      name: 'listdiary',
      component: require('@/Pages/ListDiary').default
    },
    {
      path: '/goal',
      name: 'goal',
      component: require('@/Pages/Goal').default
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: require('@/Pages/Schedule').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
