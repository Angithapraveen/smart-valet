<template>
<div class="update-vehicle-page">
    <div class="header">
        <button class="back-btn" @click="$router.push('/driver/dashboard')">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <h1>UPDATE VEHICLE</h1>
        <button class="save-text-btn" :disabled="!isDirty || saving" @click="saveChanges">
            {{ saving ? 'Saving...' : 'Save' }}
        </button>
    </div>

    <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
    </div>

    <div v-else class="content">
        <!-- Ticket ID Card -->
        <div class="ticket-card">
            <div class="card-left">
                <span class="label">Ticket ID</span>
                <span class="ticket-id">{{ vehicle.valet_id }}</span>
            </div>
            <div class="card-right">
                <span class="label">Customer</span>
                <span class="value">{{ vehicle.customer_name }}</span>
            </div>
        </div>

        <!-- Update Form -->
        <div class="update-form shadow-premium">
            <div class="form-section">
                <div class="section-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                    <span>Vehicle Information</span>
                </div>

                <div class="form-group">
                    <label>Car Make & Model</label>
                    <div class="input-container">
                        <input 
                            v-model="form.car_model" 
                            type="text" 
                            class="premium-input" 
                            placeholder="e.g. White Audi A6"
                        >
                    </div>
                </div>

                <div class="form-group">
                    <label>Plate Number</label>
                    <div class="input-container">
                        <input 
                            v-model="form.car_number" 
                            type="text" 
                            class="premium-input" 
                            placeholder="e.g. TN36AP1234"
                            @input="form.car_number = form.car_number.toUpperCase()"
                        >
                    </div>
                </div>

                <div class="form-group">
                    <label>Category</label>
                    <div class="category-grid">
                        <button 
                            v-for="cat in ['High', 'Medium', 'Low']" 
                            :key="cat"
                            class="cat-btn"
                            :class="{ active: form.car_category === cat }"
                            @click="form.car_category = cat"
                        >
                            {{ cat }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="hint-text">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <span>This information helps drivers identify the car quickly.</span>
        </div>
    </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';
import { useToast } from '../../stores/toast';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const loading = ref(true);
const saving = ref(false);
const vehicle = ref({});

const form = reactive({
    car_model: '',
    car_category: '',
    car_number: ''
});

const originalForm = reactive({
    car_model: '',
    car_category: '',
    car_number: ''
});

const isDirty = computed(() => {
    return form.car_model !== originalForm.car_model || 
           form.car_category !== originalForm.car_category ||
           form.car_number !== originalForm.car_number;
});

const fetchDetails = async () => {
    try {
        const { valetId } = route.params;
        const response = await axios.get(`${API_URL}/valet/${valetId}`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
            vehicle.value = response.data.data;
            form.car_model = vehicle.value.car_model || '';
            form.car_category = vehicle.value.car_category || '';
            form.car_number = vehicle.value.car_number || '';
            
            originalForm.car_model = form.car_model;
            originalForm.car_category = form.car_category;
            originalForm.car_number = form.car_number;
        }
    } catch (e) {
        toast.error('Failed to load vehicle details');
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
            car_category: form.car_category,
            car_number: form.car_number
        }, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        if (response.data.success) {
            toast.success('Vehicle info updated');
            router.push('/driver/dashboard');
        }
    } catch (e) {
        toast.error('Failed to update vehicle');
    } finally {
        saving.value = false;
    }
};

onMounted(() => {
    fetchDetails();
});
</script>

<style scoped>
.update-vehicle-page {
    max-width: 450px;
    margin: 0 auto;
    background: var(--bg-main);
    min-height: 100vh;
    color: var(--text-main);
    font-family: 'Inter', sans-serif;
    transition: var(--ts-base);
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border-subtle);
}

.header h1 {
    font-size: 16px;
    font-weight: 800;
    margin: 0;
    letter-spacing: 1px;
    color: var(--text-main);
}

.back-btn {
    background: var(--bg-main);
    border: 1px solid var(--border-subtle);
    color: var(--text-muted);
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--ts-base);
}

.save-text-btn {
    background: none;
    border: none;
    color: var(--primary);
    font-weight: 800;
    font-size: 16px;
    cursor: pointer;
}

.save-text-btn:disabled {
    color: var(--text-muted);
    cursor: not-allowed;
    opacity: 0.5;
}

.content {
    padding: 24px;
}

.ticket-card {
    background: var(--bg-card);
    border-radius: 20px;
    padding: 20px;
    border: 1px solid var(--border-subtle);
    display: flex;
    justify-content: space-between;
    margin-bottom: 24px;
    box-shadow: var(--shadow-md);
}

.ticket-card .label {
    display: block;
    font-size: 10px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px;
}

.ticket-id {
    font-weight: 800;
    color: var(--primary);
    font-size: 18px;
}

.ticket-card .value {
    font-weight: 700;
    font-size: 16px;
    color: var(--text-main);
}

.update-form {
    background: var(--bg-card);
    border-radius: 24px;
    padding: 24px;
    border: 1px solid var(--border-subtle);
    margin-bottom: 24px;
}

.shadow-premium {
    box-shadow: var(--shadow-xl);
}

.section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 24px;
    color: var(--primary);
    font-weight: 700;
    font-size: 14px;
    text-transform: uppercase;
}

.form-group {
    margin-bottom: 24px;
}

.form-group label {
    display: block;
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 10px;
    font-weight: 600;
}

.premium-input {
    width: 100%;
    background: var(--bg-main);
    border: 1px solid var(--border-subtle);
    padding: 16px;
    border-radius: 16px;
    color: var(--text-main);
    font-size: 15px;
    font-weight: 500;
    transition: var(--ts-base);
}

.premium-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 15px rgba(var(--primary-rgb, 101, 69, 229), 0.1);
}

.category-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

.cat-btn {
    padding: 14px;
    border-radius: 14px;
    border: 1px solid var(--border-subtle);
    background: var(--bg-main);
    color: var(--text-muted);
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: var(--ts-base);
}

.cat-btn.active {
    background: var(--primary-light);
    border-color: var(--primary);
    color: var(--primary);
    box-shadow: 0 5px 15px rgba(var(--primary-rgb, 101, 69, 229), 0.1);
}

.hint-text {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-muted);
    font-size: 12px;
    justify-content: center;
}

.loading-state {
    display: flex;
    justify-content: center;
    padding: 100px 0;
}

.spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border-subtle);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
