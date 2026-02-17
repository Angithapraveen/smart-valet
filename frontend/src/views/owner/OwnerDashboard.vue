<template>
  <div class="dashboard-page animate-fade-in">
    <header class="dashboard-header">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Welcome back! Here's an overview of your locations and operations.</p>
    </header>

    <!-- Summary Cards -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="card-icon blue">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect><path d="M9 17V7h4a3 3 0 0 1 0 6H9"></path></svg>
        </div>
        <div class="card-info">
          <span class="card-label">Total Locations</span>
          <span class="card-value">{{ summary.total_locations }}</span>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-icon indigo">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="22 14 19 11 16 14"></polyline></svg>
        </div>
        <div class="card-info">
          <span class="card-label">Total Managers</span>
          <span class="card-value">{{ summary.total_managers }}</span>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-icon purple">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
        </div>
        <div class="card-info">
          <span class="card-label">Total Drivers</span>
          <span class="card-value">{{ summary.total_drivers }}</span>
        </div>
      </div>
    </div>

    <!-- My Locations Section -->
    <section class="locations-section">
      <div class="section-header">
        <h2 class="section-title">My Locations</h2>
        <div class="section-actions">
           <!-- Potential for filtering/search later -->
        </div>
      </div>

      <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <span>Loading locations...</span>
      </div>
      
      <div v-else-if="locations.length === 0" class="empty-state">
        <div class="empty-icon">📍</div>
        <p>No locations assigned to your account yet.</p>
      </div>

      <div v-else class="locations-grid">
        <div v-for="loc in locations" :key="loc.location_id" class="location-card">
          <div class="loc-card-inner">
            <div class="loc-header">
              <div class="loc-main">
                <h3 class="loc-name">{{ loc.location_name }}</h3>
                <span class="loc-tag">{{ loc.location_type }}</span>
              </div>
              <span class="badge" :class="loc.status ? 'badge-success' : 'badge-danger'">
                {{ loc.status ? 'Active' : 'Inactive' }}
              </span>
            </div>
            
            <div class="loc-address">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              {{ loc.address || 'No address provided' }}
            </div>

            <div class="loc-stats-grid">
              <div class="stat-box">
                <span class="stat-val">{{ loc.total_blocks }}</span>
                <span class="stat-lbl">Blocks</span>
              </div>
              <div class="stat-box accent-success">
                <span class="stat-val">{{ loc.available_slots }}</span>
                <span class="stat-lbl">Available</span>
              </div>
              <div class="stat-box accent-danger">
                <span class="stat-val">{{ loc.occupied_slots }}</span>
                <span class="stat-lbl">Occupied</span>
              </div>
              <div class="stat-box accent-primary">
                <span class="stat-val">{{ loc.active_parkings }}</span>
                <span class="stat-lbl">Active</span>
              </div>
            </div>

            <div class="loc-actions">
              <button class="btn-outline" :class="{ active: expandedLocations[loc.location_id]?.activeRole === 'managers' }" @click="toggleExpand(loc.location_id, 'managers')">Managers</button>
              <button class="btn-outline" :class="{ active: expandedLocations[loc.location_id]?.activeRole === 'drivers' }" @click="toggleExpand(loc.location_id, 'drivers')">Drivers</button>
              <button class="btn-primary" @click="viewDetails(loc.location_id)">View Details</button>
            </div>

            <!-- Expanded Content -->
            <Transition name="expand">
              <div v-if="expandedLocations[loc.location_id]?.activeRole" class="expanded-panel">
                <div class="panel-header">
                  <span class="panel-title">{{ expandedLocations[loc.location_id].activeRole }}</span>
                  <div v-if="expandedLocations[loc.location_id].loading" class="panel-loader"></div>
                </div>
                
                <div v-if="!expandedLocations[loc.location_id].loading">
                  <div v-if="getCurrentExpandedList(loc.location_id).length > 0" class="expanded-list">
                    <div v-for="user in getCurrentExpandedList(loc.location_id)" :key="user.user_id" class="expanded-item">
                      <div class="item-avatar">{{ user.name.charAt(0).toUpperCase() }}</div>
                      <div class="item-info">
                        <span class="item-name">{{ user.name }}</span>
                        <span class="item-email">{{ user.email_id }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-else class="panel-empty">
                    No {{ expandedLocations[loc.location_id].activeRole }} found.
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </section>
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
    router.push({ name: 'OwnerLocationDetails', params: { id } });
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
  margin-bottom: 40px;
}

.page-title {
  font-size: 32px;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 8px;
  font-family: 'Outfit', sans-serif;
  letter-spacing: -0.02em;
}

.page-subtitle {
  color: var(--text-muted);
  font-size: 16px;
  font-weight: 500;
}

/* Summary Grid */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
}

.summary-card {
  background: var(--bg-card);
  padding: 24px;
  border-radius: 24px;
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s var(--ts-base);
  box-shadow: var(--shadow-sm);
}

.summary-card:hover {
  transform: translateY(-4px);
  border-color: var(--primary-border);
  box-shadow: var(--shadow-md);
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon.blue { background: #eff6ff; color: #3b82f6; }
.card-icon.indigo { background: #eef2ff; color: #6366f1; }
.card-icon.purple { background: #f5f3ff; color: #8b5cf6; }

.card-info {
  display: flex;
  flex-direction: column;
}

.card-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.card-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-main);
  font-family: 'Outfit', sans-serif;
  line-height: 1;
}

/* My Locations Section */
.locations-section {
  background: transparent;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-main);
  font-family: 'Outfit', sans-serif;
}

.locations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
}

.location-card {
  background: var(--bg-card);
  border-radius: 28px;
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  transition: all 0.3s var(--ts-base);
  box-shadow: var(--shadow-sm);
}

.location-card:hover {
  border-color: var(--primary-border);
  box-shadow: var(--shadow-md);
}

.loc-card-inner {
  padding: 32px;
}

.loc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.loc-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 4px;
  font-family: 'Outfit', sans-serif;
}

.loc-tag {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-main);
  padding: 4px 12px;
  border-radius: 10px;
}

.loc-address {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 24px;
  font-weight: 500;
}

/* Stats Box Grid */
.loc-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}

.stat-box {
  background: var(--bg-main);
  padding: 12px 8px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: 1px solid var(--border-subtle);
}

.stat-val {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
  font-family: 'Outfit', sans-serif;
}

.stat-lbl {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.accent-success .stat-val { color: var(--success); }
.accent-danger .stat-val { color: var(--danger); }
.accent-primary .stat-val { color: var(--primary); }

/* Actions */
.loc-actions {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  padding: 10px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s var(--ease-out);
}

.btn-outline:hover, .btn-outline.active {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-light);
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 10px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px var(--primary-shadow);
  transition: all 0.2s var(--ease-out);
}

.btn-primary:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

/* Expanded Panel */
.expanded-panel {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-subtle);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.expanded-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.expanded-item {
  background: var(--bg-main);
  padding: 12px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--border-subtle);
}

.item-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.item-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-email {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-empty {
  padding: 24px;
  text-align: center;
  background: var(--bg-main);
  border-radius: 16px;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
}

/* Animations */
.expand-enter-active, .expand-leave-active {
  transition: max-height 0.4s var(--ease-out), opacity 0.4s var(--ease-out), transform 0.4s var(--ease-out);
  max-height: 500px;
  overflow: hidden;
}

.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

.panel-loader {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-subtle);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-subtle);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 16px;
  color: var(--text-muted);
  font-weight: 500;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

/* Badges */
.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.badge-success {
  background: #dcfce7;
  color: #166534;
}

.badge-danger {
  background: #fee2e2;
  color: #991b1b;
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .locations-grid {
    grid-template-columns: 1fr;
  }
  
  .loc-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
