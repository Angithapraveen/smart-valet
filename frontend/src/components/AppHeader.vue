<template>
  <header class="app-header">
    <div class="header-left">
      <div class="logo-container">
        <!-- Parking Icon SVG -->
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="parking-icon">
          <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
          <path d="M9 17V7h4a3 3 0 0 1 0 6H9"></path>
        </svg>
        <span class="app-name">Valet Parking</span>
      </div>
    </div>

    <div class="header-right">
      <div v-if="isOwner && userLocations.length > 0 && $route.path !== '/profile'" class="location-selector-wrapper">
        <select v-model="selectedLocation" @change="handleLocationChange" class="location-dropdown">
          <option v-for="loc in userLocations" :key="loc.location_id" :value="loc.location_id">
            {{ loc.location_name }}
          </option>
        </select>
      </div>

      <div class="user-menu-wrapper" ref="userMenuRef">
        <div class="user-trigger" @click="toggleUserMenu">
          <div class="avatar">{{ userInitial }}</div>
          <span class="username">{{ userName }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron-down">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>

        <div v-if="showUserMenu" class="dropdown-menu">
            <a @click="goToProfile" class="dropdown-item">Profile</a>
            <div class="dropdown-divider"></div>
            <a @click="handleLogout" class="dropdown-item text-danger">Logout</a>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const showUserMenu = ref(false);
const userMenuRef = ref(null);

const userInitial = computed(() => {
  const name = authStore.user?.name || 'U';
  return name.charAt(0).toUpperCase();
});

const userName = computed(() => authStore.user?.name || 'User');
const isOwner = computed(() => authStore.userRole === 'OWNER');
const isManager = computed(() => {
  const role = authStore.userRole ? authStore.userRole.toUpperCase() : '';
  return role === 'MANAGER';
});
const userLocations = computed(() => authStore.accessibleLocations || []);
const selectedLocation = ref(authStore.selectedLocationId || (userLocations.value.length ? userLocations.value[0].location_id : ''));

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
};

const handleLocationChange = () => {
  // Logic to update selected location in store if needed
  // authStore.setSelectedLocation(selectedLocation.value);
};

const goToProfile = () => {
    showUserMenu.value = false;
    router.push('/profile');
}

const handleLogout = () => {
  authStore.logout();
  showUserMenu.value = false;
  router.push('/login');
};

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    showUserMenu.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.app-header {
  height: 64px;
  background-color: #0e0e0e;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.parking-icon {
  color: var(--primary);
  filter: drop-shadow(0 0 8px var(--primary-shadow));
}

.app-name {
    font-family: 'Outfit', sans-serif;
    font-weight: 700;
    font-size: 20px;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, var(--primary), hsl(var(--primary-h), var(--primary-s), 40%));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.location-dropdown {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
  padding: 8px 14px;
  border-radius: 10px;
  outline: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: var(--ts-base);
}

.location-dropdown:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(101, 69, 229, 0.2);
}

.user-menu-wrapper {
  position: relative;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 12px;
  transition: var(--ts-base);
  border: 1px solid transparent;
}

.user-trigger:hover {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.avatar {
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 0 4px 10px var(--primary-shadow);
}

.username {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.chevron-down {
    opacity: 0.5;
    transition: transform 0.2s;
}

.user-trigger:hover .chevron-down {
  transform: translateY(1px);
  opacity: 1;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  background: #1a1a1a;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  min-width: 200px;
  padding: 8px;
  overflow: hidden;
  color: #ffffff;
  z-index: 101;
  border: 1px solid rgba(255, 255, 255, 0.05);
  animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #9ca3af;
  text-decoration: none;
  transition: var(--ts-base);
}

.dropdown-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.dropdown-divider {
  height: 1px;
  background-color: rgba(255, 255, 255, 0.05);
  margin: 6px 0;
}

.text-danger {
  color: var(--danger);
}

.text-danger:hover {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
