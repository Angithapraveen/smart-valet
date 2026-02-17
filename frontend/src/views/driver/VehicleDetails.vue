<template>
<div class="vehicle-details-page">
    <div class="header">
        <button class="back-btn" @click="$router.push('/driver/dashboard')">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <h1>VEHICLE DETAILS</h1>
        <button class="save-text-btn" :disabled="!isDirty || saving" @click="saveChanges">
            {{ saving ? 'Saving...' : 'Save' }}
        </button>
    </div>

    <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
    </div>

    <div v-else class="content">
        <!-- Status Card -->
        <div class="status-card" :class="statusClass">
            <div class="status-left">
                <span class="status-icon" v-if="vehicle.status === 'PARKED'">P</span>
                <span class="status-icon" v-else>R</span>
                <span class="status-text">{{ vehicle.status }}</span>
            </div>
            <span class="time-ago">{{ timeAgo }}</span>
        </div>

        <!-- Ticket Code -->
        <div class="section ticket-section">
            <label>Ticket ID</label>
            <div class="ticket-code">{{ vehicle.valet_id }}</div>
        </div>

        <!-- Customer Info -->
        <div class="section">
            <label>Customer Info</label>
            <div class="info-row">
                <span class="info-label">Name</span>
                <span class="info-value">{{ vehicle.customer_name }}</span>
            </div>
            
        </div>

        <!-- Vehicle Info (Editable) -->
        <div class="section">
            <label>Vehicle Info</label>
            <div class="form-group">
                <label>Car Make & Model</label>
                <input v-model="form.car_model" type="text" class="form-input" placeholder="e.g. Audi A6">
            </div>
            <div class="form-group">
                <label>Category</label>
                <select v-model="form.car_category" class="form-input">
                    <option value="">Select Category</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
            </div>
        </div>

        <!-- Timeline -->
        <div class="section">
            <label>Timeline</label>
            <div class="timeline-row">
                <div>
                    <span class="info-label">Parked At</span>
                    <div class="info-value">{{ formatTime(vehicle.parked_time) }}</div>
                </div>
                <div class="text-right">
                    <span class="info-label">Duration</span>
                    <div class="info-value">{{ duration }}</div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const loading = ref(true);
const saving = ref(false);
const vehicle = ref({});
const form = reactive({
    car_model: '',
    car_category: ''
});

// To track dirty state
const originalForm = reactive({
    car_model: '',
    car_category: ''
});

const isDirty = computed(() => {
    return form.car_model !== originalForm.car_model || form.car_category !== originalForm.car_category;
});

const statusClass = computed(() => {
    return vehicle.value.status === 'PARKED' ? 'status-green' : 'status-orange';
});

const timeAgo = computed(() => {
    if (!vehicle.value.parked_time) return '';
    // Simple "Just now" or specific time logic
    return 'Just now'; // Simplified for demo, implemented real logic if needed
});

const duration = computed(() => {
    if (!vehicle.value.parked_time) return '0m';
    const start = new Date(vehicle.value.parked_time);
    const now = new Date();
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
});

const formatTime = (iso) => {
    if (!iso) return '--:--';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const fetchDetails = async () => {
    try {
        const { valetId } = route.params;
        const response = await axios.get(`${API_URL}/valet/${valetId}`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
            console.log('Vehicle Details Fetched:', response.data.data); // Debug log
            vehicle.value = response.data.data;
            form.car_model = vehicle.value.car_model || '';
            form.car_category = vehicle.value.car_category || '';
            
            originalForm.car_model = form.car_model;
            originalForm.car_category = form.car_category;
        }
    } catch (e) {
        console.error('Fetch Details Error:', e);
        // Show more detailed error
        alert(`Failed to load vehicle details: ${e.response?.data?.message || e.message}`);
        // Do NOT redirect automatically so we can see the error
        // router.push('/driver/dashboard');
    } finally {
        loading.value = false;
    }
};

const saveChanges = async () => {
    if (!isDirty.value) return;
    saving.value = true;
    try {
        const { valetId } = route.params;
        const response = await axios.put(`${API_URL}/valet/${valetId}`, {
            car_model: form.car_model,
            car_category: form.car_category
        }, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        if (response.data.success) {
            alert('Vehicle updated'); // Or Toast
            router.push('/driver/dashboard');
        }
    } catch (e) {
        console.error(e);
        alert('Failed to update vehicle');
    } finally {
        saving.value = false;
    }
};

onMounted(() => {
    fetchDetails();
});
</script>

<style scoped>
.vehicle-details-page {
    max-width: 420px;
    margin: 0 auto;
    background: linear-gradient(180deg, #0b0f1a 0%, #020617 100%);
    min-height: 100vh;
    color: white;
    font-family: 'Inter', sans-serif;
    padding: 20px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-top: 10px;
}

.header h1 {
    font-size: 16px;
    font-weight: 700;
    margin: 0;
    letter-spacing: 1px;
}

.back-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.save-text-btn {
    background: none;
    border: none;
    color: #f59e0b;
    font-weight: 700;
    font-size: 16px;
    cursor: pointer;
}

.save-text-btn:disabled {
    color: #64748b;
    cursor: not-allowed;
}

.content {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.status-card {
    border-radius: 16px;
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.status-green {
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.3);
}

.status-orange {
    background: rgba(245, 158, 11, 0.1);
    border-color: rgba(245, 158, 11, 0.3);
}

.status-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.status-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: white;
    color: black;
    font-weight: 800;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.status-text {
    font-weight: 700;
    font-size: 14px;
    color: white;
}

.time-ago {
    color: #94a3b8;
    font-size: 12px;
}

.section {
    background: #0f172a;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 16px;
}

.section > label {
    display: block;
    color: #94a3b8;
    font-size: 12px;
    text-transform: uppercase;
    margin-bottom: 12px;
    letter-spacing: 0.5px;
}

.ticket-code {
    font-family: 'Courier New', monospace;
    font-size: 16px;
    color: #f59e0b;
    font-weight: 700;
    letter-spacing: 1px;
}

.info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.info-label {
    color: #64748b;
    font-size: 14px;
}

.info-value {
    color: white;
    font-weight: 500;
    font-size: 14px;
}

.separator {
    height: 1px;
    background: rgba(255, 255, 255, 0.05);
    margin: 12px 0;
}

.form-group {
    margin-bottom: 16px;
}

.form-group:last-child {
    margin-bottom: 0;
}

.form-group label {
    display: block;
    color: #94a3b8;
    font-size: 12px;
    margin-bottom: 6px;
}

.form-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 12px;
    border-radius: 12px;
    color: white;
    font-size: 14px;
    outline: none;
}

.form-input:focus {
    border-color: #f59e0b;
}

.timeline-row {
    display: flex;
    justify-content: space-between;
}

.text-right {
    text-align: right;
}

.loading-state {
    display: flex;
    justify-content: center;
    padding: 40px;
}

.spinner {
    width: 24px;
    height: 24px;
    border: 3px solid rgba(245, 158, 11, 0.3);
    border-top-color: #f59e0b;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
</style>
