<template>
  <div class="dashboard-page animate-fade-in">
    <div class="page-header">
      <div>
        <h1 class="page-title">Manager Dashboard</h1>
        <p class="page-subtitle">Welcome back, {{ user?.name || 'Manager' }}</p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p class="mt-4">Loading dashboard...</p>
    </div>
    
    <div v-else>
      <!-- Location Information -->
      <div v-if="dashboardData?.location" class="location-section mb-12">
        <h2 class="section-title">Operational Hub</h2>
        <div class="card location-card mt-6">
          <div class="loc-card-header">
            <div class="loc-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </div>
            <div class="loc-details">
              <h3>{{ dashboardData.location.location_name }}</h3>
              <div class="loc-meta">
                <span class="badge badge-info">{{ dashboardData.location.location_type }}</span>
                <span :class="['badge', dashboardData.location.status ? 'badge-success' : 'badge-danger']">
                  {{ dashboardData.location.status ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="loc-address-box">
            <p><strong>Primary Address:</strong> {{ dashboardData.location.address || 'Address not listed' }}</p>
          </div>
        </div>
      </div>

      <!-- Statistics Grid -->
      <div class="stats-grid">
        <div class="card stat-card">
          <div class="stat-icon transactions">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">Total Volume</span>
            <p class="stat-value">{{ dashboardData?.totalTransactions || 0 }}</p>
            <span class="stat-trend success">Active Transactions</span>
          </div>
        </div>

        <div class="card stat-card">
          <div class="stat-icon parkings">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">Live Parkings</span>
            <p class="stat-value primary-text">{{ dashboardData?.activeParkings || 0 }}</p>
            <span class="stat-trend info">Real-time update</span>
          </div>
        </div>

        <div class="card stat-card">
          <div class="stat-icon blocks">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">Capacity (Blocks)</span>
            <p class="stat-value warning-text">{{ dashboardData?.availableBlocks || 0 }}</p>
            <span class="stat-trend warning">Total Manageable Blocks</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default {
  name: 'ManagerDashboard',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    
    const loading = ref(true);
    const dashboardData = ref(null);

    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/dashboard/manager`, {
          headers: {
            Authorization: `Bearer ${authStore.token}`
          }
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

    onMounted(() => {
      const role = authStore.userRole ? authStore.userRole.toUpperCase() : '';
      if (!authStore.isAuthenticated || role !== 'MANAGER') {
        router.push('/login');
      } else {
        fetchDashboardData();
      }
    });

    return {
      user: authStore.user,
      loading,
      dashboardData
    };
  }
};
</script>

<style scoped>
.dashboard-page {
  width: 100%;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -0.01em;
}

.location-card {
  max-width: 600px;
}

.loc-card-header {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.loc-icon {
  width: 56px;
  height: 56px;
  background: var(--primary-light);
  color: var(--primary);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.loc-details h3 {
  font-size: 22px;
  margin-bottom: 8px;
  color: var(--text-main);
}

.loc-meta {
  display: flex;
  gap: 8px;
}

.loc-address-box {
  background: var(--bg-main);
  padding: 16px;
  border-radius: 12px;
  border-left: 4px solid var(--primary);
}

.loc-address-box p {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.6;
}

.loc-address-box strong {
  color: var(--text-main);
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.stat-card {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.transactions { background: var(--success-light); color: var(--success); }
.stat-icon.parkings { background: var(--primary-light); color: var(--primary); }
.stat-icon.blocks { background: var(--warning-light); color: var(--warning); }

.stat-content {
  flex: 1;
}

.stat-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.1;
  margin-bottom: 8px;
  font-family: 'Outfit', sans-serif;
}

.primary-text { color: var(--primary); }
.warning-text { color: var(--warning); }

.stat-trend {
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-trend.success { color: var(--success); }
.stat-trend.info { color: var(--info); }
.stat-trend.warning { color: var(--warning); }

.loading-state {
  text-align: center;
  padding: 80px 0;
  color: var(--text-muted);
}
</style>
