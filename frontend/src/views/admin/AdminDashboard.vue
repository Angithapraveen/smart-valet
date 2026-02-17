<template>
  <div class="dashboard-page animate-fade-in">
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

      <div class="summary-card owners-card">
        <div class="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        </div>
        <div class="card-content">
          <div class="card-label">Total Owners</div>
          <div class="card-value">{{ summary.total_owners }}</div>
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
    <div class="locations-section">
      <div class="section-header">
        <h2>My Locations</h2>
        <div class="header-actions">
          <button class="btn btn-outline" @click="$router.push('/admin/owners')">Manage Owners</button>
          <button class="btn btn-outline" @click="$router.push('/admin/locations')">All Locations</button>
          <button class="btn btn-primary" @click="$router.push('/admin/location/add')">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Location
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p class="mt-4">Loading locations...</p>
      </div>
      
      <div v-else-if="locations.length === 0" class="empty-state">
        <p>No locations found. Create your first location!</p>
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
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span>{{ loc.address || 'No address provided' }}</span>
          </div>

          <div class="loc-stats">
            <div class="stat-item">
              <span class="stat-val">{{ loc.total_blocks }}</span>
              <span class="stat-lbl">Blocks</span>
            </div>
            <div class="stat-item">
              <span class="stat-val text-success">{{ loc.available_slots }}</span>
              <span class="stat-lbl">Free</span>
            </div>
            <div class="stat-item">
              <span class="stat-val text-danger">{{ loc.occupied_slots }}</span>
              <span class="stat-lbl">Busy</span>
            </div>
            <div class="stat-item">
              <span class="stat-val text-primary">{{ loc.active_parkings }}</span>
              <span class="stat-lbl">In-use</span>
            </div>
          </div>

          <div class="loc-actions">
            <button class="btn btn-outline" @click="viewDetails(loc.location_id)">Details</button>
            <button class="btn btn-primary" @click="toggleExpand(loc.location_id, 'owners')">Expand View</button>
            
            <div class="expanded-actions" v-if="expandedLocations[loc.location_id]">
              <button class="btn" :class="expandedLocations[loc.location_id].activeRole === 'owners' ? 'btn-primary' : 'btn-outline'" @click="toggleExpand(loc.location_id, 'owners')">Owners</button>
              <button class="btn" :class="expandedLocations[loc.location_id].activeRole === 'managers' ? 'btn-primary' : 'btn-outline'" @click="toggleExpand(loc.location_id, 'managers')">Managers</button>
              <button class="btn" :class="expandedLocations[loc.location_id].activeRole === 'drivers' ? 'btn-primary' : 'btn-outline'" @click="toggleExpand(loc.location_id, 'drivers')">Drivers</button>
            </div>
          </div>

          <!-- Expanded Content -->
          <div v-if="expandedLocations[loc.location_id]?.activeRole" class="expanded-user-list animate-fade-in">
             <!-- Loading -->
             <div v-if="expandedLocations[loc.location_id].loading" class="text-center py-4">
                 <div class="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
             </div>
             
             <!-- Content List -->
             <div v-else>
                 <div class="grid grid-cols-1 gap-2">
                     <div v-for="user in getCurrentExpandedList(loc.location_id)" :key="user.user_id" class="user-tag-item">
                         <div class="user-tag-info">
                             <p>{{ user.name }}</p>
                             <span>{{ user.email_id }}</span>
                         </div>
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted"><polyline points="9 18 15 12 9 6"></polyline></svg>
                     </div>
                 </div>
                 
                 <div v-if="getCurrentExpandedList(loc.location_id).length === 0" class="text-xs text-muted py-2 text-center">
                     No {{ expandedLocations[loc.location_id].activeRole }} assigned.
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
  total_owners: 0,
  total_managers: 0,
  total_drivers: 0
});

const locations = ref([]);
const loading = ref(true);
const expandedLocations = ref({});

const fetchSummary = async () => {
  try {
    const response = await axios.get(`${API_URL}/dashboard/admin/summary`, { 
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
        const response = await axios.get(`${API_URL}/admin/locations`, {
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
            const response = await axios.get(`${API_URL}/dashboard/admin/locations/${locationId}/users`, {
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
    router.push({ name: 'AdminLocationDetails', params: { id } });
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
  margin-bottom: 32px;
}

.dashboard-header h1 {
  font-size: 36px;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -0.03em;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
}

.summary-card {
  padding: 24px;
  border-radius: 20px;
  background: white;
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: var(--shadow-sm);
  transition: var(--ts-base);
}

.summary-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-border);
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.locations-card .card-icon { background: var(--primary-light); color: var(--primary); }
.owners-card .card-icon { background: var(--success-light); color: var(--success); }
.managers-card .card-icon { background: var(--warning-light); color: var(--warning); }
.drivers-card .card-icon { background: var(--info-light); color: var(--info); }

.card-content { flex: 1; }
.card-label { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
.card-value { font-size: 32px; font-weight: 700; color: var(--text-main); line-height: 1; font-family: 'Outfit', sans-serif; }

/* My Locations Section */
.locations-section {
  background: white;
  border-radius: 24px;
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-main);
}

.section-header h2 {
  font-size: 20px;
  color: var(--text-main);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 60px;
  color: var(--text-muted);
  font-weight: 500;
}

.locations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 24px;
  padding: 32px;
}

.location-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  transition: var(--ts-base);
}

.location-card:hover {
  border-color: var(--primary-border);
  box-shadow: var(--shadow-md);
}

.loc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.loc-title h3 {
  font-size: 19px;
  font-weight: 700;
  margin-bottom: 6px;
  color: var(--text-main);
}

.loc-type {
  background: var(--bg-main);
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.loc-address {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 24px;
  line-height: 1.5;
}

.loc-address svg {
  margin-top: 3px;
  flex-shrink: 0;
  color: var(--primary);
}

.loc-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
  background: var(--bg-main);
  padding: 16px;
  border-radius: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-val { font-weight: 700; font-size: 18px; margin-bottom: 2px; color: var(--text-main); font-family: 'Outfit', sans-serif; }
.stat-lbl { font-size: 10px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }

.text-success { color: var(--success); }
.text-danger { color: var(--danger); }
.text-primary { color: var(--primary); }

.loc-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: auto;
}

.expanded-actions {
  grid-column: span 2;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 10px;
}

.loc-actions .btn {
  font-size: 12px;
  padding: 8px 4px;
}

.expanded-user-list {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-subtle);
}

.user-tag-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--bg-main);
  border-radius: 12px;
  border: 1px solid transparent;
  transition: var(--ts-base);
}

.user-tag-item:hover {
  background: white;
  border-color: var(--primary-border);
}

.user-tag-info p { font-weight: 600; font-size: 14px; color: var(--text-main); }
.user-tag-info span { font-size: 12px; color: var(--text-muted); }
</style>
