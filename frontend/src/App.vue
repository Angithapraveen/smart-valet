<template>
  <div class="app-root">
    <router-view />
    <!-- Global Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useThemeStore } from './stores/theme';
import ToastContainer from './components/ToastContainer.vue';

const themeStore = useThemeStore();

onMounted(() => {
  themeStore.initTheme();
});
</script>


