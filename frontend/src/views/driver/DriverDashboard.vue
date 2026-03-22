<template>
<div class="driver-dashboard">
    <!-- Header -->
    <header class="dashboard-header">
        <div class="venue-info">
            <span class="label">Current Venue</span>
            <div class="venue-name-row">
                <h1 class="venue-name">{{ locationName || 'Loading...' }}</h1>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </div>
        </div>
        <button class="profile-btn" @click="$router.push('/driver/profile')">
             <div class="avatar-sm">{{ userInitial }}</div>
        </button>
    </header>

    <!-- QR Option Button -->
    <button class="qr-option-btn" @click="openQrModal">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="8" x2="16" y2="8"></line><line x1="8" y1="8" x2="8" y2="8"></line><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>
        Generate WhatsApp QR
    </button>

    <!-- Tabs -->
    <div class="status-tabs">
        <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'returning' }"
            @click="activeTab = 'returning'"
        >
            Returning
            <span class="badge" v-if="returningCount > 0">{{ returningCount }}</span>
        </button>
        <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'parked' }"
            @click="activeTab = 'parked'"
        >
            Parked
            <span class="badge success" v-if="parkedCount > 0">{{ parkedCount }}</span>
        </button>
    </div>

    <!-- Content Area -->
    <div class="content-area">
        <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Loading vehicles...</p>
        </div>

        <div v-else-if="currentVehicles.length === 0" class="empty-state">
            <div class="empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
            </div>
            <p>No vehicles found</p>
        </div>

        <div v-else class="vehicles-list">
            <div v-for="vehicle in currentVehicles" :key="vehicle.ticket_id" class="vehicle-card" @click="handleVehicleAction(vehicle)">
                <div class="card-header">
                    <div class="vehicle-number">
                        <span class="hash">#</span>
                        <span class="ticket-id">{{ vehicle.ticket_id }}</span>
                    </div>
                    <span class="status-badge" :class="getStatusBadgeClass(vehicle.status)">
                        {{ vehicle.status.replace('_', ' ') }}
                    </span>
                </div>

                <div class="vehicle-details">
                    <div class="detail-row">
                        <span class="label">Customer</span>
                        <span class="value">{{ vehicle.customer_name || 'Guest' }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Parked At</span>
                        <span class="value">{{ formatTime(vehicle.entry_time) }}</span>
                    </div>
                     <div class="detail-row">
                        <span class="label">Make</span>
                        <span class="value">{{ vehicle.car_model || 'Unknown' }}</span>
                    </div>
                </div>

                <button class="action-btn" :class="getActionBtnClass(vehicle.status)" @click.stop="handleVehicleAction(vehicle)">
                    {{ getActionText(vehicle.status) }}
                </button>
            </div>
        </div>
    </div>

    <!-- Bottom Nav -->
    <nav class="bottom-nav">
        <button class="nav-item active">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            <span>Dashboard</span>
        </button>
        <button class="nav-item" @click="logout">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span>Logout</span>
        </button>
    </nav>
    
    <!-- QR Modal -->
    <div v-if="showQrModal" class="modal-overlay" @click.self="showQrModal = false">
        <div class="qr-modal">
            <h3>Scan to Park</h3>
            <div class="qr-container">
                <img :src="qrCodeUrl" alt="WhatsApp QR Code" />
            </div>
            <p class="instruction">Customer scans this to open WhatsApp with pre-filled details.</p>
            <button class="close-btn" @click="showQrModal = false">Close</button>
        </div>
    </div>

    <!-- Block Assignment Modal -->
    <div v-if="showBlockModal" class="modal-overlay">
        <div class="qr-modal block-modal">
            <h3>Assign Block</h3>
            <p v-if="pendingVehicle" class="instruction">
                Select a block for {{ pendingVehicle.car_model }}
            </p>
            <p class="instruction" style="font-size: 12px; margin-top: -10px;">{{ pendingVehicle?.valet_id }}</p>
            
            <div class="form-group" style="margin-top: 20px; text-align: left;">
                <label>Select Block</label>
                <select v-model="selectedBlockId" class="form-input">
                    <option value="" disabled>Choose a block</option>
                    <option v-for="block in activeBlocks" :key="block.block_id" :value="block.block_id">
                        {{ block.block_name }} ({{ block.available_slots }} slots)
                    </option>
                </select>
                <div v-if="!activeBlocks || activeBlocks.length === 0" class="error-text" style="color: #ef4444; font-size: 12px; margin-top: 5px;">
                    No active blocks found.
                </div>
            </div>

            <div class="modal-actions" style="margin-top: 24px; display: flex; gap: 12px;">
                <button class="close-btn" @click="closeBlockModal" :disabled="isAssigning" style="flex: 1; background: rgba(255,255,255,0.1);">Cancel</button>
                <button class="close-btn" @click="confirmBlockAssignment" :disabled="!selectedBlockId || isAssigning" style="flex: 1; background: #f59e0b; color: white;">
                    {{ isAssigning ? 'Assigning...' : 'Confirm' }}
                </button>
            </div>
        </div>
    </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';

import { useToast } from '../../stores/toast';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const activeTab = ref('returning');
const loading = ref(false);
const vehicles = ref([]);

// QR Modal State
const showQrModal = ref(false);

// Block Assignment State
const showBlockModal = ref(false);
const selectedBlockId = ref('');
const activeBlocks = ref([]);
const isAssigning = ref(false);
const pendingVehicle = ref(null);

const userInitial = computed(() => authStore.profileInitial);
const locationName = computed(() => {
    return authStore.accessibleLocations?.[0]?.location_name || 'Assigned Location';
});

const qrCodeUrl = computed(() => {
    const locId = authStore.accessibleLocations?.[0]?.location_id || 'LOC-UNKNOWN';
    const driverId = authStore.user?.user_id || 'DRIVER-UNKNOWN';
    // Format: Your car is parked at {LOC_ID} by driver {DRIVER_ID}
    const text = `Your car is parked at ${locId} by driver ${driverId}`;
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/917200476950?text=${encodedText}`;
    
    // Generate QR for the WhatsApp link
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(whatsappUrl)}`;
});

const returningCount = computed(() => vehicles.value.filter(v => ['RETURN_REQUESTED', 'ON_THE_WAY', 'READY'].includes(v.status.toUpperCase())).length);
const parkedCount = computed(() => vehicles.value.filter(v => v.status.toUpperCase() === 'PARKED').length);

const currentVehicles = computed(() => {
    if (activeTab.value === 'returning') {
        return vehicles.value.filter(v => ['RETURN_REQUESTED', 'ON_THE_WAY', 'READY'].includes(v.status.toUpperCase()));
    }
    return vehicles.value.filter(v => v.status.toUpperCase() === 'PARKED');
});

const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getStatusBadgeClass = (status) => {
    switch (status.toUpperCase()) {
        case 'PARKED': return 'badge-green';
        case 'RETURN_REQUESTED': return 'badge-orange';
        case 'ON_THE_WAY': return 'badge-orange';
        case 'READY': return 'badge-orange';
        default: return 'badge-orange';
    }
};

const getActionBtnClass = (status) => {
    return status.toUpperCase() === 'PARKED' ? 'btn-green' : 'btn-gold';
};

const getActionText = (status) => {
    return status.toUpperCase() === 'PARKED' ? 'Update Car Make' : 'Change Status';
};

const fetchVehicles = async () => {
    console.log('Accessible Locations:', authStore.accessibleLocations);
    const locId = authStore.accessibleLocations?.[0]?.location_id;
    console.log('Location ID used:', locId);
    
    if (!locId) {
        console.warn('No location assigned to driver.');
        return;
    }

    try {
        const response = await axios.get(`${API_URL}/valet/vehicles`, {
            params: { location_id: locId },
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        if (response.data.success) {
            vehicles.value = response.data.data.map(v => ({
                ticket_id: v.valet_id, 
                valet_id: v.valet_id,
                customer_name: v.customer_name,
                phone_number: v.phone_number,
                entry_time: v.parked_time,
                car_model: v.car_model,
                status: v.status,
                block_entry_id: v.block_entry_id,
                needsBlockAssignment: (v.status.toUpperCase() === 'PARKED') && !v.block_entry_id
            }));
            
            console.log('Vehicles fetched:', vehicles.value);
            const needing = vehicles.value.filter(v => v.needsBlockAssignment);
            console.log('Needs assignment:', needing);

            // Check for unassigned blocks
            const needsAssignment = vehicles.value.find(v => v.needsBlockAssignment);
            if (needsAssignment && !showBlockModal.value && !isAssigning.value) {
                await fetchBlocks();
                // Force open even if blocks are 0, so we can debug visualized
                openBlockAssignment(needsAssignment);
            }
        }
    } catch (error) {
        console.error('Error fetching vehicles:', error);
    }
};

const fetchBlocks = async () => {
    const locId = authStore.accessibleLocations?.[0]?.location_id;
    if (!locId) return;

    try {
        const response = await axios.get(`${API_URL}/valet/blocks/active`, {
            params: { location_id: locId },
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
            activeBlocks.value = response.data.data;
            console.log('Active blocks fetched:', activeBlocks.value);
        }
    } catch (error) {
        console.error('Error fetching blocks:', error);
    }
};

const handleVehicleAction = (vehicle) => {
    console.log('Clicked vehicle:', vehicle);
    if (vehicle.needsBlockAssignment) {
        openBlockAssignment(vehicle);
        return;
    }

    const vId = vehicle.valet_id || vehicle.ticket_id;
    if (!vId) {
        console.error('Missing valet_id', vehicle);
        toast.error('Error: Missing Ticket ID');
        return;
    }
    
    // If PARKED, go to dedicated update page
    // If anything else (Returning flow), go to status timeline page
    if (vehicle.status.toUpperCase() === 'PARKED') {
        router.push(`/driver/update-vehicle/${vId}`);
    } else {
        router.push(`/driver/vehicle/${vId}`);
    }
};

const logout = () => {
    authStore.logout();
    router.push('/login');
};

const openQrModal = () => {
    showQrModal.value = true;
};

const openBlockAssignment = (vehicle) => {
    pendingVehicle.value = vehicle;
    selectedBlockId.value = '';
    showBlockModal.value = true;
};

const closeBlockModal = () => {
    showBlockModal.value = false;
    pendingVehicle.value = null;
    selectedBlockId.value = '';
};

const confirmBlockAssignment = async () => {
    if (!selectedBlockId.value) return;
    
    isAssigning.value = true;
    try {
        const response = await axios.post(`${API_URL}/valet/${pendingVehicle.value.valet_id}/assign-block`, {
            block_id: selectedBlockId.value
        }, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        if (response.data.success) {
            toast.success(`Block Assigned! Slot: ${response.data.slot_id}`);
            closeBlockModal();
            fetchVehicles();
        }
    } catch (error) {
        console.error('Assignment error:', error);
        toast.error(`Failed to assign: ${error.response?.data?.message || error.message}`);
    } finally {
        isAssigning.value = false;
    }
};

onMounted(async () => {
    loading.value = true;
    try {
        await fetchVehicles();
        // Poll every 10 seconds (faster for testing)
        setInterval(fetchVehicles, 10000);
    } finally {
        loading.value = false;
    }
});
</script>

<style scoped>
.driver-dashboard {
    max-width: 420px;
    margin: 0 auto;
    background: var(--bg-main);
    min-height: 100vh;
    color: var(--text-main);
    font-family: 'Inter', sans-serif;
    padding-bottom: 80px; /* Space for bottom nav */
    transition: var(--ts-base);
}

/* Header */
.dashboard-header {
    background: var(--bg-card);
    border-bottom: 1px solid var(--primary-border, var(--border-subtle));
    box-shadow: var(--shadow-sm);
    padding: 20px;
    padding-top: 40px; /* Safe area */
    border-radius: 0 0 24px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-muted);
    margin-bottom: 4px;
    display: block;
}

.venue-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--primary);
}

.venue-name {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
}

.profile-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--primary-light);
    border: 1px solid var(--primary-border, var(--border-subtle));
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    cursor: pointer;
}

.avatar-sm {
    color: var(--primary);
    font-weight: 700;
    font-size: 14px;
}

/* QR Button */
.qr-option-btn {
    background: linear-gradient(135deg, var(--success) 0%, var(--success-dark, var(--success)) 100%);
    color: white;
    border: none;
    border-radius: 16px;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-weight: 700;
    font-size: 16px;
    margin: 0 20px 24px;
    width: calc(100% - 40px);
    box-shadow: var(--shadow-md);
    cursor: pointer;
}

/* Tabs */
.status-tabs {
    display: flex;
    padding: 0 20px;
    gap: 16px;
    margin-bottom: 24px;
}

.tab-btn {
    flex: 1;
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: 16px;
    padding: 12px;
    color: var(--text-muted);
    font-weight: 600;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s ease;
}

.tab-btn.active {
    background: var(--primary-light);
    border-color: var(--primary);
    color: var(--primary);
    box-shadow: var(--shadow-sm);
}

.badge {
    background: var(--primary);
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 12px;
    font-weight: 800;
}

.badge.success {
    background: #10b981;
    color: white;
}

/* Vehicle Card */
.content-area {
    padding: 0 20px;
}

.vehicle-card {
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: var(--shadow-sm);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-subtle);
}

.vehicle-number {
    font-size: 24px;
    font-weight: 800;
    color: var(--text-main);
    letter-spacing: -0.5px;
}

.hash {
    color: var(--text-muted);
    font-size: 18px;
    margin-right: 2px;
}

.status-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 6px 12px;
    border-radius: 8px;
    text-transform: uppercase;
}

.badge-orange {
    background: var(--warning-light);
    color: var(--warning);
    border: 1px solid var(--warning-border, var(--warning));
}

.badge-green {
    background: var(--success-light);
    color: var(--success);
    border: 1px solid var(--success-border, var(--success));
}

.vehicle-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 20px;
}

.detail-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.detail-row .label {
    margin-bottom: 0;
    font-size: 10px;
}

.detail-row .value {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-main);
}

.action-btn {
    width: 100%;
    padding: 14px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    border: none;
    transition: transform 0.2s;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.action-btn:active {
    transform: scale(0.98);
}

.btn-gold {
    background: linear-gradient(135deg, var(--warning) 0%, var(--warning-dark, var(--warning)) 100%);
    color: white;
    box-shadow: var(--shadow-sm);
}

.btn-green {
    background: linear-gradient(135deg, var(--success) 0%, var(--success-dark, var(--success)) 100%);
    color: white;
    box-shadow: var(--shadow-sm);
}

/* Bottom Nav */
.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 420px;
    background: var(--bg-card);
    border-top: 1px solid var(--border-subtle);
    display: flex;
    justify-content: space-around;
    padding: 12px;
    z-index: 100;
}

.nav-item {
    background: none;
    border: none;
    color: var(--text-muted);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 600;
}

.nav-item.active {
    color: var(--primary);
}

.nav-item.active svg {
    stroke: var(--primary);
    filter: drop-shadow(0 0 8px var(--primary-light));
}

.loading-state, .empty-state {
    text-align: center;
    padding: 40px;
    color: var(--text-muted);
}

.spinner {
    width: 24px;
    height: 24px;
    border: 3px solid var(--border-subtle);
    border-top-color: var(--primary);
    border-radius: 50%;
    margin: 0 auto 16px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Modal */
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

.qr-modal {
    background: var(--bg-card);
    padding: 24px;
    border-radius: 20px;
    text-align: center;
    border: 1px solid var(--border-subtle);
    max-width: 380px;
    width: 90%;
    box-shadow: var(--shadow-lg);
}

.qr-modal h3 {
    margin-top: 0;
    color: var(--text-main);
}

.qr-container {
    background: white;
    padding: 16px;
    border-radius: 12px;
    margin: 20px 0;
}

.qr-container img {
    display: block;
    width: 100%;
}

.instruction {
    color: var(--text-muted);
    font-size: 14px;
    margin-bottom: 20px;
}

.close-btn {
    background: var(--bg-main);
    color: var(--text-main);
    border: 1px solid var(--border-subtle);
    padding: 10px 24px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
}
</style>
