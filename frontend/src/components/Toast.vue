<template>
  <div
    v-if="message"
    :class="['toast-item', type]"
    @click="close"
  >
    <div class="toast-icon">
      <svg v-if="type === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <svg v-else-if="type === 'error'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
    </div>
    <div class="toast-content">
      <p class="toast-message">{{ message }}</p>
    </div>
    <button class="toast-close" @click.stop="close">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'success',
    validator: (value) => ['success', 'error', 'info'].includes(value)
  }
})

const emit = defineEmits(['close'])

function close() {
  emit('close')
}
</script>

<style scoped>
.toast-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: var(--bg-card);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border-radius: 16px;
  box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.15), 0 4px 12px -2px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-subtle);
  border-left: 6px solid var(--border-subtle);
  min-width: 320px;
  max-width: 480px;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s var(--ease-out);
}

.toast-item:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.2);
}

.toast-item.success {
  border-left-color: var(--success);
}

.toast-item.error {
  border-left-color: var(--danger);
}

.toast-item.info {
  border-left-color: var(--info);
}

.toast-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success .toast-icon { color: var(--success); }
.error .toast-icon { color: var(--danger); }
.info .toast-icon { color: var(--info); }

.toast-content {
  flex: 1;
}

.toast-message {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.toast-close:hover {
  background: var(--bg-main);
  color: var(--text-main);
}
</style>
