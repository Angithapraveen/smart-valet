<template>
<div class="driver-dashboard">
    <!-- Header -->
    <header class="dashboard-header">
        <div class="venue-info">
            <span class="label">Current Venue</span>
            <div class="venue-name-row">
                <h1 class="venue-name">{{ locationName || 'Loading...' }}</h1>
                <span v-if="currentLocationStatus" class="status-indicator" :class="currentLocationStatus.toLowerCase()">
                    {{ currentLocationStatus }}
                </span>
            </div>
            <button class="switch-site-link" @click="showLocationModal = true">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"></path><path d="M8 21H3v-5"></path><path d="M15 3l6 6"></path><path d="M9 21l-6-6"></path><path d="M21 3l-9 9"></path><path d="M3 21l9-9"></path></svg>
                Switch Site
            </button>
        </div>
        <button class="profile-btn" @click="$router.push('/driver/profile')">
             <div class="avatar-sm">{{ userInitial }}</div>
        </button>
    </header>

    <!-- Over Capacity Alert Banner -->
    <div v-if="isOverCapacity" class="capacity-alert-banner">
        <div class="alert-content">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <span>KEY SLOT CAPACITY REACHED!</span>
        </div>
    </div>

    <!-- Content Area -->
    <div class="main-content-wrapper" :class="{ 'site-inactive': currentLocationStatus !== 'ACTIVE' }">
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
                        <div class="header-left">
                            <div v-if="vehicle.key_slot" 
                                 class="key-slot-badge" 
                                 :class="{ 'key-danger': locationCapacity > 0 && vehicle.key_slot > locationCapacity }">
                                <span class="key-slot-label">KEYSLOT</span>
                                <span class="key-slot-value">{{ formatKeySlot(vehicle.key_slot) }}</span>
                            </div>
                            <div v-else class="vehicle-number">
                                <span class="hash">#</span>
                                <span class="ticket-id">{{ vehicle.ticket_id }}</span>
                            </div>
                        </div>
                        <div class="badges-row">
                            <span v-if="vehicle.car_category" class="cat-badge" :class="'cat-' + vehicle.car_category.toLowerCase()">
                                {{ vehicle.car_category }}
                            </span>
                            <span class="status-badge" :class="getStatusBadgeClass(vehicle.status)">
                                {{ vehicle.status.replace('_', ' ') }}
                            </span>
                        </div>
                    </div>

                    <div class="vehicle-details">

                        <div class="detail-row">
                            <span class="label">Valet ID</span>
                            <span class="value" style="color: var(--primary); font-family: 'Outfit', monospace;">#{{ vehicle.ticket_id }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Parked At</span>
                            <span class="value">{{ formatTime(vehicle.entry_time) }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Duration</span>
                            <span class="value" style="color: var(--warning);">{{ getDuration(vehicle.entry_time) }}</span>
                        </div>
                        <div class="detail-row" v-if="vehicle.return_requested_time">
                            <span class="label">Requested At</span>
                            <span class="value">{{ formatTime(vehicle.return_requested_time) }}</span>
                        </div>
                        <div class="detail-row" v-if="vehicle.return_requested_time">
                            <span class="label">Request Time</span>
                            <span class="value" style="color: var(--danger);">{{ getDuration(vehicle.return_requested_time) }}</span>
                        </div>
                    <div class="vehicle-info-footer">
                        <div class="footer-label">VEHICLE DETAILS</div>
                        <div class="car-info-row">
                            <span class="car-make-text">{{ vehicle.car_model || 'Unknown Model' }}</span>
                            <div v-if="vehicle.car_number && vehicle.car_number !== 'N/A'" class="license-plate">
                                {{ vehicle.car_number }}
                            </div>
                        </div>
                    </div>
                    </div>

                    <button class="action-btn" :class="getActionBtnClass(vehicle.status)" @click.stop="handleVehicleAction(vehicle)">
                        {{ getActionText(vehicle.status) }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Site Inactive Overlay -->
        <div v-if="currentLocationStatus !== 'ACTIVE'" class="inactive-overlay">
            <div class="lock-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h3>Location Inactive</h3>
            <p>You must be activated by a manager to perform parking operations at this site.</p>
            <button class="primary-action-btn" @click="showLocationModal = true">
                Manage Locations
            </button>
        </div>
    </div>

    <!-- Capacity Alert Pop-up Modal -->
    <div v-if="showCapacityPopup" class="modal-overlay">
        <div class="modal-card capacity-warning-card">
            <div class="modal-header-icon warning-icon-wrap">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <h3>New Key Slot Allocated!</h3>
            <p class="warning-text">CAPACITY LIMIT REACHED</p>
            
            <div class="allocated-slot-display danger-display">
                <span class="slot-label">OVER-CAPACITY SLOT</span>
                <span class="slot-number">{{ formatKeySlot(popupKeySlot) }}</span>
            </div>
            
            <p class="slot-hint">Ticket: #{{ popupValetId }}</p>
            <p class="cabinet-hint">Please place key in backup slot {{ formatKeySlot(popupKeySlot) }}.</p>
            
            <button class="confirm-btn full-width" @click="handleAcknowledge">ACKNOWLEDGE</button>
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
    <!-- Location Management Modal -->
    <div v-if="showLocationModal" class="modal-overlay" @click.self="showLocationModal = false">
        <div class="qr-modal location-mgmt-modal">
            <h3 style="margin-bottom: 8px;">My Locations</h3>
            <p class="instruction">Manage your site access and activation</p>
            
            <div class="locations-list">
                <div v-for="loc in authStore.accessibleLocations" :key="loc.location_id" class="location-item-card" @click.stop>
                    <div class="loc-main">
                        <div class="loc-info">
                            <span class="loc-name">{{ loc.location_name }}</span>
                            <span class="loc-code">{{ loc.location_id }}</span>
                        </div>
                        <span class="status-pill" :class="loc.access_status.toLowerCase()">
                            {{ loc.access_status }}
                        </span>
                    </div>
                    
                    <div class="loc-actions">
                        <button 
                            v-if="loc.access_status === 'ACTIVE'"
                            class="deactivate-btn"
                            @click="handleStatusToggle(loc.location_id, 'INACTIVE')"
                            :disabled="isToggling"
                        >
                            {{ isToggling ? '...' : 'Deactivate' }}
                        </button>
                        <button 
                            v-else
                            class="activate-btn"
                            @click="handleStatusToggle(loc.location_id, 'ACTIVE')"
                            :disabled="true"
                        >
                            Locked
                        </button>
                    </div>
                </div>
            </div>
            
            <div v-if="!authStore.accessibleLocations?.length" class="empty-state-mini">
                No locations assigned.
            </div>

            <div class="modal-info-box" v-if="currentLocationStatus !== 'ACTIVE'">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                Contact manager to activate this site.
            </div>

            <button class="close-btn" style="width: 100%; margin-top: 20px;" @click="showLocationModal = false">Close</button>
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
const currentTime = ref(new Date());
const locationCapacity = ref(0);
const isOverCapacity = ref(false);
const showCapacityPopup = ref(false);

const handleAcknowledge = () => {
    if (popupValetId.value) {
        const ackIds = JSON.parse(localStorage.getItem('acknowledged_capacity_ids') || '[]');
        if (!ackIds.includes(popupValetId.value)) {
            ackIds.push(popupValetId.value);
            // Limit the list to last 50 IDs to avoid bloat
            if (ackIds.length > 50) ackIds.shift();
            localStorage.setItem('acknowledged_capacity_ids', JSON.stringify(ackIds));
        }
    }
    showCapacityPopup.value = false;
};
const popupKeySlot = ref(null);
const popupValetId = ref(null);
const seenValetIds = ref(new Set());

// Location Modal State
const showLocationModal = ref(false);
const isToggling = ref(false);

// QR Modal State
const showQrModal = ref(false);
const botNumber = ref('917200476950'); // Default fallback

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

const currentLocationStatus = computed(() => {
    return authStore.accessibleLocations?.[0]?.access_status || 'INACTIVE';
});

const qrCodeUrl = computed(() => {
    const locId = authStore.accessibleLocations?.[0]?.location_id || 'LOC-UNKNOWN';
    const driverId = authStore.user?.user_id || 'DRIVER-UNKNOWN';
    
    const text = `My car needs to be parked.\n\nParking request\nPremises: ${locId}\nDriver: ${driverId}`;
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/${botNumber.value}?text=${encodedText}`;
    
    // Generate QR for the WhatsApp link
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(whatsappUrl)}`;
});

const fetchBotStatus = async () => {
    try {
        const response = await axios.get(`${API_URL}/valet/bot-status`);
        if (response.data.success && response.data.botNumber && response.data.botNumber !== 'Unknown') {
            botNumber.value = response.data.botNumber;
        }
    } catch (err) {
        console.error('Failed to fetch bot status:', err);
    }
};

const returningCount = computed(() => {
    return vehicles.value.filter(v => {
        const s = v.status.toUpperCase();
        if (!['RETURN_REQUESTED', 'ON_THE_WAY', 'READY'].includes(s)) return false;
        if (v.returned_driver_id && v.returned_driver_id !== authStore.user?.user_id) return false;
        return true;
    }).length;
});
const parkedCount = computed(() => vehicles.value.filter(v => v.status.toUpperCase() === 'PARKED').length);

const currentVehicles = computed(() => {
    if (activeTab.value === 'returning') {
        const list = vehicles.value.filter(v => {
            const s = v.status.toUpperCase();
            if (!['RETURN_REQUESTED', 'ON_THE_WAY', 'READY'].includes(s)) return false;
            if (v.returned_driver_id && v.returned_driver_id !== authStore.user?.user_id) return false;
            return true;
        });
        
        const catWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
        
        return list.sort((a, b) => {
            const tA = a.return_requested_time ? new Date(a.return_requested_time).getTime() : 0;
            const tB = b.return_requested_time ? new Date(b.return_requested_time).getTime() : 0;
            
            // Primary sort: Time (Earliest first)
            if (tA !== tB) {
                if (tA === 0) return 1;
                if (tB === 0) return -1;
                return tA - tB;
            }
            
            // Secondary sort: Category (High weight first)
            const wA = catWeight[a.car_category] || 0;
            const wB = catWeight[b.car_category] || 0;
            return wB - wA;
        });
    }
    return vehicles.value.filter(v => v.status.toUpperCase() === 'PARKED');
});

const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                car_category: v.car_category,
                car_number: v.car_number,
                status: v.status,
                key_slot: v.key_slot,
                return_requested_time: v.return_requested_time,
                returned_driver_id: v.returned_driver_id,
                block_entry_id: v.block_entry_id,
                needsBlockAssignment: (v.status.toUpperCase() === 'PARKED') && !v.block_entry_id
            }));
            
            locationCapacity.value = response.data.location?.total_capacity || 0;
            const activeCount = vehicles.value.filter(v => v.status === 'PARKED' || ['RETURN_REQUESTED', 'ON_THE_WAY', 'READY'].includes(v.status)).length;
            
            if (locationCapacity.value > 0 && activeCount > locationCapacity.value) {
                isOverCapacity.value = true;
            } else {
                isOverCapacity.value = false;
            }

            // Detect NEW over-capacity vehicles to show pop-up
            if (locationCapacity.value > 0) {
                // Get acknowledged IDs from local storage
                const ackIds = JSON.parse(localStorage.getItem('acknowledged_capacity_ids') || '[]');
                const ackSet = new Set(ackIds);

                vehicles.value.forEach(v => {
                    const vId = v.valet_id;
                    if (v.key_slot > locationCapacity.value && !seenValetIds.value.has(vId) && !ackSet.has(vId)) {
                        popupKeySlot.value = v.key_slot;
                        popupValetId.value = v.valet_id;
                        showCapacityPopup.value = true;
                    }
                    seenValetIds.value.add(vId);
                });
            }

            console.log(`[Dashboard] Fetched ${vehicles.value.length} vehicles. Checking for block assignments...`);
            
            // Check for unassigned blocks
            const needsAssignment = vehicles.value.find(v => v.needsBlockAssignment);
            
            if (needsAssignment) {
                console.log('[Dashboard] Found vehicle needing block assignment:', needsAssignment.valet_id);
                
                if (!showBlockModal.value && !isAssigning.value && !showCapacityPopup.value) {
                    try {
                        await fetchBlocks();
                        console.log('[Dashboard] Blocks fetched for assignment:', activeBlocks.value?.length);
                        
                        // Switch to parked tab so the driver can see the record being assigned
                        activeTab.value = 'parked';
                        
                        openBlockAssignment(needsAssignment);
                    } catch (err) {
                        console.error('[Dashboard] Failed to prepare block assignment:', err);
                    }
                } else {
                    console.log('[Dashboard] Assignment pending but modal suppressed:', {
                        modalOpen: showBlockModal.value,
                        isAssigning: isAssigning.value,
                        capacityPopup: showCapacityPopup.value
                    });
                }
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
    
    // Check if the user has an active return request they haven't finished
    const activeReturn = vehicles.value.find(v => v.returned_driver_id === authStore.user?.user_id && ['ON_THE_WAY', 'READY'].includes(v.status.toUpperCase()));
    const vId = vehicle.valet_id || vehicle.ticket_id;
    
    if (activeReturn && activeReturn.valet_id !== vId) {
        toast.error('You have an ongoing return request. Please complete it first.');
        router.push(`/driver/vehicle/${activeReturn.valet_id}`);
        return;
    }

    if (vehicle.needsBlockAssignment) {
        openBlockAssignment(vehicle);
        return;
    }

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

const handleStatusToggle = async (locationId, status) => {
    isToggling.value = true;
    try {
        const response = await axios.put(`${API_URL}/auth/location-status`, {
            location_id: locationId,
            status: status
        }, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        if (response.data.success) {
            toast.success(response.data.message);
            // Refresh auth store to get updated location statuses
            await authStore.fetchCurrentUser();
        }
    } catch (error) {
        console.error('Status toggle error:', error);
        toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
        isToggling.value = false;
    }
};

onMounted(async () => {
    loading.value = true;
    try {
        await fetchBotStatus();
        await fetchVehicles();
        // Poll every 10 seconds (faster for testing)
        setInterval(fetchVehicles, 10000);
        
        // Update current time every minute
        setInterval(() => {
            currentTime.value = new Date();
        }, 1000 * 60);
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
    padding-bottom: 80px; 
    transition: var(--ts-base);
}

/* Header */
.dashboard-header {
    background: var(--bg-card);
    border-bottom: 1px solid var(--primary-border, var(--border-subtle));
    box-shadow: var(--shadow-sm);
    padding: 20px;
    padding-top: 40px;
    border-radius: 0 0 24px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0px;
}

.capacity-alert-banner {
    background: rgba(239, 68, 68, 0.9);
    backdrop-filter: blur(4px);
    color: white;
    padding: 10px;
    text-align: center;
    font-weight: 800;
    font-size: 13px;
    letter-spacing: 1.5px;
    display: flex;
    justify-content: center;
    margin-bottom: 15px;
    border-radius: 0 0 16px 16px;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}
.alert-content { display: flex; align-items: center; gap: 8px; }

.capacity-summary-card {
    background: var(--bg-card);
    margin: 0 20px 24px;
    padding: 16px;
    border-radius: 16px;
    border: 1px solid var(--border-subtle);
    box-shadow: var(--shadow-sm);
}
.summary-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.summary-label { font-size: 13px; font-weight: 600; color: var(--text-muted); }
.text-danger { color: #f87171 !important; }

/* Professional Key Slot Badge on Cards */
.key-slot-badge {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 4px 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.key-slot-label {
    font-size: 10px;
    font-weight: 800;
    color: #94a3b8;
    letter-spacing: 0.05em;
}

.key-slot-value {
    font-size: 18px;
    font-weight: 900;
    color: #38bdf8;
    font-family: 'Outfit', sans-serif;
}

.key-slot-badge.key-danger {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.4);
}

.key-slot-badge.key-danger .key-slot-value {
    color: #ef4444;
}

.key-slot-badge.key-danger .key-slot-label {
    color: rgba(239, 68, 68, 0.7);
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
    display: flex;
    align-items: center;
}

.key-label-mini {
    font-size: 11px;
    font-weight: 800;
    color: var(--text-muted);
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-right: 2px;
}

.hash {
    color: var(--primary);
    opacity: 0.5;
    margin-right: 4px;
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

.key-id-section {
    margin-top: 12px;
    display: flex;
    justify-content: flex-end;
}

.key-badge {
    background: #1e293b;
    color: #f8fafc;
    padding: 4px 12px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Outfit', sans-serif;
    border: 1px solid #334155;
}

.key-label {
    font-size: 10px;
    font-weight: 800;
    color: #94a3b8;
    letter-spacing: 0.1em;
}

.key-num {
    font-size: 16px;
    font-weight: 900;
    color: #38bdf8;
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

.badges-row {
    display: flex;
    gap: 8px;
    align-items: center;
}

.cat-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 6px 10px;
    border-radius: 8px;
    text-transform: uppercase;
}

.cat-high {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
}

.cat-medium {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.3);
}

.cat-low {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    border: 1px solid rgba(59, 130, 246, 0.3);
}

.capacity-warning-card {
    background: linear-gradient(145deg, #111827 0%, #1f2937 100%);
    border: 1px solid rgba(239, 68, 68, 0.4);
    border-radius: 28px;
    padding: 32px;
    width: 90%;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 25px 50px -12px rgba(239, 68, 68, 0.25), 0 0 15px rgba(239, 68, 68, 0.1);
    position: relative;
    overflow: hidden;
}

.capacity-warning-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #ef4444, #f87171, #ef4444);
}

.warning-icon-wrap {
    width: 72px;
    height: 72px;
    background: rgba(239, 68, 68, 0.1);
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    border: 1px solid rgba(239, 68, 68, 0.2);
    box-shadow: 0 10px 20px rgba(239, 68, 68, 0.1);
}

.capacity-warning-card h3 {
    font-size: 20px;
    font-weight: 800;
    color: #f8fafc;
    margin-bottom: 8px;
}

.warning-text {
    color: #ef4444;
    font-weight: 900;
    font-size: 13px;
    margin-bottom: 28px;
    letter-spacing: 2px;
    text-transform: uppercase;
}

.danger-display {
    background: rgba(239, 68, 68, 0.05);
    border: 2px dashed rgba(239, 68, 68, 0.3);
    border-radius: 24px;
    padding: 32px 24px;
    margin-bottom: 28px;
    transition: all 0.3s ease;
}

.danger-display:hover {
    border-color: rgba(239, 68, 68, 0.6);
    background: rgba(239, 68, 68, 0.08);
}

.slot-label {
    font-size: 11px;
    color: #94a3b8;
    font-weight: 700;
    letter-spacing: 1.5px;
    margin-bottom: 12px;
    display: block;
}

.slot-number {
    font-size: 64px;
    font-weight: 950;
    color: #ef4444;
    font-family: 'Outfit', sans-serif;
    line-height: .9;
    text-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
}

.slot-hint {
    font-size: 15px;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 6px;
}

.cabinet-hint {
    font-size: 13px;
    color: #94a3b8;
    margin-bottom: 32px;
    line-height: 1.5;
}

.capacity-warning-card .confirm-btn {
    background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
    color: white;
    padding: 16px;
    border-radius: 16px;
    border: none;
    font-weight: 800;
    font-size: 14px;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 1px;
    box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.4);
    transition: all 0.2s ease;
}

.capacity-warning-card .confirm-btn:active {
    transform: translateY(2px);
    box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.4);
}

.full-width {
    width: 100%;
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

.vehicle-info-footer {
    grid-column: span 2;
    margin-top: 4px;
    padding-top: 12px;
    border-top: 1px dashed var(--border-subtle);
}

.footer-label {
    font-size: 10px;
    color: var(--text-muted);
    font-weight: 700;
    margin-bottom: 8px;
    text-transform: uppercase;
}

.car-info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
}

.car-make-text {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-main);
}

.license-plate {
    background: #FFD700; /* Gold/Yellow License Plate */
    color: #000;
    border: 1.5px solid #000;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 900;
    font-family: 'Outfit', 'Segoe UI', sans-serif;
    font-size: 12px;
    box-shadow: 2px 2px 0px rgba(0,0,0,0.2);
    letter-spacing: 0.5px;
    text-transform: uppercase;
    white-space: nowrap;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-input {
    width: 100%;
    padding: 12px;
    background: var(--bg-main);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    color: var(--text-main);
    font-family: inherit;
    font-size: 14px;
}

.form-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px var(--primary-light);
}

/* Location Status & Switching Styles */
.status-indicator {
    font-size: 10px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.status-indicator.active {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
}

.status-indicator.inactive {
    background: rgba(100, 116, 139, 0.1);
    color: #64748b;
}

.switch-site-link {
    background: none;
    border: none;
    color: var(--primary);
    font-size: 11px;
    font-weight: 700;
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    cursor: pointer;
    opacity: 0.8;
}

.main-content-wrapper {
    position: relative;
    min-height: 50vh;
}

.main-content-wrapper.site-inactive {
    pointer-events: none;
}

.site-inactive > *:not(.inactive-overlay) {
    filter: blur(4px);
    opacity: 0.5;
}

.inactive-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 85%;
    background: var(--bg-card);
    padding: 32px 24px;
    border-radius: 24px;
    box-shadow: var(--shadow-lg);
    text-align: center;
    pointer-events: auto;
    z-index: 50;
    border: 1px solid var(--border-subtle);
}

.lock-icon {
    margin-bottom: 16px;
    color: var(--danger);
    opacity: 0.8;
}

.primary-action-btn {
    width: 100%;
    background: var(--primary);
    color: white;
    border: none;
    padding: 14px;
    border-radius: 12px;
    font-weight: 700;
    margin-top: 16px;
    cursor: pointer;
}

/* Location Mgmt Modal */
.location-mgmt-modal {
    max-width: 400px;
}

.locations-list {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    text-align: left;
}

.location-item-card {
    background: var(--bg-main);
    border: 1px solid var(--border-subtle);
    border-radius: 16px;
    padding: 16px;
}

.loc-main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.loc-info {
    display: flex;
    flex-direction: column;
}

.loc-name {
    font-weight: 700;
    font-size: 15px;
    color: var(--text-main);
}

.loc-code {
    font-size: 11px;
    color: var(--text-muted);
}

.status-pill {
    font-size: 9px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 12px;
    text-transform: uppercase;
}

.status-pill.active {
    background: #10b981;
    color: white;
}

.status-pill.inactive {
    background: #64748b;
    color: white;
}

.loc-actions {
    display: flex;
    gap: 8px;
}

.deactivate-btn {
    flex: 1;
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
    padding: 10px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
}

.activate-btn {
    flex: 1;
    background: var(--bg-card);
    color: var(--text-muted);
    border: 1px dashed var(--border-subtle);
    padding: 10px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    cursor: not-allowed;
}

.modal-info-box {
    margin-top: 20px;
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
    padding: 10px;
    border-radius: 8px;
    font-size: 11px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
}

.empty-state-mini {
    padding: 20px;
    color: var(--text-muted);
    font-style: italic;
    font-size: 13px;
}
</style>
