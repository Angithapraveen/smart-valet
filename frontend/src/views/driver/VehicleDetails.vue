<template>
<div class="vehicle-details-page">
    <div class="header">
        <button class="back-btn" @click="handleBackClick">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <div class="header-title">
            <span v-if="vehicle.key_slot" class="car-key-badge">KEYSLOT: {{ formatKeySlot(vehicle.key_slot) }}</span>
        </div>
        <div class="status-badge-top" :class="statusClass">{{ vehicle.status }}</div>
    </div>

    <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
    </div>

    <div v-else class="content">
        <!-- Quick Info Banner -->
        <div class="info-banner">

            <div class="info-item">
                <span class="label">Parked At</span>
                <span class="value">{{ formatTime(vehicle.parked_time) }}</span>
            </div>
            <div class="info-item">
                <span class="label">Parked Duration</span>
                <span class="value" style="color: var(--warning);">{{ getDuration(vehicle.parked_time) }}</span>
            </div>
            <div class="info-item">
                <span class="label">Make / Plate</span>
                <span class="value">{{ vehicle.car_model || 'Unknown Model' }} {{ (vehicle.car_number && vehicle.car_number !== 'N/A') ? '[' + vehicle.car_number + ']' : '' }}</span>
            </div>
            <div class="info-item" v-if="vehicle.key_slot">
                <span class="label">KeySlot</span>
                <span class="value key-highlight">{{ formatKeySlot(vehicle.key_slot) }}</span>
            </div>
            <div class="info-item" v-if="vehicle.return_requested_time">
                <span class="label">Requested At</span>
                <span class="value">{{ formatTime(vehicle.return_requested_time) }}</span>
            </div>
            <div class="info-item" v-if="vehicle.return_requested_time">
                <span class="label">Requested For</span>
                <span class="value" style="color: var(--danger);">{{ getDuration(vehicle.return_requested_time) }}</span>
            </div>
        </div>

        <!-- Update Status Section -->
        <div class="status-update-section">
            <div class="section-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
                <h2>Update Status</h2>
            </div>

            <!-- Ownership Warning -->
            <div v-if="isAssignedToOther" class="ownership-warning">
                This request has been accepted by another driver.
            </div>

            <div class="timeline">
                <!-- Status: PARKED (Always Completed) -->
                <div class="timeline-item completed">
                    <div class="node"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                    <div class="connector active"></div>
                    <div class="status-info">
                        <p class="s-title text-green">Parked</p>
                        <p class="s-meta">Completed</p>
                    </div>
                </div>

                <!-- Status: RETURN_REQUESTED -->
                <div class="timeline-item" :class="getStatusItemClass('RETURN_REQUESTED')">
                    <div class="node">
                        <svg v-if="isCompleted('RETURN_REQUESTED')" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    </div>
                    <div class="connector" :class="{ active: isCompleted('RETURN_REQUESTED') }"></div>
                    <div class="status-info">
                        <p class="s-title">Return Requested</p>
                        <p class="s-meta">{{ isCurrent('RETURN_REQUESTED') ? 'Current Status' : (isCompleted('RETURN_REQUESTED') ? 'Completed' : '') }}</p>
                    </div>
                </div>

                <!-- NEXT ACTION: ON THE WAY -->
                <div v-if="isCurrent('RETURN_REQUESTED')" class="next-action-card">
                    <div class="action-icon car-glow">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                    </div>
                    <button class="action-btn" @click="updateStatus('ON_THE_WAY')" :disabled="updating || isAssignedToOther">
                        <span class="action-label">NEXT ACTION</span>
                        <span class="action-text">{{ updating ? 'PROSESSING...' : 'ON THE WAY' }}</span>
                    </button>
                    <div class="connector"></div>
                </div>

                <!-- Status: ON_THE_WAY -->
                <div class="timeline-item" :class="getStatusItemClass('ON_THE_WAY')" v-if="!isCurrent('RETURN_REQUESTED') || isCompleted('ON_THE_WAY')">
                    <div class="node">
                        <svg v-if="isCompleted('ON_THE_WAY')" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                    </div>
                    <div class="connector" :class="{ active: isCompleted('ON_THE_WAY') }"></div>
                    <div class="status-info">
                        <p class="s-title">On The Way</p>
                        <p class="s-meta">{{ isCurrent('ON_THE_WAY') ? 'Current Status' : (isCompleted('ON_THE_WAY') ? 'Completed' : '') }}</p>
                    </div>
                </div>

                <!-- NEXT ACTION: READY -->
                <div v-if="isCurrent('ON_THE_WAY')" class="next-action-card">
                    <div class="action-icon ready-glow">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                    <button class="action-btn btn-ready" @click="updateStatus('READY')" :disabled="updating || isAssignedToOther">
                        <span class="action-label">NEXT ACTION</span>
                        <span class="action-text">{{ updating ? 'PROSESSING...' : 'READY' }}</span>
                    </button>
                    <div class="connector"></div>
                </div>

                <!-- Status: READY -->
                <div class="timeline-item" :class="getStatusItemClass('READY')" v-if="!isCurrent('ON_THE_WAY') || isCompleted('READY')">
                    <div class="node">
                        <svg v-if="isCompleted('READY')" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                    </div>
                    <div class="connector" :class="{ active: isCompleted('READY') }"></div>
                    <div class="status-info">
                        <p class="s-title">Ready</p>
                        <p class="s-meta">{{ isCurrent('READY') ? 'Current Status' : (isCompleted('READY') ? 'Completed' : '') }}</p>
                    </div>
                    <div class="lock-icon" v-if="!isCompleted('READY') && !isCurrent('READY')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </div>
                </div>

                <!-- NEXT ACTION: RETURNED OR REPARKED -->
                <div v-if="isCurrent('READY')" class="next-action-card dual-action">
                   
                    <div class="button-group">
                        <button class="action-btn btn-returned" @click="handleReturnedClick" :disabled="updating || isAssignedToOther || !isDriver">
                            <span class="action-label">SUCCESS</span>
                            <span class="action-text">{{ updating ? '...' : 'RETURNED' }}</span>
                        </button>
                        <button class="action-btn btn-repark" @click="handleReparkClick" :disabled="updating || isAssignedToOther">
                            <span class="action-label">LATE</span>
                            <span class="action-text">{{ updating ? '...' : 'REPARK' }}</span>
                        </button>
                    </div>
                    <div class="connector"></div>
                </div>

                <!-- Status: RETURNED -->
                <div class="timeline-item" :class="getStatusItemClass('RETURNED')" v-if="!isCurrent('READY') || isCompleted('RETURNED')">
                    <div class="node">
                        <svg v-if="isCompleted('RETURNED')" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="16 12 12 8 8 12"></polyline><line x1="12" y1="16" x2="12" y2="8"></line></svg>
                    </div>
                    <div class="status-info">
                        <p class="s-title">Returned</p>
                        <p class="s-meta">{{ isCurrent('RETURNED') ? 'Current Status' : (isCompleted('RETURNED') ? 'Completed' : '') }}</p>
                    </div>
                    <div class="lock-icon" v-if="!isCompleted('RETURNED') && !isCurrent('RETURNED')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </div>
                </div>
            </div>

            <!-- Footer Hint -->
            <div class="timeline-footer">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                <span>Tap the highlighted step to progress forward</span>
            </div>
        </div>
    </div>

    <!-- Missing Data Modal -->
    <div v-if="showMissingDataModal" class="modal-overlay">
        <div class="modal-card">
            <h3>Update Vehicle Details</h3>
            <p>Please enter the vehicle details before marking as returned.</p>
            
            <div class="form-group" style="position: relative;">
                <label>Car Brand <span class="required">*</span></label>
                <div class="input-container">
                    <input 
                        v-model="missingDataForm.brand" 
                        class="form-input" 
                        placeholder="Search Brand..."
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

            <div class="form-group" v-if="missingDataForm.brand" style="position: relative;">
                <label>Car Model <span class="required">*</span></label>
                <div class="input-container">
                    <input 
                        v-model="missingDataForm.model" 
                        class="form-input" 
                        placeholder="Search Model..."
                        autocomplete="off"
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
                <input v-model="missingDataForm.car_number" type="text" class="form-input" placeholder="e.g. TN36AP1234" @input="missingDataForm.car_number = missingDataForm.car_number.toUpperCase()">
            </div>
            
            <!-- Category is handled in the background -->
            
            <div class="modal-actions">
                <button class="cancel-btn" @click="showMissingDataModal = false" :disabled="savingMissingData">Cancel</button>
                <button class="confirm-btn" @click="saveMissingData" :disabled="savingMissingData || !missingDataForm.model">{{ savingMissingData ? 'Saving...' : 'Save & Return' }}</button>
            </div>
        </div>
    </div>

    <!-- REPARK CONFIRMATION MODAL -->
    <div v-if="showReparkConfirm" class="modal-overlay">
        <div class="modal-card">
            <div class="modal-header-icon repark-icon-wrap">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
            </div>
            <h3>Confirm Repark</h3>
            <p>Are you sure you want to repark this vehicle? This will allocate a <strong>NEW KEY SLOT</strong> for the valet key.</p>
            
            <div class="modal-actions-stack">
                <button class="primary-btn repark-confirm-btn" @click="confirmRepark" :disabled="updating">
                    {{ updating ? 'PROCESSING...' : 'CONFIRM REPARK ' }}
                </button>
                <button class="secondary-btn" @click="showReparkConfirm = false" :disabled="updating">CANCEL</button>
            </div>
        </div>
    </div>

    <!-- REPARK SUCCESS MODAL -->
    <div v-if="showReparkSuccess" class="modal-overlay">
        <div class="modal-card success-card">
            <div class="modal-header-icon success-icon-wrap">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3>Vehicle Reparked</h3>
            <p>The key has been successfully allocated to slot:</p>
            
            <div class="allocated-slot-display">
                <span class="slot-label">NEW KEY SLOT</span>
                <span class="slot-number">{{ formatKeySlot(allocatedKeySlot) }}</span>
            </div>
            
            <p class="slot-hint">Please place the key in the cabinet slot {{ formatKeySlot(allocatedKeySlot) }}.</p>
            
            <button class="confirm-btn full-width" @click="goToDashboard">DASHBOARD</button>
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

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const loading = ref(true);
const updating = ref(false);
const vehicle = ref({});
const currentTime = ref(new Date());

const showMissingDataModal = ref(false);
const showReparkConfirm = ref(false);
const showReparkSuccess = ref(false);
const allocatedKeySlot = ref(null);

const missingDataForm = reactive({
    brand: '',
    model: '',
    car_model: '',
    car_category: '',
    car_number: ''
});
const savingMissingData = ref(false);
const lastBrand = ref(''); // Track brand to avoid unnecessary clears
const showBrandSuggestions = ref(false);
const showModelSuggestions = ref(false);
const brands = ref([]);
const models = ref([]);

const fetchBrands = async () => {
    try {
        const res = await axios.get(`${API_URL}/car-master/brands`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (res.data.success) brands.value = res.data.data;
    } catch (e) { console.error('Failed to fetch brands'); }
};

const filteredBrands = computed(() => {
    if (!missingDataForm.brand) return brands.value;
    return brands.value.filter(b => b.toLowerCase().includes(missingDataForm.brand.toLowerCase()));
});

const filteredModels = computed(() => {
    if (!missingDataForm.model) return models.value;
    return models.value.filter(m => m.model.toLowerCase().includes(missingDataForm.model.toLowerCase()));
});

const selectBrand = (brand) => {
    missingDataForm.brand = brand;
    showBrandSuggestions.value = false;
    handleBrandChange();
};

const selectModel = (m) => {
    missingDataForm.model = m.model;
    showModelSuggestions.value = false;
    handleModelChange();
};

const handleBrandChange = async (preservedModel) => {
    if (!preservedModel && missingDataForm.brand !== lastBrand.value) {
        missingDataForm.model = '';
        missingDataForm.car_category = '';
    }
    if (missingDataForm.brand) {
        lastBrand.value = missingDataForm.brand;
    }
    if (!missingDataForm.brand) return;
    try {
        const res = await axios.get(`${API_URL}/car-master/models/${missingDataForm.brand}`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (res.data.success) {
            models.value = res.data.data;
            if (preservedModel) {
                missingDataForm.model = preservedModel;
                // Once model is set from preserved, also identify category
                const selected = models.value.find(m => m.model === preservedModel);
                if (selected) {
                    missingDataForm.car_category = selected.tier || selected.category;
                }
            }
        }
    } catch (e) { console.error('Failed to fetch models'); }
};

const handleModelChange = () => {
    const selected = models.value.find(m => m.model === missingDataForm.model);
    if (selected) {
        missingDataForm.car_category = selected.tier || selected.category;
        missingDataForm.car_model = `${missingDataForm.brand} ${missingDataForm.model}`;
    }
};

const isDriver = computed(() => {
    return authStore.user?.role_name === 'DRIVER' || authStore.user?.role === 'DRIVER';
});

const isActivelyWorkingOnIt = computed(() => {
    return vehicle.value.returned_driver_id === authStore.user?.user_id && ['ON_THE_WAY', 'READY'].includes(vehicle.value.status?.toUpperCase());
});

const handleBackClick = () => {
    if (isActivelyWorkingOnIt.value) {
        toast.error('Complete the current return request first.');
    } else {
        router.push('/driver/dashboard');
    }
};

const handleReturnedClick = () => {
    if (!isDriver.value) {
        toast.error('Only drivers can mark a vehicle as returned.');
        return;
    }

    const { car_model, car_category, car_number } = vehicle.value;
    // Check if critical info is missing: unknown car model or missing category
    const isMissingInfo = !car_model || car_model === 'Unknown Model' || !car_category;
    
    if (isMissingInfo) {
        // Prepare form with existing data if any
        // Attempt to pre-fill brand/model if present
        if (car_model && car_model !== 'Unknown Model') {
            const matchedBrand = brands.value.find(b => car_model.startsWith(b));
            if (matchedBrand) {
                missingDataForm.brand = matchedBrand;
                const extractedModel = car_model.replace(matchedBrand, '').trim();
                handleBrandChange(extractedModel); // Pass model to preserve it
            } else {
                missingDataForm.brand = '';
                missingDataForm.model = '';
            }
        } else {
            missingDataForm.brand = '';
            missingDataForm.model = '';
        }
        missingDataForm.car_model = car_model && car_model !== 'Unknown Model' ? car_model : '';
        missingDataForm.car_category = car_category || '';
        missingDataForm.car_number = (car_number && car_number !== 'N/A') ? car_number : '';
        showMissingDataModal.value = true;
    } else {
        updateStatus('RETURNED');
    }
};

const saveMissingData = async () => {
    // Brand/Model are preferred but we only strictly NEED car_model for the update to happen if selected.
    // If brand/model are selected, handleModelChange already populated car_model and car_category.
    if (!missingDataForm.car_model || !missingDataForm.car_category) {
        toast.error('Please select both Brand and Model.');
        return;
    }

    savingMissingData.value = true;
    try {
        const { valetId } = route.params;
        const response = await axios.put(`${API_URL}/valet/${valetId}`, {
            brand: missingDataForm.brand,
            model: missingDataForm.model,
            car_model: missingDataForm.car_model,
            tier: missingDataForm.car_category,
            car_number: missingDataForm.car_number || 'N/A'
        }, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        if (response.data.success) {
            toast.success('Vehicle info updated');
            vehicle.value = response.data.data;
            showMissingDataModal.value = false;
            updateStatus('RETURNED');
        }
    } catch (e) {
        toast.error('Failed to update vehicle data');
    } finally {
        savingMissingData.value = false;
    }
};

const statusClass = computed(() => {
    switch (vehicle.value.status) {
        case 'PARKED': return 'badge-parked';
        case 'RETURN_REQUESTED': return 'badge-warning';
        case 'ON_THE_WAY': return 'badge-info';
        case 'READY': return 'badge-primary';
        case 'RETURNED': return 'badge-success';
        default: return '';
    }
});

const isAssignedToOther = computed(() => {
    return vehicle.value.returned_driver_id && vehicle.value.returned_driver_id !== authStore.user?.user_id;
});

const statusOrder = ['PARKED', 'RETURN_REQUESTED', 'ON_THE_WAY', 'READY', 'RETURNED'];

const isCompleted = (status) => {
    const currentIndex = statusOrder.indexOf(vehicle.value.status);
    const targetIndex = statusOrder.indexOf(status);
    return currentIndex > targetIndex;
};

const isCurrent = (status) => {
    return vehicle.value.status === status;
};

const getStatusItemClass = (status) => {
    if (isCompleted(status)) return 'completed';
    if (isCurrent(status)) return 'current';
    return 'locked';
};

const formatTime = (iso) => {
    if (!iso) return '--:--';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatKeySlot = (id) => {
    if (!id) return '';
    return id.toString().padStart(3, '0');
};

const getDuration = (startTime) => {
    if (!startTime) return '---';
    const start = new Date(startTime).getTime();
    const diffMs = currentTime.value.getTime() - start;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
        return `${diffMins || 1} min`;
    }
    
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (mins === 0) return `${hrs} hr`;
    return `${hrs} hr ${mins} mins`;
};

const handleReparkClick = () => {
    showReparkConfirm.value = true;
};

const confirmRepark = async () => {
    updating.value = true;
    try {
        const { valetId } = route.params;
        const response = await axios.put(`${API_URL}/valet/status/${valetId}`, {
            status: 'PARKED'
        }, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        if (response.data.success) {
            allocatedKeySlot.value = response.data.data.key_slot;
            showReparkConfirm.value = false;
            showReparkSuccess.value = true;
        }
    } catch (e) {
        console.error('Repark error:', e);
        toast.error(`Repark failed: ${e.response?.data?.message || e.message}`);
    } finally {
        updating.value = false;
    }
};

const goToDashboard = () => {
    showReparkSuccess.value = false;
    router.push('/driver/dashboard');
};

const fetchDetails = async () => {
    try {
        const { valetId } = route.params;
        const response = await axios.get(`${API_URL}/valet/${valetId}`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
            vehicle.value = response.data.data;
        }
    } catch (e) {
        toast.error(`Failed to load vehicle details: ${e.response?.data?.message || e.message}`);
    } finally {
        loading.value = false;
    }
};

const updateStatus = async (newStatus) => {
    if (updating.value) return;
    updating.value = true;
    try {
        const { valetId } = route.params;
        const response = await axios.put(`${API_URL}/valet/status/${valetId}`, {
            status: newStatus
        }, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        if (response.data.success) {
            toast.success(`Status updated to ${newStatus}`);
            vehicle.value = response.data.data;
            if (newStatus === 'RETURNED' || newStatus === 'PARKED') {
                router.push('/driver/dashboard');
            }
        }
    } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to update status');
    } finally {
        updating.value = false;
    }
};

onMounted(() => {
    fetchDetails();
    fetchBrands();
    window.addEventListener('click', closeSuggestions);
    // Update current time every minute
    setInterval(() => {
        currentTime.value = new Date();
    }, 1000 * 60);
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
.vehicle-details-page {
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

.header-title {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.ticket-id {
    font-size: 14px;
    font-weight: 700;
    color: var(--primary);
    letter-spacing: 0.5px;
}

.car-info-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.car-make {
    font-size: 13px;
    color: var(--text-muted);
    font-weight: 500;
}

.car-plate-badge {
    padding: 1px 6px;
    border-radius: 4px;
}
.car-key-badge {
    background: #1e293b;
    color: #38bdf8;
    font-family: 'Outfit', sans-serif;
    font-weight: 800;
    font-size: 14px;
    padding: 6px 16px;
    border-radius: 10px;
    border: 1.5px solid #334155;
    letter-spacing: 0.05em;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.status-badge-top {
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
}

.badge-parked { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
.badge-warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
.badge-info { background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); }
.badge-primary { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.3); }
.badge-success { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); }

.content {
    padding: 20px;
}

.info-banner {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    background: var(--bg-card);
    border-radius: 16px;
    padding: 16px;
    border: 1px solid var(--border-subtle);
    margin-bottom: 24px;
}

.key-highlight {
    color: #38bdf8 !important;
    font-weight: 800 !important;
    font-family: 'Outfit', sans-serif;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.info-item .label {
    font-size: 10px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.info-item .value {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-main);
}

.status-update-section {
    background: var(--bg-card);
    border-radius: 24px;
    padding: 24px;
    border: 1px solid var(--border-subtle);
}

.section-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 32px;
}

.section-title h2 {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
    color: var(--text-main);
}

.ownership-warning {
    background: var(--danger-light);
    border: 1px solid var(--danger);
    color: var(--danger);
    padding: 12px;
    border-radius: 12px;
    font-size: 13px;
    margin-bottom: 20px;
    text-align: center;
}

.timeline {
    display: flex;
    flex-direction: column;
    padding-left: 10px;
}

.timeline-item {
    display: flex;
    gap: 20px;
    position: relative;
    padding-bottom: 32px;
}

.timeline-item:last-child {
    padding-bottom: 0;
}

.node {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--bg-main);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    color: var(--text-muted);
    transition: var(--ts-base);
}

.connector {
    position: absolute;
    left: 15px;
    top: 32px;
    width: 2px;
    height: calc(100% - 32px);
    background: var(--border-subtle);
    z-index: 1;
}

.connector.active {
    background: #10b981;
}

.timeline-item.completed .node {
    background: var(--success);
    color: white;
}

.timeline-item.current .node {
    background: var(--primary-light);
    border: 1px solid var(--primary);
    color: var(--primary);
    box-shadow: 0 0 15px rgba(var(--primary-rgb, 101, 69, 229), 0.3);
}

.status-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.s-title {
    font-size: 15px;
    font-weight: 700;
    margin: 0;
    color: var(--text-muted);
}

.s-meta {
    font-size: 11px;
    color: var(--text-muted);
    margin: 2px 0 0 0;
}

.timeline-item.completed .s-title { color: var(--success); }
.timeline-item.current .s-title { color: var(--primary); }

.text-green { color: #10b981 !important; }

.next-action-card {
    background: var(--bg-main);
    border: 1px solid var(--border-subtle);
    border-radius: 20px;
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 16px;
    margin: -10px 0 20px 42px;
    position: relative;
    box-shadow: var(--shadow-md);
}

.next-action-card .connector {
    left: -27px;
    top: -20px;
    height: calc(100% + 40px);
}

.action-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.car-glow { box-shadow: 0 0 20px rgba(var(--primary-rgb, 101, 69, 229), 0.4); }
.ready-glow { background: var(--info); box-shadow: 0 0 20px rgba(var(--info-rgb, 59, 130, 246), 0.4); }
.returned-glow { background: var(--success); box-shadow: 0 0 20px rgba(var(--success-rgb, 16, 185, 129), 0.4); }

.action-btn {
    flex: 1;
    background: var(--primary);
    border: none;
    border-radius: 14px;
    padding: 10px 20px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    cursor: pointer;
    transition: var(--ts-base);
}

.btn-ready { background: var(--info); }
.btn-returned { background: var(--success); }

.action-btn:active { transform: scale(0.98); }
.action-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.action-label {
    font-size: 9px;
    font-weight: 800;
    color: rgba(0, 0, 0, 0.5);
    letter-spacing: 0.5px;
}

.action-text {
    font-size: 15px;
    font-weight: 800;
    color: white;
}

.button-group {
    display: flex;
    gap: 12px;
    flex: 1;
}

.btn-repark {
    background: #64748b !important;
}

.btn-repark:hover {
    background: #475569 !important;
}

.lock-icon {
    margin-left: auto;
    color: #334155;
}

.timeline-footer {
    margin-top: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--text-muted);
    font-size: 12px;
    background: var(--bg-main);
    padding: 12px;
    border-radius: 12px;
    border: 1px solid var(--border-subtle);
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

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    backdrop-filter: blur(8px);
}

.modal-card {
    background: var(--bg-card);
    padding: 24px;
    border-radius: 20px;
    width: 90%;
    max-width: 380px;
    border: 1px solid var(--border-subtle);
    box-shadow: var(--shadow-lg);
}

.modal-card h3 {
    margin-top: 0;
    margin-bottom: 8px;
    color: var(--text-main);
}

.modal-card p {
    color: var(--text-muted);
    font-size: 13px;
    margin-bottom: 20px;
}

.form-input {
    width: 100%;
    background: var(--bg-main);
    border: 1px solid var(--border-subtle);
    padding: 12px;
    border-radius: 12px;
    color: var(--text-main);
    font-size: 14px;
}

.form-input:focus {
    outline: none;
    border-color: var(--primary);
}

/* Hide the default datalist arrow/indicator */
.form-input::-webkit-calendar-picker-indicator {
    display: none !important;
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

.modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
}

.cancel-btn, .confirm-btn {
    flex: 1;
    padding: 12px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    border: none;
}

.cancel-btn {
    background: var(--bg-main);
    color: var(--text-main);
    border: 1px solid var(--border-subtle);
}

.confirm-btn {
    background: var(--primary);
    color: white;
}

.confirm-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.modal-actions-stack {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 24px;
}

.primary-btn {
    padding: 14px;
    border-radius: 12px;
    border: none;
    font-weight: 800;
    font-size: 14px;
    cursor: pointer;
    transition: var(--ts-base);
}

.repark-confirm-btn {
    background: var(--primary);
    color: white;
}

.secondary-btn {
    padding: 12px;
    border-radius: 12px;
    border: 1px solid var(--border-subtle);
    background: transparent;
    color: var(--text-muted);
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
}

.modal-header-icon {
    width: 64px;
    height: 64px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
}

.repark-icon-wrap {
    background: #eff6ff;
    color: #3b82f6;
}

.success-icon-wrap {
    background: #ecfdf5;
}

.allocated-slot-display {
    background: var(--bg-main);
    padding: 20px;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    margin-bottom: 20px;
    border: 2px dashed var(--primary);
}

.slot-label {
    font-size: 10px;
    font-weight: 800;
    color: var(--text-muted);
    letter-spacing: 1px;
}

.slot-number {
    font-size: 32px;
    font-weight: 900;
    color: var(--primary);
}

.slot-hint {
    font-weight: 600;
    color: var(--text-main) !important;
    font-size: 14px !important;
}

.full-width {
    width: 100%;
}

.required {
    color: #ef4444;
    margin-left: 2px;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Custom Auto-Suggest Styles */
.custom-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    margin-top: 5px;
    max-height: 180px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
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
</style>
