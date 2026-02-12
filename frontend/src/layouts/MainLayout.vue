<template>
  <div class="main-layout">
    <AppHeader />
    <main class="page-container">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import AppHeader from '../components/AppHeader.vue';
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  background-color: var(--page-bg);
  display: flex;
  flex-direction: column;
}

.page-container {
  flex: 1;
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}
</style>
