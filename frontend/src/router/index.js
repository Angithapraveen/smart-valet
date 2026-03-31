import { createRouter, createWebHistory } from 'vue-router';
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
        component: () => import('../views/admin/AdminDashboard.vue'),
        meta: { role: 'ADMIN' }
      },
      {
        path: 'admin/locations',
        name: 'LocationList',
        component: () => import('../views/admin/LocationList.vue'),
        meta: { role: 'ADMIN' }
      },
      {
        path: 'admin/location/:id',
        name: 'AdminLocationDetails',
        component: () => import('../views/admin/LocationDetails.vue'),
        meta: { role: 'ADMIN' }
      },
      {
        path: 'admin/owners',
        name: 'OwnerList',
        component: () => import('../views/admin/OwnerList.vue'),
        meta: { role: 'ADMIN' }
      },
      {
        path: 'admin/users',
        name: 'UserList',
        component: () => import('../views/admin/UserList.vue'),
        meta: { role: 'ADMIN' }
      },
      // Owner Routes
      {
        path: 'owner/dashboard',
        name: 'OwnerDashboard',
        component: () => import('../views/owner/OwnerDashboard.vue'),
        meta: { role: 'OWNER' }
      },
      {
        path: 'owner/location/:id',
        name: 'OwnerLocationDetails',
        component: () => import('../views/owner/OwnerLocationDetails.vue'),
        meta: { role: 'OWNER' }
      },
      // Manager Routes
      {
        path: 'manager/dashboard',
        name: 'ManagerDashboard',
        component: () => import('../views/manager/ManagerDashboard.vue'),
        meta: { role: 'MANAGER' }
      },
      {
        path: 'manager/parkingstatus',
        name: 'ParkingStatus',
        component: () => import('../views/manager/ParkingStatus.vue'),
        meta: { role: 'MANAGER' }
      },
      {
        path: 'manager/blockmanagement',
        name: 'BlockManagement',
        component: () => import('../views/manager/BlockManagement.vue'),
        meta: { role: 'MANAGER' }
      },
      {
        path: 'manager/users',
        name: 'ManagerUsers',
        component: () => import('../views/manager/Users.vue'),
        meta: { role: 'MANAGER' }
      },
      {
        path: 'manager/livetransactions',
        name: 'LiveTransactions',
        component: () => import('../views/manager/LiveTransactions.vue'),
        meta: { role: 'MANAGER' }
      },
      {
        path: 'manager/returnrequests',
        name: 'ReturnRequests',
        component: () => import('../views/manager/ReturnRequest.vue'),
        meta: { role: 'MANAGER' }
      },
      {
        path: 'manager/vehicles',
        name: 'VehiclesTransactions',
        component: () => import('../views/manager/VehiclesTransactions.vue'),
        meta: { role: 'MANAGER' }
      },
      {
        path: 'manager/reports',
        name: 'ManagerReports',
        component: () => import('../views/manager/Reports.vue'),
        meta: { role: 'MANAGER' }
      },
      {
        path: 'manager/settings',
        name: 'ManagerSettings',
        component: () => import('../views/manager/Settings.vue'),
        meta: { role: 'MANAGER' }
      }
    ]
  },
  {
    path: '/driver/dashboard',
    name: 'DriverDashboard',
    component: () => import('../views/driver/DriverDashboard.vue'),
    meta: { requiresAuth: true, role: 'DRIVER' }
  },
  {
    path: '/driver/profile',
    name: 'DriverProfile',
    component: () => import('../views/driver/DriverProfile.vue'),
    meta: { requiresAuth: true, role: 'DRIVER' }
  },
  {
    path: '/driver/vehicle/:valetId',
    name: 'VehicleDetails',
    component: () => import('../views/driver/VehicleDetails.vue'),
    meta: { requiresAuth: true, role: 'DRIVER' }
  },
  {
    path: '/driver/update-vehicle/:valetId',
    name: 'UpdateVehicleMake',
    component: () => import('../views/driver/UpdateVehicleMake.vue'),
    meta: { requiresAuth: true, role: 'DRIVER' }
  },
  // Public/Guest Route
  {
    path: '/track/:valetId',
    name: 'RequestCar',
    component: () => import('../views/guest/RequestCar.vue')
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
    const role = userRole ? userRole.toUpperCase() : '';
    // Auto redirect to appropriate dashboard based on role
    if (role === 'ADMIN') {
      next('/admin/dashboard');
    } else if (role === 'OWNER') {
      next('/owner/dashboard');
    } else if (role === 'MANAGER') {
      next('/manager/dashboard');
    } else if (role === 'DRIVER') {
      next('/driver/dashboard');
    } else {
      next();
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

    const role = userRole ? userRole.toUpperCase() : '';
    // Check role requirement - if role mismatch, redirect to correct dashboard
    if (to.meta.role && role !== to.meta.role.toUpperCase()) {
      // User doesn't have required role, redirect to their dashboard
      if (role === 'ADMIN') {
        next('/admin/dashboard');
      } else if (role === 'OWNER') {
        next('/owner/dashboard');
      } else if (role === 'MANAGER') {
        next('/manager/dashboard');
      } else if (role === 'DRIVER') {
        next('/driver/dashboard');
      } else {
        next('/login');
      }
      return;
    }
  }

  next();
});

export default router;
