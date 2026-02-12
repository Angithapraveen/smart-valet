import { createRouter, createWebHistory } from 'vue-router';

import AdminDashboard from '../views/admin/AdminDashboard.vue';
import AddLocation from '../views/admin/AddLocation.vue';
import LocationList from '../views/admin/LocationList.vue';
import AddOwner from '../views/admin/AddOwner.vue';
import OwnerList from '../views/admin/OwnerList.vue';
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
    component: () => import('../views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue')
      },
      // Admin Routes
      {
        path: 'admin/dashboard',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: { role: 'ADMIN' }
      },
      {
        path: 'admin/location/add',
        name: 'AddLocation',
        component: AddLocation,
        meta: { role: 'ADMIN' }
      },
      {
        path: 'admin/locations',
        name: 'LocationList',
        component: LocationList,
        meta: { role: 'ADMIN' }
      },
      {
        path: 'admin/location/:id',
        name: 'LocationDetails',
        component: () => import('../views/admin/LocationDetails.vue'),
        meta: { role: 'ADMIN' }
      },
      {
        path: 'admin/owner/add',
        name: 'AddOwner',
        component: AddOwner,
        meta: { role: 'ADMIN' }
      },
      {
        path: 'admin/owners',
        name: 'OwnerList',
        component: OwnerList,
        meta: { role: 'ADMIN' }
      },
      // Owner Routes
      {
        path: 'owner/dashboard',
        name: 'OwnerDashboard',
        component: OwnerDashboard,
        meta: { role: 'OWNER' }
      },
      // Manager Routes
      {
        path: 'manager/dashboard',
        name: 'ManagerDashboard',
        component: ManagerDashboard,
        meta: { role: 'MANAGER' }
      }
    ]
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
