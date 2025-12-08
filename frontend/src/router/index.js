/**
 * Vue Router Configuration
 *
 * Defines application routes and navigation guards.
 *
 * @module router
 */

import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@stores/auth';

// Lazy-loaded views for code splitting
const LoginView = () => import('@views/LoginView.vue');
const DashboardView = () => import('@views/DashboardView.vue');
const AdminDashboardView = () => import('@views/AdminDashboardView.vue');
const AdminView = () => import('@views/AdminView.vue');
const StationView = () => import('@views/StationView.vue');
const PlatformView = () => import('@views/PlatformView.vue');
const InstrumentView = () => import('@views/InstrumentView.vue');
const NotFoundView = () => import('@views/NotFoundView.vue');

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false, title: 'Login' }
  },
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true, title: 'Dashboard' }
  },
  {
    // Alias for dashboard - supports /dashboard URL
    path: '/dashboard',
    redirect: '/'
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminDashboardView,
    meta: { requiresAuth: true, requiresAdmin: true, title: 'Admin Dashboard' }
  },
  {
    path: '/admin/settings',
    name: 'admin-settings',
    component: AdminView,
    meta: { requiresAuth: true, requiresAdmin: true, title: 'Admin Settings' }
  },
  {
    path: '/stations/:acronym',
    name: 'station',
    component: StationView,
    props: true,
    meta: { requiresAuth: true, title: 'Station' }
  },
  {
    path: '/platforms/:id',
    name: 'platform',
    component: PlatformView,
    props: route => ({ id: Number(route.params.id) }),
    meta: { requiresAuth: true, title: 'Platform' }
  },
  {
    path: '/instruments/:id',
    name: 'instrument',
    component: InstrumentView,
    props: route => ({ id: Number(route.params.id) }),
    meta: { requiresAuth: true, title: 'Instrument' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { requiresAuth: false, title: 'Not Found' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  }
});

// Navigation guard for authentication and authorization
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Set page title
  document.title = to.meta.title
    ? `${to.meta.title} | SITES Spectral`
    : 'SITES Spectral';

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Store intended destination
    authStore.setRedirectPath(to.fullPath);
    next({ name: 'login' });
    return;
  }

  // Check if route requires admin role
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ name: 'dashboard' });
    return;
  }

  // Redirect authenticated users away from login
  if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'dashboard' });
    return;
  }

  next();
});

export default router;
