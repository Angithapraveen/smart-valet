<template>
  <div class="toast-container">
    <TransitionGroup name="toast" tag="div" class="toast-list">
      <Toast
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        :message="toast.message"
        :type="toast.type"
        @close="toastStore.removeToast(toast.id)"
      />
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToast } from '../stores/toast'
import Toast from './Toast.vue'

const toastStore = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  pointer-events: none;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
}

.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  transform: translateX(100%) scale(0.9);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.toast-move {
  transition: transform 0.4s ease;
}
</style>
