<template>
  <div class="main-layout">
    <AppHeader />
    <div class="layout-body" :class="{ 'has-sidebar': isManager }">
      <SideBar v-if="isManager" />
      <main class="page-container">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import AppHeader from '../components/AppHeader.vue';
import SideBar from '../components/SideBar.vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const isManager = computed(() => {
  const role = authStore.userRole ? authStore.userRole.toUpperCase() : '';
  return role === 'MANAGER';
});
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  background-color: var(--bg-main);
  display: flex;
  flex-direction: column;
}

.layout-body {
  display: flex;
  flex: 1;
  position: relative;
}

.has-sidebar .page-container {
  margin-left: 260px;
}

.page-container {
  flex: 1;
  padding: 40px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
  transition: margin-left 0.3s var(--ease-out);
}

@media (max-width: 1280px) {
  .page-container {
    padding: 24px;
  }
}

@media (max-width: 1024px) {
  .has-sidebar .page-container {
    margin-left: 0;
  }
}
</style>
