<template>
  <div class="dashboard-page animate-fade-in">
    <header class="page-header">
      <div>
        <h1 class="page-title">Manager Dashboard</h1>
        <p class="subtitle">Overview for {{ dashboardData?.location?.location_name || 'Loading...' }}</p>
      </div>
      <div class="header-actions">
        <div v-if="isOverCapacity" class="capacity-alert animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            Key Slot Limit Reached!
        </div>
        <button class="settings-btn" @click="router.push('/manager/settings')" title="Configure Location">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </button>
        <div class="live-indicator">
          <span class="dot animate-pulse"></span>
          Live Updates
        </div>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>Loading dashboard data...</span>
    </div>

    <div v-else class="dashboard-content">
      <!-- 1. KPI Cards -->
      <div class="stats-grid">
        <div class="stat-card" :class="{ 'stat-danger': isOverCapacity }">
          <div class="stat-icon parkings" :class="{ 'icon-danger': isOverCapacity }">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M14 17h-5"/></svg>
          </div>
          <div class="stat-info">
            <span class="label">Live Parked</span>
            <span class="value">{{ dashboardData?.activeParkings || 0 }}</span>
            <span v-if="dashboardData?.location?.total_capacity" class="capacity-hint">
                of {{ dashboardData.location.total_capacity }}
            </span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon blocks">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </div>
          <div class="stat-info">
            <span class="label">Empty Slots</span>
            <span class="value">{{ dashboardData?.availableBlocks || 0 }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon transactions">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
          </div>
          <div class="stat-info">
            <span class="label">Today's Entry</span>
            <span class="value">{{ dashboardData?.todayStats?.entered || 0 }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon checkouts">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          </div>
          <div class="stat-info">
            <span class="label">Today's Exits</span>
            <span class="value">{{ dashboardData?.todayStats?.returned || 0 }}</span>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- 2. Block Status -->
        <div class="card block-status-section">
          <div class="card-header">
            <h3>Block Capacity Status</h3>
          </div>
          <div class="card-body">
            <div v-if="!dashboardData?.blocksData?.length" class="empty-text">No block data available.</div>
            <div v-else class="blocks-list">
              <div v-for="block in dashboardData.blocksData" :key="block.block_id" class="block-item">
                <div class="block-header">
                  <span class="block-name">{{ block.block_name }}</span>
                  <span class="block-capacity">{{ block.occupied }} / {{ block.capacity }} Occupied</span>
                </div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :class="getOccupancyClass(block.occupied, block.capacity)"
                    :style="{ width: getOccupancyPercent(block.occupied, block.capacity) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Recent Activity -->
        <div class="card activity-section">
          <div class="card-header">
            <h3>Recent Activity</h3>
            <router-link to="/manager/livetransactions" class="btn-link">View All</router-link>
          </div>
          <div class="card-body">
             <div v-if="!dashboardData?.recentActivity?.length" class="empty-text">No recent activity.</div>
             <ul v-else class="activity-list">
               <li v-for="txn in dashboardData.recentActivity" :key="txn.valet_id" class="activity-item">
                 <div class="activity-icon" :class="getActivityClass(txn.status)">
                    <svg v-if="txn.status === 'PARKED'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                 </div>
                 <div class="activity-details">
                    <p class="activity-text">
                      <strong>{{ txn.car_model || 'Vehicle' }}</strong>
                      <span v-if="txn.car_number" class="activity-plate">[{{ txn.car_number }}]</span>
                      <div v-if="txn.key_slot" 
                            class="activity-key-badge" 
                            :class="{ 'badge-danger': dashboardData?.location?.total_capacity > 0 && txn.key_slot > dashboardData.location.total_capacity }">
                        <span class="badge-label">KEYSLOT</span>
                        <span class="badge-value">{{ formatKeySlot(txn.key_slot) }}</span>
                      </div>
                      <span class="activity-status">{{ txn.status === 'PARKED' ? 'parked' : 'returned' }}</span>
                    </p>
                   <p class="activity-meta">
                     {{ txn.customer_name }} • {{ formatTime(txn.created_at) }}
                   </p>
                 </div>
               </li>
             </ul>
          </div>
        </div>
      </div>
      
      <!-- 4. Active Drivers -->
      <div class="card drivers-section mt-6">
        <div class="card-header">
          <h3>Workforce (Drivers)</h3>
        </div>
         <div class="card-body">
            <div v-if="!dashboardData?.drivers?.length" class="empty-text">No drivers associated with this location.</div>
            <div v-else class="drivers-grid">
               <div v-for="driver in dashboardData.drivers" :key="driver.user_id" class="driver-card">
                 <div class="driver-avatar">{{ getInitials(driver.name) }}</div>
                 <div class="driver-info">
                   <h4>{{ driver.name }}</h4>
                   <p>{{ driver.phone_number }}</p>
                   <span class="status-indicator active">Active</span>
                 </div>
               </div>
            </div>
         </div>
      </div>

    </div>

    <!-- Capacity Alert Toast -->
    <Transition name="slide-up">
        <div v-if="showToast" class="toast-alert danger">
            <div class="toast-content">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <span><strong>Capacity Limit Reached!</strong> New cars are being parked beyond the limit.</span>
            </div>
            <button @click="showToast = false" class="close-toast">&times;</button>
        </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(true);
const dashboardData = ref(null);
const isOverCapacity = ref(false);
const showToast = ref(false);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const fetchDashboardData = async (showLoading = true) => {
  try {
    if (showLoading && !dashboardData.value) loading.value = true;
    const response = await axios.get(`${API_BASE_URL}/dashboard/manager`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });

    if (response.data.success) {
      dashboardData.value = response.data.data;
      checkCapacity(response.data.data);
    }
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    if (error.response?.status === 401) {
      authStore.logout();
      router.push('/login');
    }
  } finally {
    loading.value = false;
  }
};

const checkCapacity = (data) => {
    const active = data.activeParkings || 0;
    const capacity = data.location?.total_capacity || 0;
    
    if (capacity > 0 && active > capacity) {
        if (!isOverCapacity.value) {
            showToast.value = true;
            // Auto close toast after 10 seconds
            setTimeout(() => { showToast.value = false; }, 10000);
        }
        isOverCapacity.value = true;
    } else {
        isOverCapacity.value = false;
        showToast.value = false;
    }
};


const getOccupancyPercent = (occupied, capacity) => {
  if (!capacity) return 0;
  return Math.round((occupied / capacity) * 100);
};

const getOccupancyClass = (occupied, capacity) => {
  const percent = getOccupancyPercent(occupied, capacity);
  if (percent >= 90) return 'progress-critical';
  if (percent >= 70) return 'progress-warning';
  return 'progress-success';
};

const getActivityClass = (status) => {
    return status === 'PARKED' ? 'icon-parked' : 'icon-returned';
};

const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    // Use relative time if recent
    const diff = Math.floor((now - date) / 60000); // minutes
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'DR';
};

const formatKeySlot = (id) => {
    if (!id) return '';
    return id.toString().padStart(3, '0');
};

let pollInterval;

onMounted(() => {
   if (!authStore.isAuthenticated) {
     router.push('/login');
     return;
   }
   fetchDashboardData();
   pollInterval = setInterval(() => fetchDashboardData(false), 5000);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>

.dashboard-page {
  padding: 24px 0;
  max-width: 100%;
  margin: 0;
}





.subtitle {
  color: var(--text-muted);
  font-size: 14px;
  margin-top: 4px;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(34, 197, 94, 0.1); /* green-100 */
  color: #16a34a;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-btn {
  background: white;
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}

.settings-btn:hover {
  background: var(--bg-main);
  color: var(--primary);
  border-color: var(--primary-light);
  transform: rotate(45deg);
}

.dot {
  width: 8px; height: 8px; background: #16a34a; border-radius: 50%;
}
.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s;
}
.stat-card:hover { transform: translateY(-2px); }

.stat-icon {
  width: 50px; height: 50px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}

.stat-icon.parkings { background: var(--primary-light); color: var(--primary); } /* blue */
.stat-icon.blocks { background: var(--success-light); color: var(--success); } /* green */
.stat-icon.transactions { background: var(--warning-light); color: var(--warning); } /* yellow */
.stat-icon.checkouts { background: var(--bg-main); color: var(--text-muted); } /* gray */

.stat-info { display: flex; flex-direction: column; }
.stat-info .label { font-size: 13px; color: var(--text-muted); font-weight: 500; }
.stat-info .value { font-size: 24px; font-weight: 700; color: var(--text-main); font-family: 'Outfit', sans-serif; line-height: 1.2; }

/* Dashboard Grid */
.dashboard-grid {
    display: grid;
    grid-template-columns: 2fr 1.5fr;
    gap: 24px;
}
@media (max-width: 900px) {
    .dashboard-grid { grid-template-columns: 1fr; }
}

.card {
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.card-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-subtle);
    display: flex; justify-content: space-between; align-items: center;
}
.card-header h3 { font-size: 16px; font-weight: 600; color: var(--text-main); }
.btn-link { font-size: 13px; color: var(--primary); font-weight: 500; text-decoration: none; }
.card-body { padding: 20px; }
.empty-text { color: var(--text-muted); font-size: 14px; padding: 10px 0; font-style: italic; }

/* Blocks */
.blocks-list { display: flex; flex-direction: column; gap: 16px; }
.block-item { display: flex; flex-direction: column; gap: 6px; }
.block-header { display: flex; justify-content: space-between; font-size: 14px; font-weight: 500; }
.block-capacity { font-size: 12px; color: var(--text-muted); }
.progress-bar { height: 8px; background: var(--bg-main); border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
.progress-success { background: var(--success); }
.progress-warning { background: var(--warning); }
.progress-critical { background: var(--danger); }

/* Activity */
.activity-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; }
.activity-item { display: flex; gap: 12px; align-items: flex-start; }
.activity-icon {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 12px;
}
.icon-parked { background: var(--primary-light); color: var(--primary); }
.icon-returned { background: var(--bg-main); color: var(--text-muted); }

.activity-details { font-size: 14px; line-height: 1.4; }
.activity-text { color: var(--text-main); }
.activity-status { font-weight: 400; color: var(--text-muted); }
.activity-plate {
    font-family: 'Outfit', monospace;
    font-size: 11px;
    font-weight: 700;
    color: var(--primary);
    margin: 0 4px;
    background: var(--primary-light);
    padding: 1px 4px;
    border-radius: 4px;
}
.activity-key {
    font-size: 11px;
    font-weight: 700;
    color: #0c4a6e;
    background: #e0f2fe;
    padding: 1px 6px;
    border-radius: 4px;
    margin-left: 4px;
    border: 1px solid #bae6fd;
}
.activity-meta { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

/* Drivers */
.drivers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
.driver-card {
    border: 1px solid var(--border-subtle);
    border-radius: 12px; padding: 12px;
    display: flex; align-items: center; gap: 12px;
}
.driver-avatar {
    width: 40px; height: 40px; background: var(--primary);
    color: white; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 600; font-size: 14px;
}
.driver-info h4 { font-size: 14px; font-weight: 600; color: var(--text-main); margin-bottom: 2px; }
.driver-info p { font-size: 12px; color: var(--text-muted); margin-bottom: 4px; }
.status-indicator { font-size: 11px; font-weight: 600; color: var(--success); }
.text-danger { color: #ef4444 !important; }

.activity-key-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    padding: 2px 8px;
    border-radius: 6px;
    margin: 0 4px;
}

.activity-key-badge .badge-label {
    font-size: 9px;
    font-weight: 800;
    color: #64748b;
    letter-spacing: 0.05em;
}

.activity-key-badge .badge-value {
    font-size: 12px;
    font-weight: 800;
    color: #0f172a;
    font-family: 'Outfit', sans-serif;
}

.activity-key-badge.badge-danger {
    background: #fef2f2;
    border-color: #fecaca;
}

.activity-key-badge.badge-danger .badge-value {
    color: #ef4444;
}

.activity-key-badge.badge-danger .badge-label {
    color: #b91c1c;
}

/* Capacity Alert UI */
.capacity-alert {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    border: 1px solid rgba(239, 68, 68, 0.3);
}
.animate-bounce {
    animation: bounce 1s infinite;
}
@keyframes bounce {
    0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
    50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
}

.stat-danger {
    border-color: rgba(239, 68, 68, 0.4) !important;
    background: rgba(239, 68, 68, 0.05) !important;
}
.icon-danger {
    background: rgba(239, 68, 68, 0.15) !important;
    color: #ef4444 !important;
}
.capacity-hint {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 600;
    margin-top: -2px;
}

.toast-alert {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #111827;
    color: white;
    padding: 12px 20px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    min-width: 320px;
    border-left: 4px solid #ef4444;
}
.toast-content { display: flex; align-items: center; gap: 12px; font-size: 14px; }
.toast-content svg { color: #ef4444; }
.close-toast {
    background: transparent;
    border: none;
    color: #9ca3af;
    font-size: 20px;
    cursor: pointer;
    line-height: 1;
}

/* Slide Up Transition */
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from { opacity: 0; transform: translate(-50%, 20px); }
.slide-up-leave-to { opacity: 0; transform: translate(-50%, 20px); }

</style>

