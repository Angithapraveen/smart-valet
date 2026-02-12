<template>
  <div class="dashboard-page">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card locations-card">
        <div class="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect><path d="M9 17V7h4a3 3 0 0 1 0 6H9"></path></svg>
        </div>
        <div class="card-content">
          <div class="card-label">Total Locations</div>
          <div class="card-value">{{ summary.total_locations }}</div>
        </div>
      </div>

      <div class="summary-card managers-card">
        <div class="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="22 14 19 11 16 14"></polyline></svg>
        </div>
        <div class="card-content">
          <div class="card-label">Total Managers</div>
          <div class="card-value">{{ summary.total_managers }}</div>
        </div>
      </div>

      <div class="summary-card drivers-card">
        <div class="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
        </div>
        <div class="card-content">
          <div class="card-label">Total Drivers</div>
          <div class="card-value">{{ summary.total_drivers }}</div>
        </div>
      </div>
    </div>

    <!-- My Locations Section -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
      <div class="section-header">
        <h2 class="text-xl font-semibold text-gray-800">My Locations</h2>
      </div>

      <div v-if="loading" class="loading-state">Loading locations...</div>
      
      <div v-else-if="locations.length === 0" class="empty-state">
        No locations assigned.
      </div>

      <div v-else class="locations-grid">
        <div v-for="loc in locations" :key="loc.location_id" class="location-card">
          <div class="loc-header">
            <div class="loc-title">
              <h3>{{ loc.location_name }}</h3>
              <span class="badge" :class="loc.status ? 'badge-success' : 'badge-danger'">
                {{ loc.status ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <div class="loc-type">{{ loc.location_type }}</div>
          </div>
          
          <div class="loc-address">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            {{ loc.address || 'No address provided' }}
          </div>

          <div class="loc-stats">
            <div class="stat-item">
              <span class="stat-val">{{ loc.total_blocks }}</span>
              <span class="stat-lbl">Blocks</span>
            </div>
            <div class="stat-item">
              <span class="stat-val text-success">{{ loc.available_slots }}</span>
              <span class="stat-lbl">Available</span>
            </div>
            <div class="stat-item">
              <span class="stat-val text-danger">{{ loc.occupied_slots }}</span>
              <span class="stat-lbl">Occupied</span>
            </div>
            <div class="stat-item">
              <span class="stat-val text-primary">{{ loc.active_parkings }}</span>
              <span class="stat-lbl">Active</span>
            </div>
          </div>

          <div class="loc-actions">
            <!-- <button class="action-btn" @click="viewDetails(loc.location_id, 'blocks')">View Blocks</button> -->
            <button class="action-btn" @click="toggleExpand(loc.location_id, 'managers')">View Managers</button>
            <button class="action-btn" @click="toggleExpand(loc.location_id, 'drivers')">View Drivers</button>
            <button class="action-btn primary" @click="viewDetails(loc.location_id)">View Details</button>
          </div>

          <!-- Expanded Content -->
          <div v-if="expandedLocations[loc.location_id]?.activeRole" class="mt-4 pt-4 border-t border-gray-200">
             
             <!-- Loading -->
             <div v-if="expandedLocations[loc.location_id].loading" class="text-center py-4">
                 <div class="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
             </div>
             
             <!-- Content List -->
             <div v-else>
                 <div class="mb-2 text-sm font-semibold text-gray-500 uppercase">{{ expandedLocations[loc.location_id].activeRole }}</div>
                 
                 <div v-if="getCurrentExpandedList(loc.location_id).length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-3">
                     <div v-for="user in getCurrentExpandedList(loc.location_id)" :key="user.user_id" 
                          class="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                         <p class="font-semibold text-gray-800">{{ user.name }}</p>
                         <p class="text-xs text-gray-500">{{ user.email_id }}</p>
                     </div>
                 </div>
                 
                 <div v-else class="text-sm text-gray-500 py-2">
                     No {{ expandedLocations[loc.location_id].activeRole }} found.
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
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const summary = ref({
  total_locations: 0,
  total_managers: 0,
  total_drivers: 0
});

const locations = ref([]);
const loading = ref(true);
const expandedLocations = ref({});

const fetchSummary = async () => {
  try {
    const response = await axios.get(`${API_URL}/dashboard/owner/summary`, { 
       headers: { Authorization: `Bearer ${authStore.token}` }
    });
    if (response.data.success) {
      summary.value = response.data.data;
    }
  } catch (error) {
    console.error('Error fetching summary:', error);
  }
};

const fetchLocations = async () => {
    try {
        const response = await axios.get(`${API_URL}/dashboard/owner/locations`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
            locations.value = response.data.data;
        }
    } catch (error) {
        console.error('Error fetching locations:', error);
    } finally {
        loading.value = false;
    }
};

const toggleExpand = async (locationId, role) => {
    // If opening same role, toggle off
    if (expandedLocations.value[locationId]?.activeRole === role) {
        delete expandedLocations.value[locationId];
        return;
    }

    // Initialize if not present
    if (!expandedLocations.value[locationId]) {
        expandedLocations.value[locationId] = {
            loading: false,
            data: null,
            activeRole: role
        };
    } else {
        // Just switch role if data exists
        expandedLocations.value[locationId].activeRole = role;
    }

    // Check if data needs fetching
    if (!expandedLocations.value[locationId].data) {
        expandedLocations.value[locationId].loading = true;
        try {
            const response = await axios.get(`${API_URL}/dashboard/owner/locations/${locationId}/users`, {
                headers: { Authorization: `Bearer ${authStore.token}` }
            });
            if (response.data.success) {
                expandedLocations.value[locationId].data = response.data.data;
            }
        } catch (error) {
            console.error('Error fetching location users:', error);
        } finally {
            expandedLocations.value[locationId].loading = false;
        }
    }
};

const getCurrentExpandedList = (locationId) => {
    const locState = expandedLocations.value[locationId];
    if (!locState || !locState.data) return [];
    
    // Map role to data key
    // API returns: { owners: [], managers: [], drivers: [] }
    return locState.data[locState.activeRole] || [];
};

const viewDetails = (id) => {
    router.push({ name: 'LocationDetails', params: { id } });
};

onMounted(() => {
    fetchSummary();
    fetchLocations();
});
</script>

<style scoped>
.dashboard-page {
  width: 100%;
}

.dashboard-header {
  margin-bottom: 24px;
}

.dashboard-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #333;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.summary-card {
  padding: 24px;
  border-radius: 12px;
  color: white;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.summary-card:hover {
  transform: translateY(-4px);
}

.locations-card { background: var(--gradient-locations); }
.owners-card { background: var(--gradient-owners); }
.managers-card { background: var(--gradient-managers); }
.drivers-card { background: var(--gradient-drivers); }

.card-icon {
  background: rgba(255,255,255,0.2);
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-content { flex: 1; }
.card-label { font-size: 14px; opacity: 0.9; margin-bottom: 4px; }
.card-value { font-size: 32px; font-weight: 700; line-height: 1; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.locations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
  padding: 24px;
}

.location-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
}

.loc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.loc-title h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.loc-type {
  background: #f0f0f0;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  color: #666;
}

.loc-address {
  display: flex;
  align-items: start;
  gap: 8px;
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
  line-height: 1.4;
}

.loc-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-val { font-weight: 700; font-size: 18px; margin-bottom: 4px; }
.stat-lbl { font-size: 11px; color: #888; text-transform: uppercase; }

.text-success { color: var(--status-available); }
.text-danger { color: var(--status-occupied); }
.text-primary { color: var(--primary); }

.loc-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* Only 3 buttons for owner */
  gap: 8px;
  margin-top: auto;
}

.action-btn {
  padding: 8px 4px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: #555;
  white-space: nowrap;
}

.action-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: #f8f9ff;
}

.action-btn.primary {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.action-btn.primary:hover {
  background: var(--primary-hover);
}
</style>
