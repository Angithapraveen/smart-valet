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

      <div v-else class="locations-grid">
        <div v-for="loc in filteredLocations" :key="loc.location_id" class="location-card">
          <div class="loc-card-header">
            <div class="loc-type-eyebrow">{{ loc.location_type }}</div>
            <div class="loc-title-row">
              <h3>{{ loc.location_name }}</h3>
              <div class="loc-status-badge" :class="loc.status ? 'active' : 'inactive'">
                <span class="dot"></span>
                {{ loc.status ? 'Active' : 'Inactive' }}
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
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
const searchQuery = ref('');
const expandedLocations = ref({});

const filteredLocations = computed(() => {
    if (!searchQuery.value) return locations.value;
    
    const query = searchQuery.value.toLowerCase().trim();
    return locations.value.filter(loc => 
        loc.location_name.toLowerCase().includes(query) || 
        (loc.address && loc.address.toLowerCase().includes(query))
    );
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
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
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
  background: var(--bg-card);
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
.managers-card .card-icon { background: var(--warning-light); color: var(--warning); }
.drivers-card .card-icon { background: var(--info-light); color: var(--info); }

.card-content { flex: 1; }
.card-label { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
.card-value { font-size: 32px; font-weight: 700; color: var(--text-main); line-height: 1; font-family: 'Outfit', sans-serif; }

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
  padding: 24px 32px;
  border-bottom: 1px solid var(--border-subtle);
}

.header-main-info {
  display: flex;
  align-items: center;
  gap: 24px;
}

.section-header h2 {
  font-size: 24px;
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
  padding: 10px 16px 10px 42px;
  background: var(--bg-main);
  border: 1.5px solid var(--border-subtle);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  width: 320px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  background: var(--bg-card);
  box-shadow: 0 0 0 4px var(--primary-light);
  width: 400px;
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
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 32px;
  align-items: start;
}

.location-card {
  background: var(--bg-card);
  border-radius: 24px;
  padding: 28px;
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  transition: all 0.3s var(--ts-base);
  box-shadow: var(--shadow-sm);
}

.loc-card-header {
  margin-bottom: 20px;
}

.loc-type-eyebrow {
  font-size: 11px;
  font-weight: 800;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 6px;
}

.loc-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loc-title-row h3 {
  font-size: 22px;
  font-weight: 700;
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
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  background: var(--bg-main);
  color: var(--text-muted);
}

.loc-status-badge.active { background: var(--success-light); color: var(--success); }
.loc-status-badge.inactive { background: var(--danger-light); color: var(--danger); }

.dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.loc-address {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--text-muted);
  font-size: 13px;
  margin-bottom: 24px;
  font-weight: 500;
  line-height: 1.5;
}

.loc-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: var(--bg-main);
  border-radius: 16px;
  border: 1px solid var(--border-subtle);
}

.stat-item { display: flex; flex-direction: column; align-items: center; text-align: center; }
.stat-val { font-size: 22px; color: var(--text-main); font-family: 'Outfit', sans-serif; line-height: 1.1; font-weight: 700; }
.stat-lbl { font-size: 9px; color: var(--text-muted); font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 6px; }

.text-success { color: var(--success); }
.text-danger { color: var(--danger); }
.text-primary { color: var(--primary); }

.loc-actions {
  display: flex;
  gap: 14px;
  margin-top: auto;
}

.loc-actions .btn {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline {
  background: var(--bg-main);
  border: 1.5px solid var(--border-subtle);
  color: var(--text-muted);
}

.btn-outline:hover {
  background: var(--bg-card);
  border-color: var(--primary);
  color: var(--text-main);
}

.btn-primary {
  border: none;
  color: #ffffff;
  background: var(--primary);
  box-shadow: 0 4px 12px var(--primary-shadow);
}

.expanded-staff-section {
  margin-top: 24px;
  border-top: 1px solid var(--border-subtle);
  padding-top: 20px;
  display: flex;
  flex-direction: column;
}

.personnel-tabs {
  display: flex;
  background: var(--bg-main);
  padding: 4px;
  border-radius: 10px;
  margin-bottom: 16px;
}

.tab-link {
  flex: 1;
  border: none;
  background: none;
  padding: 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.tab-link.active {
  background: var(--primary);
  color: white;
  box-shadow: 0 2px 6px var(--primary-shadow);
}

.personnel-list-scroll {
  flex: 1;
  overflow-y: auto;
  max-height: 200px;
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
  background: var(--bg-main);
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
}

.user-avatar {
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.user-meta { display: flex; flex-direction: column; gap: 1px; }
.u-name { font-size: 13px; font-weight: 700; color: var(--text-main); margin: 0; }
.u-email { font-size: 11px; color: var(--text-muted); font-weight: 500; }

.loader-box { display: flex; justify-content: center; padding: 20px; }
.spinner-sm { width: 20px; height: 20px; border: 2px solid #f1f5f9; border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.no-data-msg { font-size: 12px; color: var(--text-muted); text-align: center; padding: 20px; font-weight: 600; }

.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 768px) {
  .summary-cards { grid-template-columns: 1fr; }
  .locations-grid { grid-template-columns: 1fr; }
  .loc-stats { grid-template-columns: repeat(2, 1fr); }
  .header-main-info { flex-direction: column; align-items: flex-start; gap: 16px; }
  .search-input { width: 100%; }
  .search-input:focus { width: 100%; }
}
</style>
