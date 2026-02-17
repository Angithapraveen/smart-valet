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
                    <span class="status-badge" :class="activeTab === 'returning' ? 'badge-orange' : 'badge-green'">
                        {{ activeTab === 'returning' ? 'Return Requested' : 'Parked' }}
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

                <button class="action-btn" :class="activeTab === 'returning' ? 'btn-gold' : 'btn-green'" @click.stop="handleVehicleAction(vehicle)">
                    {{ activeTab === 'returning' ? 'Change Status' : 'Update Car Make' }}
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
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';

const router = useRouter();
const authStore = useAuthStore();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const activeTab = ref('returning');
const loading = ref(false);
const vehicles = ref([]);

// QR Modal State
const showQrModal = ref(false);

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

const returningCount = computed(() => vehicles.value.filter(v => v.status === 'requested').length);
const parkedCount = computed(() => vehicles.value.filter(v => v.status === 'parked').length);

const currentVehicles = computed(() => {
    if (activeTab.value === 'returning') {
        return vehicles.value.filter(v => v.status === 'requested');
    }
    return vehicles.value.filter(v => v.status === 'parked');
});

const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const fetchVehicles = async () => {
    const locId = authStore.accessibleLocations?.[0]?.location_id;
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
                ticket_id: v.valet_id, // Map database column to frontend prop
                valet_id: v.valet_id,  // Keep original for navigation
                customer_name: v.customer_name,
                phone_number: v.phone_number,
                entry_time: v.parked_time,
                car_model: v.car_model,
                status: v.status === 'RETURN_REQUESTED' ? 'requested' : v.status.toLowerCase()
            }));
        }
    } catch (error) {
        console.error('Error fetching vehicles:', error);
    }
};

const handleVehicleAction = (vehicle) => {
    console.log('Clicked vehicle:', vehicle); // Debug log
    if (!vehicle.valet_id && !vehicle.ticket_id) {
        console.error('Missing valet_id', vehicle);
        return;
    }
    // Navigate to details page
    router.push({
        name: 'VehicleDetails',
        params: { valetId: vehicle.valet_id || vehicle.ticket_id }
    }).catch(err => {
        console.error('Navigation error:', err);
    });
};

const logout = () => {
    authStore.logout();
    router.push('/login');
};

const openQrModal = () => {
    showQrModal.value = true;
};

onMounted(async () => {
    loading.value = true;
    try {
        await fetchVehicles();
        // Poll every 30 seconds
        setInterval(fetchVehicles, 30000);
    } finally {
        loading.value = false;
    }
});
</script>

<style scoped>
.driver-dashboard {
    max-width: 420px;
    margin: 0 auto;
    background: linear-gradient(180deg, #0b0f1a 0%, #020617 100%);
    min-height: 100vh;
    color: white;
    font-family: 'Inter', sans-serif;
    padding-bottom: 80px; /* Space for bottom nav */
}

/* Header */
.dashboard-header {
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid rgba(245, 158, 11, 0.3);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
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
    color: #94a3b8;
    margin-bottom: 4px;
    display: block;
}

.venue-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #f59e0b; /* Gold */
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
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    cursor: pointer;
}

.avatar-sm {
    color: #f59e0b;
    font-weight: 700;
    font-size: 14px;
}

/* QR Button */
.qr-option-btn {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
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
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 12px;
    color: #94a3b8;
    font-weight: 600;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s ease;
}

.tab-btn.active {
    background: rgba(245, 158, 11, 0.15);
    border-color: #f59e0b;
    color: #f59e0b;
    box-shadow: 0 0 15px rgba(245, 158, 11, 0.1);
}

.badge {
    background: #f59e0b;
    color: black;
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
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.vehicle-number {
    font-size: 24px;
    font-weight: 800;
    color: white;
    letter-spacing: -0.5px;
}

.hash {
    color: #64748b;
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
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.2);
}

.badge-green {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.2);
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
    color: #e2e8f0;
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
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
}

.btn-green {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

/* Bottom Nav */
.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 420px;
    background: #0f172a;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: space-around;
    padding: 12px;
    z-index: 100;
}

.nav-item {
    background: none;
    border: none;
    color: #64748b;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 600;
}

.nav-item.active {
    color: #f59e0b;
}

.nav-item.active svg {
    stroke: #f59e0b;
    filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.5));
}

.loading-state, .empty-state {
    text-align: center;
    padding: 40px;
    color: #64748b;
}

.spinner {
    width: 24px;
    height: 24px;
    border: 3px solid rgba(245, 158, 11, 0.3);
    border-top-color: #f59e0b;
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
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    backdrop-filter: blur(5px);
}

.qr-modal {
    background: #1a1a1a;
    padding: 24px;
    border-radius: 20px;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
    max-width: 320px;
    width: 90%;
}

.qr-modal h3 {
    margin-top: 0;
    color: white;
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
    color: #94a3b8;
    font-size: 14px;
    margin-bottom: 20px;
}

.close-btn {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: none;
    padding: 10px 24px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
}
</style>
