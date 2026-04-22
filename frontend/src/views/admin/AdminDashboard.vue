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
        <div class="header-main-info">
          <h2>My Locations</h2>
          <div class="header-filters">
            <div class="search-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Search by name or city..." 
                class="search-input"
              />
            </div>
            <div class="filter-box">
              <select v-model="statusFilter" class="filter-select">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" @click="$router.push('/admin/users')">Manage Users</button>
          <button class="btn btn-outline" @click="$router.push('/admin/owners')">Manage Owners</button>
          <button class="btn btn-outline" @click="$router.push('/admin/locations')">All Locations</button>
          <button class="btn btn-primary" @click="openAddLocationModal">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Location
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p class="mt-4">Loading locations...</p>
      </div>
      
      <div v-else-if="filteredLocations.length === 0" class="empty-state">
        <p v-if="statusFilter === 'active'">No active locations found.</p>
        <p v-else-if="statusFilter === 'inactive'">No inactive locations found.</p>
        <p v-else-if="statusFilter === 'expired'">No expired locations found.</p>
        <p v-else-if="searchQuery">No locations found matching "{{ searchQuery }}".</p>
        <p v-else>No locations found. Create your first location!</p>
      </div>

      <div v-else class="locations-grid">
        <div v-for="loc in filteredLocations" :key="loc.location_id" class="location-card">
          <div class="loc-card-header">
            <div class="loc-type-eyebrow">{{ loc.location_type }}</div>
            <div class="loc-title-row">
              <h3>{{ loc.location_name }}</h3>
              <div class="loc-status-badge" :class="getLocStatusClass(loc)">
                <span class="dot"></span>
                {{ getLocStatusLabel(loc) }}
              </div>
            </div>
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
            <button class="btn btn-outline" @click="viewDetails(loc.location_id)">View Details</button>
            <button class="btn btn-outline edit-btn" @click="openEditLocationModal(loc)">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
               Edit
            </button>
            <button 
              class="btn" 
              :class="expandedLocations[loc.location_id] ? 'btn-primary' : 'btn-outline'" 
              @click="toggleMainExpand(loc.location_id)"
            >
              {{ expandedLocations[loc.location_id] ? 'Close Staff' : 'Staff' }}
            </button>
          </div>

          <!-- Expanded Content -->
          <div v-if="expandedLocations[loc.location_id]" class="expanded-staff-section animate-fade-in">
            <div class="personnel-tabs">
              <button 
                v-for="role in ['owners', 'managers', 'drivers']" 
                :key="role"
                class="tab-link"
                :class="{ active: expandedLocations[loc.location_id].activeRole === role }"
                @click="toggleExpand(loc.location_id, role)"
              >
                {{ role }}
              </button>
            </div>

            <div class="personnel-list-scroll">
              <!-- Loading -->
              <div v-if="expandedLocations[loc.location_id].loading" class="loader-box">
                  <div class="spinner-sm"></div>
              </div>
              
              <!-- Content List -->
              <div v-else>
                  <div class="user-stack">
                      <div v-for="user in getCurrentExpandedList(loc.location_id)" :key="user.user_id" class="user-pill">
                          <div class="user-avatar">{{ getInitials(user.name) }}</div>
                          <div class="user-meta">
                              <p class="u-name">{{ user.name }}</p>
                              <span class="u-email">{{ user.email_id }}</span>
                          </div>
                      </div>
                  </div>
                  
                  <div v-if="getCurrentExpandedList(loc.location_id).length === 0" class="no-data-msg">
                      No {{ expandedLocations[loc.location_id].activeRole }}
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AddLocationModal 
      :show="showAddLocationModal" 
      @close="closeAddLocationModal"
      @success="handleLocationCreated"
    />

    <EditLocationModal 
      :show="showEditLocationModal" 
      :location="selectedLocation"
      @close="closeEditLocationModal"
      @success="fetchDashboardData"
    />

    <AddOwnerModal 
      :show="showAddOwnerModal"
      :preSelectedLocationId="newLocationId"
      @close="closeAddOwnerModal"
      @success="fetchDashboardData"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';
import AddLocationModal from '../../components/admin/AddLocationModal.vue';
import EditLocationModal from '../../components/admin/EditLocationModal.vue';
import AddOwnerModal from '../../components/admin/AddOwnerModal.vue';

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
const searchQuery = ref('');
const statusFilter = ref('all');
const expandedLocations = ref({});

const isExpired = (loc) => {
    if (!loc.valid_to) return false;
    return new Date(loc.valid_to) < new Date();
};

const getLocStatusLabel = (loc) => {
    if (isExpired(loc)) return 'Expired';
    return loc.status ? 'Active' : 'Inactive';
};

const getLocStatusClass = (loc) => {
    if (isExpired(loc)) return 'expired';
    return loc.status ? 'active' : 'inactive';
};

const filteredLocations = computed(() => {
    let result = locations.value;

    // Status Filter
    if (statusFilter.value !== 'all') {
        result = result.filter(loc => {
            const expired = isExpired(loc);
            if (statusFilter.value === 'active') return loc.status && !expired;
            if (statusFilter.value === 'inactive') return !loc.status && !expired;
            if (statusFilter.value === 'expired') return expired;
            return true;
        });
    }

    // Search Query Filter
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase().trim();
        result = result.filter(loc => 
            loc.location_name.toLowerCase().includes(query) || 
            (loc.address && loc.address.toLowerCase().includes(query))
        );
    }
    
    return result;
});

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
    loading.value = true;
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

const fetchDashboardData = async () => {
    await Promise.all([
        fetchSummary(),
        fetchLocations()
    ]);
};

// Modal Logic
const showAddLocationModal = ref(false);
const showAddOwnerModal = ref(false);
const newLocationId = ref(null);

const openAddLocationModal = () => {
    showAddLocationModal.value = true;
};

const closeAddLocationModal = () => {
    showAddLocationModal.value = false;
};

const closeAddOwnerModal = () => {
    showAddOwnerModal.value = false;
    newLocationId.value = null;
};

const handleLocationCreated = async (locationId) => {
    // 1. Refresh data to show new location
    await fetchDashboardData();
    
    // 2. Automatically move to Step 2: Owner Assignment
    newLocationId.value = locationId;
    showAddLocationModal.value = false;
    
    // Slight delay to ensure smooth transition
    setTimeout(() => {
        showAddOwnerModal.value = true;
    }, 300);
};

// Edit Modal Logic
const showEditLocationModal = ref(false);
const selectedLocation = ref(null);

const openEditLocationModal = (location) => {
    selectedLocation.value = location;
    showEditLocationModal.value = true;
};

const closeEditLocationModal = () => {
    showEditLocationModal.value = false;
    selectedLocation.value = null;
};

const toggleMainExpand = (locationId) => {
    if (expandedLocations.value[locationId]) {
        delete expandedLocations.value[locationId];
    } else {
        toggleExpand(locationId, 'owners');
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

const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

onMounted(() => {
    fetchSummary();
    fetchLocations();
});
</script>

<style scoped>
.dashboard-page {
  padding-top: 16px;
}

.dashboard-header {
  margin-bottom: 24px;
}

.dashboard-header h1 {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.04em;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.summary-card {
  padding: 16px 20px;
  border-radius: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-sm);
  transition: var(--ts-base);
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary);
  background: linear-gradient(to bottom right, var(--bg-card), var(--bg-main));
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
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
.card-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 2px; }
.card-value { font-size: 24px; font-weight: 800; color: var(--text-main); line-height: 1; font-family: 'Outfit', sans-serif; }

/* My Locations Section */
.locations-section {
  background: var(--bg-card);
  border-radius: 24px;
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
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

.header-main-info {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-filters {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  padding: 8px 12px 8px 36px;
  background: var(--bg-main);
  border: 1.5px solid var(--border-subtle);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-main);
  width: 260px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  background: var(--bg-card);
  box-shadow: 0 0 0 3px var(--primary-light);
  width: 320px;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.filter-select {
  padding: 8px 32px 8px 12px;
  background: var(--bg-main) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 10px center;
  border: 1.5px solid var(--border-subtle);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  appearance: none;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 140px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary);
  background-color: var(--bg-card);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.filter-select:hover {
  border-color: var(--primary-border);
}

.loc-status-badge.expired {
  background: #fef2f2;
  color: #ef4444;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 60px;
  color: var(--text-muted);
  font-weight: 500;
}

.locations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
  align-items: start;
  padding: 24px;
}

.location-card {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 20px;
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  transition: all 0.3s var(--ease-out);
  box-shadow: var(--shadow-sm);
}

.location-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.2);
  border-color: var(--primary);
}

.loc-card-header {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.loc-type-eyebrow {
  font-size: 9.5px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--primary);
  letter-spacing: 0.12em;
  opacity: 0.7;
}

.loc-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loc-title-row h3 {
  font-size: 18px;
  font-weight: 750;
  color: var(--text-main);
  letter-spacing: -0.02em;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;
}

.loc-status-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 800;
  background: var(--border-subtle);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.loc-status-badge.active {
  background: var(--success-light);
  color: var(--success);
}

.loc-status-badge.inactive {
  background: var(--danger-light);
  color: var(--danger);
}

.loc-status-badge .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.loc-address {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 13px;
  margin-bottom: 20px;
  height: 36px;
  overflow: hidden;
}

.loc-address svg {
  color: var(--primary);
  opacity: 0.6;
}

.loc-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: var(--bg-main);
  border-radius: 16px;
  height: 64px;
  border: 1px solid var(--border-subtle);
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  padding: 12px 4px;
}

.stat-item:last-child {
  border-right: none;
}

.stat-val { 
  font-weight: 800; 
  font-size: 18px; 
  color: var(--text-main); 
  font-family: 'Outfit', sans-serif;
  line-height: 1;
}

.stat-lbl { 
  font-size: 8px; 
  color: var(--text-muted); 
  font-weight: 700; 
  text-transform: uppercase; 
  letter-spacing: 0.1em;
  margin-top: 4px;
}

.text-success { color: var(--success); }
.text-danger { color: var(--danger); }
.text-primary { color: var(--primary); }

.loc-actions {
  display: flex;
  gap: 10px;
  margin-top: 0;
  padding-bottom: 8px;
}

.loc-actions .btn {
  flex: 1;
  font-size: 13px;
  padding: 10px;
  font-weight: 650;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.edit-btn {
  color: var(--primary);
}

.edit-btn:hover {
  background: var(--primary-light);
  border-color: var(--primary);
}

.expanded-staff-section {
  margin-top: 16px;
  background: var(--bg-main);
  border-radius: 14px;
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 500px;
  animation: slideDown 0.3s var(--ease-out);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.personnel-tabs {
  display: flex;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-subtle);
  padding: 4px;
}

.tab-link {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 10px;
}

.tab-link:hover {
  background: var(--bg-main);
  color: var(--primary);
}

.tab-link.active {
  color: #ffffff;
  background: var(--primary);
  box-shadow: 0 4px 12px var(--primary-shadow);
}

.personnel-list-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.user-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  transition: transform 0.2s;
}

.user-pill:hover {
  transform: translateX(4px);
  border-color: var(--primary-border);
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 11px;
  box-shadow: 0 4px 8px var(--primary-shadow);
}

.user-meta .u-name { font-weight: 650; font-size: 14px; color: var(--text-main); }
.user-meta .u-email { font-size: 11px; color: var(--text-muted); }

.loader-box { display: flex; justify-content: center; align-items: center; padding: 30px; }
.spinner-sm { width: 22px; height: 22px; border: 3px solid #e2e8f0; border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.no-data-msg { font-size: 13px; color: var(--text-muted); text-align: center; padding: 30px; font-weight: 500; }

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(12px) saturate(180%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
}

.modal-container {
    background: var(--bg-card);
    width: 680px;
    max-width: 100%;
    max-height: 90vh;
    border-radius: 32px;
    box-shadow: var(--shadow-xl);
    overflow-y: auto;
    border: 1px solid var(--border-subtle);
}

.modal-header {
    padding: 28px 40px;
    background: var(--bg-main);
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 10;
}

.header-content {
    display: flex;
    align-items: center;
    gap: 20px;
}

.icon-circle {
    width: 48px;
    height: 48px;
    background: var(--primary-light);
    color: var(--primary);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 16px -4px var(--primary-shadow);
}

.modal-header h3 {
    font-size: 20px;
    font-weight: 800;
    color: var(--text-main);
    margin: 0;
    font-family: 'Outfit', sans-serif;
    letter-spacing: -0.02em;
}

.modal-header p {
    font-size: 14px;
    color: var(--text-muted);
    margin: 4px 0 0 0;
    font-weight: 500;
}

.close-btn {
    background: var(--bg-main);
    border: 1px solid var(--border-subtle);
    color: var(--text-muted);
    cursor: pointer;
    padding: 8px;
    border-radius: 12px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-btn:hover {
    background: #fef2f2;
    color: #dc2626;
    border-color: #fee2e2;
    transform: rotate(90deg);
}

.modal-body {
    padding: 40px;
}

/* Form Sections */
.form-section {
  margin-bottom: 32px;
  background: var(--bg-main);
  padding: 24px;
  border-radius: 20px;
  border: 1px solid var(--border-subtle);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 800;
  color: var(--text-main);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 24px;
}

.section-title .number {
  background: var(--primary);
  color: white;
  font-size: 10px;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-error {
    background: #fff1f2;
    color: #be123c;
    padding: 16px 20px;
    border-radius: 16px;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 32px;
    border: 1px solid #ffe4e6;
    display: flex;
    align-items: center;
    gap: 12px;
    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

.modal-form .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
}

.modal-form .form-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.modal-form .full-width {
    grid-column: span 2;
}

.modal-form label {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-muted);
    margin-left: 4px;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.required-dot {
  position: absolute;
  right: 16px;
  color: #fb7185;
  font-size: 20px;
  pointer-events: none;
}

.modal-form input, .modal-form select, .modal-form textarea {
    width: 100%;
    padding: 14px 18px;
    background: var(--bg-card);
    border: 1.5px solid var(--border-subtle);
    border-radius: 16px;
    font-size: 15px;
    font-weight: 500;
    color: var(--text-main);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.modal-form input:hover, .modal-form select:hover, .modal-form textarea:hover {
    border-color: var(--primary-light);
    background: var(--bg-main);
}

.modal-form input:focus, .modal-form select:focus, .modal-form textarea:focus {
    outline: none;
    border-color: var(--primary);
    background: var(--bg-card);
    box-shadow: 0 0 0 5px var(--primary-light);
    transform: translateY(-1px);
}

.uppercase.font-mono {
    text-transform: uppercase;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.15em;
    font-size: 16px;
    font-weight: 800;
}

.hint {
    font-size: 11px;
    color: #94a3b8;
    margin-left: 4px;
    font-weight: 600;
}

.form-options-row {
    margin-top: 8px;
    padding: 24px 32px;
    background: var(--bg-main);
    border-radius: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid var(--border-subtle);
}

.operational-label h4 {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0 0 4px 0;
}

.operational-label p {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

.premium-toggle {
    position: relative;
    cursor: pointer;
}

.premium-toggle input { display: none; }

.premium-toggle .toggle-slider {
    width: 52px;
    height: 28px;
    background: #e2e8f0;
    border-radius: 100px;
    display: block;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.premium-toggle .toggle-slider::before {
    content: '';
    position: absolute;
    width: 22px;
    height: 22px;
    background: white;
    border-radius: 50%;
    top: 3px;
    left: 3px;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.premium-toggle input:checked + .toggle-slider { 
    background: var(--success); 
    box-shadow: 0 0 15px rgba(34, 197, 94, 0.3);
}

.premium-toggle input:checked + .toggle-slider::before { 
    transform: translateX(24px); 
}

.modal-footer {
    margin-top: 48px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 20px;
}

.btn-premium {
  padding: 16px 32px;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  font-size: 16px;
  box-shadow: 0 12px 24px -6px var(--primary-shadow);
}

.btn-premium:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 18px 32px -8px var(--primary-shadow);
}

.btn-premium:active {
  transform: translateY(0) scale(0.98);
}

.btn-text {
  font-family: 'Outfit', sans-serif;
}

.animate-slide-up {
    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(40px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 640px) {
  .modal-form .form-grid { grid-template-columns: 1fr; }
  .modal-body { padding: 24px; }
  .modal-header { padding: 20px 24px; }
  .form-section { padding: 16px; }
  .form-options-row { flex-direction: column; gap: 16px; text-align: center; }
  .modal-footer { flex-direction: column-reverse; width: 100%; }
  .modal-footer .btn { width: 100%; }
}
</style>

