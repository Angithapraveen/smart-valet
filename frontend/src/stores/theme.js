import { defineStore } from 'pinia';
import { ref, onMounted } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  const getStoredTheme = () => {
    try {
      return localStorage.getItem('theme') === 'dark';
    } catch (e) {
      return false;
    }
  };

  const isDark = ref(getStoredTheme());

  const toggleTheme = () => {
    isDark.value = !isDark.value;
    try {
      localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
    } catch (e) {
      console.warn('Failed to persist theme:', e);
    }
    applyTheme();
  };

  const applyTheme = () => {
    if (isDark.value) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  };

  // Initialize theme on store load
  const initTheme = () => {
    applyTheme();
  };

  return {
    isDark,
    toggleTheme,
    initTheme
  };
});
