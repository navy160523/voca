import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '../views/Login.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import Dashboard from '../views/Dashboard.vue'
import WordList from '../views/WordList.vue'
import AddWords from '../views/AddWords.vue'
import Quiz from '../views/Quiz.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard
      },
      {
        path: 'words',
        name: 'WordList',
        component: WordList
      },
      {
        path: 'add',
        name: 'AddWords',
        component: AddWords
      },
      {
        path: 'quiz',
        name: 'Quiz',
        component: Quiz
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = sessionStorage.getItem('voca_auth') === 'true';

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (to.meta.requiresGuest && isAuthenticated) {
    next('/dashboard');
  } else {
    next();
  }
})

export default router
