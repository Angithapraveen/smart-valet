<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1>Admin Dashboard</h1>
      <div class="user-info">
        <span>{{ user?.name }}</span>
        <button @click="handleLogout" class="logout-button">Logout</button>
      </div>
    </header>

    <main class="dashboard-content">
      <div v-if="loading" class="loading">Loading dashboard...</div>
      
      <div v-else class="stats-grid">
        <div class="stat-card">
          <h3>Total Locations</h3>
          <p class="stat-value">{{ dashboardData?.locations?.length || 0 }}</p>
        </div>

        <div class="stat-card">
          <h3>Total Transactions</h3>
          <p class="stat-value">{{ dashboardData?.totalTransactions || 0 }}</p>
        </div>

        <div class="stat-card" v-for="stat in dashboardData?.userStats" :key="stat.role_name">
          <h3>{{ stat.role_name }}s</h3>
          <p class="stat-value">{{ stat.count }}</p>
        </div>
      </div>

      <div class="locations-section">
        <h2>Locations</h2>
        <div v-if="dashboardData?.locations?.length === 0" class="empty-state">
          No locations found
        </div>
        <div v-else class="locations-grid">
          <div v-for="location in dashboardData?.locations" :key="location.location_id" class="location-card">
            <h3>{{ location.location_name }}</h3>
            <p><strong>Type:</strong> {{ location.location_type }}</p>
            <p><strong>Address:</strong> {{ location.address }}</p>
            <p><strong>Status:</strong> 
              <span :class="location.status ? 'status-active' : 'status-inactive'">
                {{ location.status ? 'Active' : 'Inactive' }}
              </span>
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default {
  name: 'AdminDashboard',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    
    const loading = ref(true);
    const dashboardData = ref(null);

    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/dashboard/admin`, {
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

    const handleLogout = () => {
      authStore.logout();
      router.push('/login');
    };

    onMounted(() => {
      if (!authStore.isAuthenticated || authStore.userRole !== 'ADMIN') {
        router.push('/login');
      } else {
        fetchDashboardData();
      }
    });

    return {
      user: authStore.user,
      loading,
      dashboardData,
      handleLogout
    };
  }
};
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f5f5f5;
}

.dashboard-header {
  background: white;
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dashboard-header h1 {
  color: #333;
  font-size: 24px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logout-button {
  padding: 8px 16px;
  background: #6545e5;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 14px 0 rgba(101, 69, 229, 0.4);
  position: relative;
  overflow: hidden;
}

.logout-button:hover {
  box-shadow: 0 6px 20px 0 rgba(101, 69, 229, 0.5);
  background: #7c5ef0;
}

.dashboard-content {
  padding: 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-card h3 {
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #333;
}

.locations-section {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.locations-section h2 {
  color: #333;
  margin-bottom: 20px;
}

.locations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.location-card {
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 6px;
}

.location-card h3 {
  color: #333;
  margin-bottom: 12px;
}

.location-card p {
  margin-bottom: 8px;
  color: #666;
  font-size: 14px;
}

.status-active {
  color: #28a745;
  font-weight: 600;
}

.status-inactive {
  color: #dc3545;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
