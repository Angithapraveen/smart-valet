<template>
  <div class="dashboard-page animate-fade-in">
    <header class="page-header">
      <div>
        <h1 class="page-title">Manager Dashboard</h1>
        <p class="subtitle">Overview for {{ dashboardData?.location?.location_name || 'Loading...' }}</p>
      </div>
      <div class="header-actions">
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
        <div class="stat-card">
          <div class="stat-icon parkings">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M14 17h-5"/></svg>
          </div>
          <div class="stat-info">
            <span class="label">Live Parked</span>
            <span class="value">{{ dashboardData?.activeParkings || 0 }}</span>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(true);
const dashboardData = ref(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const fetchDashboardData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/dashboard/manager`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });

    if (response.data.success) {
      dashboardData.value = response.data.data;
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

onMounted(() => {
   if (!authStore.isAuthenticated) {
     router.push('/login');
     return;
   }
   fetchDashboardData();
});
</script>

<style scoped>

.dashboard-page {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}


.page-header {
  /* Inherits global sticky styles */
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
</style>
