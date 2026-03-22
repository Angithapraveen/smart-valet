<template>
<div class="vehicle-details-page">
    <div class="header">
        <button class="back-btn" @click="$router.push('/driver/dashboard')">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <div class="header-title">
            <span class="ticket-id">{{ vehicle.valet_id }}</span>
            <span class="car-make">{{ vehicle.car_model || 'Unknown Model' }}</span>
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
                <span class="label">Customer</span>
                <span class="value">{{ vehicle.customer_name }}</span>
            </div>
            <div class="info-item">
                <span class="label">Parked At</span>
                <span class="value">{{ formatTime(vehicle.parked_time) }}</span>
            </div>
            <div class="info-item">
                <span class="label">Make</span>
                <span class="value">{{ vehicle.car_model || 'Audi' }}</span>
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

                <!-- NEXT ACTION: RETURNED -->
                <div v-if="isCurrent('READY')" class="next-action-card">
                    <div class="action-icon returned-glow">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                    </div>
                    <button class="action-btn btn-returned" @click="updateStatus('RETURNED')" :disabled="updating || isAssignedToOther">
                        <span class="action-label">NEXT ACTION</span>
                        <span class="action-text">{{ updating ? 'PROSESSING...' : 'RETURNED' }}</span>
                    </button>
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
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
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
            if (newStatus === 'RETURNED') {
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
});
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

.car-make {
    font-size: 13px;
    color: var(--text-muted);
    font-weight: 500;
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

@keyframes spin { to { transform: rotate(360deg); } }
</style>
