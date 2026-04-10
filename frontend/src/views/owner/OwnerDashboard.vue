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
          <div class="card-value">{{ visibleLocationCount }}</div>
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
          <div class="search-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Search by name or city..." 
              class="search-input"
            />
          </div>
        </div>
        <div class="header-actions">
           <!-- No specific owner actions for now -->
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p class="mt-4">Loading locations...</p>
      </div>
      
      <div v-else-if="locations.length === 0" class="empty-state">
        <p>No locations assigned to your account yet.</p>
      </div>

      <div v-else class="locations-grid" :class="gridCountClass">
        <div v-for="loc in filteredLocations" :key="loc.location_id" class="location-card">
          <div class="loc-card-header">
            <div class="loc-type-eyebrow">{{ loc.location_type }}</div>
            <div class="loc-title-row">
              <h3 class="loc-name">{{ loc.location_name }}</h3>
              <div class="loc-status-badge" :class="getLocStatusClass(loc)">
                <span class="dot"></span>
                {{ getLocStatusLabel(loc) }}
              </div>
            </div>
          </div>
          
          <div class="loc-address">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span class="address-text">{{ loc.address || 'No address provided' }}</span>
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
                v-for="role in ['managers', 'drivers']" 
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

    <EditLocationModal 
      :show="showEditLocationModal" 
      :location="selectedLocation"
      @close="closeEditLocationModal"
      @success="fetchSummary(); fetchLocations();"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';
import EditLocationModal from '../../components/admin/EditLocationModal.vue';

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
const searchQuery = ref('');
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

    // Filter out Inactive locations (NOT Active AND NOT Expired)
    // Only show Active and Expired
    result = result.filter(loc => {
        const expired = isExpired(loc);
        if (!loc.status && !expired) return false; // This is a hard-deactivated 'Inactive' location
        return true;
    });

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase().trim();
        result = result.filter(loc => 
            loc.location_name.toLowerCase().includes(query) || 
            (loc.address && loc.address.toLowerCase().includes(query))
        );
    }
    
    return result;
});

const visibleLocationCount = computed(() => filteredLocations.value.length);

const gridCountClass = computed(() => {
    const count = visibleLocationCount.value;
    if (count === 1) return 'grid-single';
    if (count === 2) return 'grid-double';
    return 'grid-standard';
});

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
        toggleExpand(locationId, 'managers');
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
    return locState.data[locState.activeRole] || [];
};

const viewDetails = (id) => {
    router.push({ name: 'OwnerLocationDetails', params: { id } });
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
}

.header-main-info {
  display: flex;
  align-items: center;
  gap: 24px;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
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

.loading-state, .empty-state {
  text-align: center;
  padding: 60px;
  color: var(--text-muted);
  font-weight: 500;
}

.locations-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding: 24px;
  width: 100%;
}

/* Dynamic grid layouts based on card count */
.locations-grid.grid-single { 
  grid-template-columns: minmax(auto, 520px); /* Controlled professional width for 1 card */
}
.locations-grid.grid-double { grid-template-columns: repeat(2, 1fr); }
.locations-grid.grid-standard { grid-template-columns: repeat(3, 1fr); }

/* Responsive adjustments */
@media (max-width: 1200px) {
    .locations-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
    .locations-grid { grid-template-columns: 1fr; }
}

.location-card {
  width: 100%;
  background: var(--bg-card);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
  position: relative;
  height: 100%; /* Equal height for all cards in a row */
}

.location-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px -8px rgba(0, 0, 0, 0.12);
  border-color: var(--primary-border);
}

.loc-card-header {
  margin-bottom: 16px;
}

.loc-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start; /* Align to the top of the first line of text */
}

.loc-type-eyebrow {
  font-size: 10px;
  font-weight: 800;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.7;
  margin-bottom: 4px;
}

.loc-name {
  font-size: 19px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.25;
  min-height: 48px; /* Consistent height for name area */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 70%; /* Match Admin style if badge is on same row */
}

.loc-status-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 10px;
  font-weight: 800;
  background: var(--bg-main);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  white-space: nowrap;
  flex-shrink: 0;
  border: 1px solid var(--border-subtle);
  margin-top: 2px; /* Fine-tuned alignment with the title's first line cap-height */
}

.loc-status-badge.active { 
  background: rgba(34, 197, 94, 0.1); 
  color: #16a34a;
  border-color: rgba(34, 197, 94, 0.2);
}
.loc-status-badge.inactive { 
  background: rgba(239, 68, 68, 0.1); 
  color: #dc2626;
  border-color: rgba(239, 68, 68, 0.2);
}

.dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }

.loc-address {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--text-muted);
  font-size: 13px;
  margin-bottom: 20px;
  font-weight: 500;
  line-height: 1.45;
  min-height: 40px; /* Reserves space for 2 lines of address */
}

.address-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.loc-address svg {
  margin-top: 2px;
  color: var(--primary);
  opacity: 0.7;
  flex-shrink: 0;
}

.loc-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: var(--bg-main);
  border-radius: 14px;
  padding: 10px 2px;
  border: 1px solid var(--border-subtle);
  margin-bottom: 0; /* Removed spacing here to connect with buttons */
  gap: 2px;
}

.stat-item { 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: center; 
  text-align: center; 
  border-right: 1px solid var(--border-subtle);
}
.stat-item:last-child { border-right: none; }

.stat-val { 
  font-size: 20px; 
  color: var(--text-main); 
  font-family: 'Outfit', sans-serif; 
  line-height: 1.2; 
  font-weight: 800;
  letter-spacing: -0.02em;
}
.stat-lbl { 
  font-size: 10px; 
  color: var(--text-muted); 
  font-weight: 700; 
  text-transform: uppercase; 
  letter-spacing: 0.12em; 
  margin-top: 6px; 
  opacity: 0.8;
}

.text-success { color: #16a34a; }
.text-danger { color: #dc2626; }
.text-primary { color: var(--primary); }

.loc-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px; /* Tight connection to stats */
  padding-top: 0;
  margin-bottom: 0;
}

.loc-actions .btn {
  flex: 1;
  padding: 12px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.edit-btn {
  color: var(--primary);
  background: var(--bg-main);
  border: 1.5px solid var(--border-subtle);
}

.edit-btn:hover {
  background: var(--primary-light);
  border-color: var(--primary);
  transform: scale(1.02);
}

.btn-outline {
  background: var(--bg-main);
  border: 1.5px solid var(--border-subtle);
  color: var(--text-main);
}

.btn-outline:hover {
  background: var(--bg-card);
  border-color: var(--primary);
  color: var(--primary);
  transform: scale(1.02);
}

.btn-primary {
  border: none;
  color: #ffffff;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  box-shadow: 0 4px 15px var(--primary-shadow);
}

.btn-primary:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 20px var(--primary-shadow);
}

.expanded-staff-section {
  margin-top: 32px;
  border-top: 1px solid var(--border-subtle);
  padding-top: 24px;
  display: flex;
  flex-direction: column;
}

.personnel-tabs {
  display: flex;
  background: var(--bg-main);
  padding: 6px;
  border-radius: 14px;
  margin-bottom: 20px;
  gap: 6px;
}

.tab-link {
  flex: 1;
  border: none;
  background: none;
  padding: 10px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.3s;
}

.tab-link.active {
  background: #ffffff;
  color: var(--primary);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.personnel-list-scroll {
  flex: 1;
  overflow-y: auto;
  max-height: 240px;
  padding-right: 8px;
}

/* Custom Scrollbar */
.personnel-list-scroll::-webkit-scrollbar { width: 5px; }
.personnel-list-scroll::-webkit-scrollbar-track { background: transparent; }
.personnel-list-scroll::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 10px; }

.user-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  background: var(--bg-main);
  border-radius: 16px;
  border: 1px solid var(--border-subtle);
  transition: border-color 0.2s;
}

.user-pill:hover {
  border-color: var(--primary-border);
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 4px 10px var(--primary-shadow);
}

.user-meta { display: flex; flex-direction: column; gap: 2px; }
.u-name { font-size: 14px; font-weight: 700; color: var(--text-main); margin: 0; }
.u-email { font-size: 12px; color: var(--text-muted); font-weight: 500; }

.loader-box { display: flex; justify-content: center; padding: 30px; }
.spinner-sm { width: 24px; height: 24px; border: 3px solid #f1f5f9; border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.no-data-msg { font-size: 13px; color: var(--text-muted); text-align: center; padding: 40px; font-weight: 700; letter-spacing: 0.02em; }

.animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.165, 0.84, 0.44, 1); }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 1024px) {
  .locations-grid { grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px; padding: 24px; }
}

@media (max-width: 768px) {
  .summary-cards { grid-template-columns: 1fr; }
  .locations-grid { 
    grid-template-columns: 1fr; 
    padding: 16px; 
    gap: 20px;
  }
  .loc-stats { grid-template-columns: repeat(2, 2fr); height: auto; padding: 16px; gap: 16px; }
  .stat-item { border-right: none; padding: 8px 0; }
  .header-main-info { flex-direction: column; align-items: flex-start; gap: 16px; }
  .search-input { width: 100%; }
  .search-input:focus { width: 100%; }
  .loc-actions { flex-direction: column; }
}
</style>
