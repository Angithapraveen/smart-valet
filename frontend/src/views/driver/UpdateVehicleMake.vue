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
        <div class="ticket-card justify-center">
            <div class="card-center">
                <span class="label">Ticket ID</span>
                <span class="ticket-id">{{ vehicle.valet_id }}</span>
            </div>
        </div>

        <!-- Update Form -->
        <div class="update-form shadow-premium">
            <div class="form-section">
                <div class="section-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                    <span>Vehicle Information</span>
                </div>

                <div class="form-group" style="position: relative;">
                    <label>Car Brand <span class="required">*</span></label>
                    <div class="input-container">
                        <input 
                            v-model="form.brand" 
                            class="premium-input"
                            placeholder="Type brand name..."
                            autocomplete="off"
                            @input="showBrandSuggestions = true"
                            @focus="showBrandSuggestions = true; $event.target.select()"
                        />
                        <div v-if="showBrandSuggestions && filteredBrands.length" class="custom-suggestions shadow-premium">
                            <div 
                                v-for="brand in filteredBrands" 
                                :key="brand" 
                                class="suggestion-item"
                                @click="selectBrand(brand)"
                            >
                                {{ brand }}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-group" style="position: relative;">
                    <label>Car Model <span class="required">*</span></label>
                    <div class="input-container">
                        <input 
                            v-model="form.model" 
                            class="premium-input"
                            placeholder="Type model name..."
                            autocomplete="off"
                            :disabled="!form.brand"
                            @input="showModelSuggestions = true"
                            @focus="showModelSuggestions = true; $event.target.select()"
                        />
                        <div v-if="showModelSuggestions && filteredModels.length" class="custom-suggestions shadow-premium">
                            <div 
                                v-for="m in filteredModels" 
                                :key="m.model" 
                                class="suggestion-item"
                                @click="selectModel(m)"
                            >
                                {{ m.model }}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label>Plate Number</label>
                    <div class="input-container relative">
                        <input 
                            v-model="form.car_number" 
                            type="text" 
                            class="premium-input" 
                            :class="{ 
                                'valid-input': isValidPlate && form.car_number.length > 5, 
                                'invalid-input': !isValidPlate && form.car_number.length > 5 
                            }"
                            placeholder="TN01AB1234"
                            @input="handlePlateInput"
                        >
                        <div v-if="form.car_number && form.car_number.length > 3" class="input-indicator">
                            <svg v-if="isValidPlate" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </div>
                    </div>
                    <p v-if="!isValidPlate && form.car_number.length > 3" class="error-msg">
                        {{ plateValidationError }}
                    </p>
                </div>

                <!-- Category is automatically identified in the background -->
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
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';
import { useToast } from '../../stores/toast';

import { validateIndianPlate } from '../../utils/plateValidation';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const loading = ref(true);
const saving = ref(false);
const vehicle = ref({});

const form = reactive({
    brand: '',
    model: '',
    tier: '',
    car_number: ''
});

const lastBrand = ref(''); // Track brand to avoid unnecessary clears
const showBrandSuggestions = ref(false);
const showModelSuggestions = ref(false);

const originalForm = reactive({
    brand: '',
    model: '',
    tier: '',
    car_number: ''
});

const plateValidationResult = computed(() => {
    const raw = form.car_number || '';
    const cleaned = raw.replace(/\s+/g, '').toUpperCase();
    return validateIndianPlate(cleaned);
});

const isValidPlate = computed(() => plateValidationResult.value.isValid);
const plateValidationError = computed(() => plateValidationResult.value.error);

const handlePlateInput = (e) => {
    form.car_number = e.target.value.toUpperCase();
};

const brands = ref([]);
const models = ref([]);

const fetchBrands = async () => {
    try {
        const response = await axios.get(`${API_URL}/car-master/brands`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
            brands.value = response.data.data;
        }
    } catch (e) {
        console.error('Failed to fetch brands');
    }
};

const fetchModels = async (brand) => {
    if (!brand) return;
    try {
        const response = await axios.get(`${API_URL}/car-master/models/${brand}`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
            models.value = response.data.data;
        }
    } catch (e) {
        console.error('Failed to fetch models');
    }
};

const filteredBrands = computed(() => {
    if (!form.brand) return brands.value;
    return brands.value.filter(b => b.toLowerCase().includes(form.brand.toLowerCase()));
});

const filteredModels = computed(() => {
    if (!form.model) return models.value;
    return models.value.filter(m => m.model.toLowerCase().includes(form.model.toLowerCase()));
});

const selectBrand = (brand) => {
    form.brand = brand;
    showBrandSuggestions.value = false;
    handleBrandChange();
};

const selectModel = (m) => {
    form.model = m.model;
    showModelSuggestions.value = false;
    handleModelChange();
};

const handleBrandChange = () => {
    // Only clear if the brand actually changed
    if (form.brand !== lastBrand.value) {
        form.model = '';
        form.tier = '';
        lastBrand.value = form.brand;
    }
    fetchModels(form.brand);
};

const handleModelChange = () => {
    const selectedModel = models.value.find(m => m.model === form.model);
    if (selectedModel) {
        form.tier = selectedModel.tier;
    }
};

const isDirty = computed(() => {
    return form.brand !== originalForm.brand || 
           form.model !== originalForm.model ||
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
            // Attempt to split car_model into brand/model if possible
            // For now, we'll leave it empty unless we can match it.
            // A better way would be to have brand/model saved in DB separately.
            form.car_number = (vehicle.value.car_number && vehicle.value.car_number !== 'N/A') ? vehicle.value.car_number : '';
            
            originalForm.brand = form.brand;
            lastBrand.value = form.brand; // Sync lastBrand too
            originalForm.model = form.model;
            originalForm.tier = form.tier;
            originalForm.car_number = form.car_number;

            await fetchBrands();
        }
    } catch (e) {
        toast.error('Failed to load vehicle details');
    } finally {
        loading.value = false;
    }
};

const saveChanges = async () => {
    if (!isDirty.value) return;
    
    // Normalize car number (no spaces)
    const normalizedPlate = form.car_number.replace(/\s+/g, '').toUpperCase();
    
    if (normalizedPlate && !isValidPlate.value) {
        toast.error('Please enter a valid plate number format.');
        return;
    }

    saving.value = true;
    try {
        const { valetId } = route.params;
        const response = await axios.put(`${API_URL}/valet/${valetId}`, {
            brand: form.brand,
            model: form.model,
            tier: form.tier,
            car_number: normalizedPlate
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
    window.addEventListener('click', closeSuggestions);
});

onUnmounted(() => {
    window.removeEventListener('click', closeSuggestions);
});

const closeSuggestions = (e) => {
    if (!e.target.closest('.form-group')) {
        showBrandSuggestions.value = false;
        showModelSuggestions.value = false;
    }
};
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

.ticket-card.justify-center {
    justify-content: center;
    text-align: center;
}

.card-center {
    display: flex;
    flex-direction: column;
    align-items: center;
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

/* Hide the default datalist arrow/indicator */
.premium-input::-webkit-calendar-picker-indicator {
    display: none !important;
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

.tier-display {
    display: flex;
    justify-content: center;
    padding: 10px;
}

.tier-badge {
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.tier-badge.high { background: #fee2e2; color: #ef4444; }
.tier-badge.medium { background: #fef3c7; color: #f59e0b; }
.tier-badge.low { background: #d1fae5; color: #10b981; }
.tier-badge.premium { background: #ede9fe; color: #8b5cf6; }

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

.relative {
    position: relative;
}

.input-indicator {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
}

.valid-input {
    border-color: #10b981 !important;
}

.invalid-input {
    border-color: #ef4444 !important;
}

.error-msg {
    margin-top: 8px;
    font-size: 11px;
    font-weight: 600;
    color: #ef4444;
}

.required {
    color: #ef4444;
    margin-left: 2px;
}

.custom-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    margin-top: 5px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
}

.suggestion-item {
    padding: 12px 16px;
    cursor: pointer;
    color: var(--text-main);
    font-size: 14px;
    border-bottom: 1px solid var(--border-subtle);
}

.suggestion-item:last-child {
    border-bottom: none;
}

.suggestion-item:hover {
    background: var(--bg-main);
    color: var(--primary);
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
