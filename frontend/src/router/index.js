import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import AdminDashboard from '../views/admin/AdminDashboard.vue';
import OwnerDashboard from '../views/owner/OwnerDashboard.vue';
import ManagerDashboard from '../views/manager/ManagerDashboard.vue';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true }
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, role: 'ADMIN' }
  },
  {
    path: '/owner/dashboard',
    name: 'OwnerDashboard',
    component: OwnerDashboard,
    meta: { requiresAuth: true, role: 'OWNER' }
  },
  {
    path: '/manager/dashboard',
    name: 'ManagerDashboard',
    component: ManagerDashboard,
    meta: { requiresAuth: true, role: 'MANAGER' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;
  const userRole = authStore.userRole;

  // If route requires guest (login page) and user is authenticated
  if (to.meta.requiresGuest && isAuthenticated) {
    // Auto redirect to appropriate dashboard based on role
    if (userRole === 'ADMIN') {
      next('/admin/dashboard');
    } else if (userRole === 'OWNER') {
      next('/owner/dashboard');
    } else if (userRole === 'MANAGER') {
      next('/manager/dashboard');
    } else {
      next('/login');
    }
    return;
  }

  // If route requires authentication
  if (to.meta.requiresAuth) {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      next('/login');
      return;
    }

    // Check role requirement - if role mismatch, redirect to correct dashboard
    if (to.meta.role && userRole !== to.meta.role) {
      // User doesn't have required role, redirect to their dashboard
      if (userRole === 'ADMIN') {
        next('/admin/dashboard');
      } else if (userRole === 'OWNER') {
        next('/owner/dashboard');
      } else if (userRole === 'MANAGER') {
        next('/manager/dashboard');
      } else {
        next('/login');
      }
      return;
    }
  }

  next();
});

export default router;
