<template>
<div class="request-car-page">
    <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading status...</p>
    </div>

    <div v-else-if="error" class="error-state">
        <div class="error-icon">!</div>
        <h3>{{ error }}</h3>
        <p>Please scan the QR code again or contact the valet desk.</p>
    </div>

    <div v-else class="content">
        <div class="header">
            <h1>SMART VALET</h1>
            <p class="subtitle">Vehicle Status Tracker</p>
        </div>

        <div class="ticket-card">
            <div class="ticket-label">TICKET ID</div>
            <div class="ticket-id">{{ vehicle.valet_id }}</div>
            <div class="customer-name">{{ vehicle.customer_name }}</div>
            <div class="car-model">{{ vehicle.car_model || 'Vehicle' }}</div>
        </div>

        <div class="status-container">
            <div class="status-indicator" :class="statusClass">
                <div class="status-dot"></div>
                <span class="status-text">{{ statusText }}</span>
            </div>
            <p class="status-desc">{{ statusDescription }}</p>
        </div>

        <div class="action-area">
            <button 
                v-if="vehicle.status === 'PARKED'" 
                class="request-btn" 
                @click="requestReturn" 
                :disabled="requesting"
            >
                {{ requesting ? 'Requesting...' : 'REQUEST CAR DELIVERY' }}
            </button>

            <div v-else-if="vehicle.status === 'RETURN_REQUESTED'" class="info-box">
                <p>We have received your request.</p>
                <p class="highlight">A driver will bring your car shortly.</p>
            </div>

            <div v-else-if="vehicle.status === 'READY'" class="info-box success">
                <p>Your car is ready!</p>
                <p class="highlight">Please proceed to the pickup point.</p>
            </div>
        </div>

        <div class="refresh-note">
            Status updates automatically
        </div>
    </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from '../../stores/toast';
import axios from 'axios';

const route = useRoute();
const toast = useToast();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const loading = ref(true);
const error = ref(null);
const vehicle = ref({});
const requesting = ref(false);
let pollInterval = null;

const statusClass = computed(() => {
    switch (vehicle.value.status) {
        case 'PARKED': return 'status-parked';
        case 'RETURN_REQUESTED': return 'status-requested';
        case 'READY': return 'status-ready';
        case 'RETURNED': return 'status-returned';
        default: return 'status-unknown';
    }
});

const statusText = computed(() => {
    switch (vehicle.value.status) {
        case 'PARKED': return 'PARKED SECURELY';
        case 'RETURN_REQUESTED': return 'RETRIEVAL IN PROGRESS';
        case 'READY': return 'READY FOR PICKUP';
        case 'RETURNED': return 'COMPLETED';
        default: return vehicle.value.status;
    }
});

const statusDescription = computed(() => {
    switch (vehicle.value.status) {
        case 'PARKED': return 'Your vehicle is parked securely. Tap the button below when you are ready to leave.';
        case 'RETURN_REQUESTED': return 'Our valet driver is retrieving your vehicle. Please wait at the pickup area.';
        case 'READY': return 'Your vehicle is waiting for you at the valet desk.';
        case 'RETURNED': return 'Thank you for visiting. Have a safe drive!';
        default: return '';
    }
});

const fetchStatus = async () => {
    try {
        const { valetId } = route.params;
        // Public endpoint
        const response = await axios.get(`${API_URL}/valet/status/${valetId}`);
        if (response.data.success) {
            vehicle.value = response.data.data;
            error.value = null;
        }
    } catch (e) {
        console.error('Fetch Status Error:', e);
        if (loading.value) { // Only show error if initial load fails
            error.value = e.response?.data?.message || 'Failed to load ticket details.';
        }
    } finally {
        loading.value = false;
    }
};

const requestReturn = async () => {
    if (requesting.value) return;
    
    if (!confirm('Are you sure you want to request your car now?')) return;

    requesting.value = true;
    try {
        const { valetId } = route.params;
        // Public endpoint
        const response = await axios.post(`${API_URL}/valet/request-return/${valetId}`);
        if (response.data.success) {
            vehicle.value = response.data.data; // Update local state immediately
            toast.success('Request sent! A driver will be assigned shortly.');
        }
    } catch (e) {
        console.error('Request Return Error:', e);
        toast.error('Failed to send request. Please try again or contact the desk.');
    } finally {
        requesting.value = false;
    }
};

onMounted(() => {
    fetchStatus();
    // Poll every 5 seconds for updates
    pollInterval = setInterval(fetchStatus, 5000);
});

onUnmounted(() => {
    if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>
.request-car-page {
    max-width: 480px;
    margin: 0 auto;
    background: var(--bg-main);
    min-height: 100vh;
    color: var(--text-main);
    font-family: 'Inter', sans-serif;
    padding: 24px;
    display: flex;
    flex-direction: column;
    transition: var(--ts-base);
}

.header {
    text-align: center;
    margin-bottom: 32px;
    margin-top: 20px;
}

.header h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: 2px;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark, var(--primary)) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.subtitle {
    margin: 4px 0 0;
    color: var(--text-muted);
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.ticket-card {
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: 20px;
    padding: 24px;
    text-align: center;
    margin-bottom: 32px;
    box-shadow: var(--shadow-md);
}

.ticket-label {
    font-size: 12px;
    color: #64748b;
    letter-spacing: 1px;
    margin-bottom: 8px;
}

.ticket-id {
    font-family: 'Outfit', monospace;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 16px;
    letter-spacing: 1px;
}

.customer-name {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 4px;
}

.car-model {
    color: var(--text-muted);
    font-size: 14px;
}

.status-container {
    text-align: center;
    margin-bottom: 40px;
}

.status-indicator {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    border-radius: 50px;
    margin-bottom: 16px;
    border: 1px solid;
}

.status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 10px currentColor;
    animation: pulse 2s infinite;
}

.status-text {
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.5px;
}

.status-parked {
    color: var(--success);
    background: var(--success-light);
    border-color: var(--success-border, var(--success-light));
}

.status-requested {
    color: var(--warning);
    background: var(--warning-light);
    border-color: var(--warning-border, var(--warning-light));
}

.status-ready {
    color: var(--primary);
    background: var(--primary-light);
    border-color: var(--primary-border, var(--primary-light));
}

.status-returned {
    color: var(--text-muted);
    background: var(--bg-main);
    border-color: var(--border-subtle);
}

.status-desc {
    color: #94a3b8;
    font-size: 14px;
    line-height: 1.5;
    max-width: 300px;
    margin: 0 auto;
}

.action-area {
    margin-top: auto;
    margin-bottom: 32px;
}

.request-btn {
    width: 100%;
    padding: 18px;
    background: linear-gradient(135deg, var(--warning) 0%, var(--warning-dark, var(--warning)) 100%);
    border: none;
    border-radius: 16px;
    color: white;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: var(--shadow-md);
    transition: transform 0.2s, box-shadow 0.2s;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.request-btn:active {
    transform: scale(0.98);
    box-shadow: 0 5px 10px rgba(245, 158, 11, 0.2);
}

.request-btn:disabled {
    background: var(--bg-main);
    color: var(--text-muted);
    cursor: not-allowed;
    box-shadow: none;
    border: 1px solid var(--border-subtle);
}

.info-box {
    background: var(--bg-card);
    padding: 20px;
    border-radius: 16px;
    text-align: center;
    border: 1px solid var(--border-subtle);
}

.info-box p {
    margin: 0;
    font-size: 14px;
    color: #94a3b8;
}

.info-box .highlight {
    font-size: 16px;
    font-weight: 600;
    color: white;
    margin-top: 8px;
}

.info-box.success {
    background: var(--primary-light);
    border: 1px solid var(--primary-border, var(--primary));
}

.refresh-note {
    text-align: center;
    font-size: 12px;
    color: var(--text-muted);
}

/* Loading & Error */
.loading-state, .error-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--border-subtle);
    border-left-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
}

.error-icon {
    width: 60px;
    height: 60px;
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 16px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

@keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.5); opacity: 0.5; }
    100% { transform: scale(1); opacity: 1; }
}
</style>
