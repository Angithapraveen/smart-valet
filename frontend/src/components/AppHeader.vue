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
  background-color: #121212;
  border-bottom: 1px solid rgba(255,255,255,0.05);
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
}

.app-name {
    font-weight: 600;
    font-size: 18px;
    letter-spacing: -0.5px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.location-dropdown {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  outline: none;
  cursor: pointer;
  font-size: 14px;
}

.location-dropdown option {
  background-color: #121212;
  color: white;
}

.user-menu-wrapper {
  position: relative;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-trigger:hover {
  background-color: rgba(255,255,255,0.05);
}

.avatar {
  width: 32px;
  height: 32px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 2px 4px var(--primary-shadow);
}

.username {
  font-size: 14px;
  font-weight: 500;
}

.chevron-down {
    opacity: 0.7;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  min-width: 180px;
  padding: 8px 0;
  overflow: hidden;
  color: #333;
  z-index: 101;
  border: 1px solid #eee;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 10px 16px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  text-decoration: none;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background-color: #f5f6fa;
}

.dropdown-divider {
  height: 1px;
  background-color: #eee;
  margin: 4px 0;
}

.text-danger {
  color: var(--status-inactive);
}

.text-danger:hover {
  background-color: #fef2f2;
}
</style>
