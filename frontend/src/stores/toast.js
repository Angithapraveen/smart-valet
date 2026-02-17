/**
 * Toast Notification Store
 * Manages toast notifications globally
 */

import { ref } from 'vue'

export function useToastStore() {
    const toasts = ref([])

    function addToast(message, type = 'success', duration = 3000) {
        const id = Date.now() + Math.random()
        const toast = {
            id,
            message,
            type,
            duration
        }

        toasts.value.push(toast)

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id)
            }, duration)
        }

        return id
    }

    function removeToast(id) {
        const index = toasts.value.findIndex(t => t.id === id)
        if (index > -1) {
            toasts.value.splice(index, 1)
        }
    }

    function success(message, duration = 3000) {
        return addToast(message, 'success', duration)
    }

    function error(message, duration = 4000) {
        return addToast(message, 'error', duration)
    }

    function info(message, duration = 3000) {
        return addToast(message, 'info', duration)
    }

    return {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        info
    }
}

// Global instance
let toastStoreInstance = null

export function useToast() {
    if (!toastStoreInstance) {
        toastStoreInstance = useToastStore()
    }
    return toastStoreInstance
}
