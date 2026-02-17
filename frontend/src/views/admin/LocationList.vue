<template>
  <div class="location-list-page">
    <div class="page-top-actions">
        <router-link to="/admin/dashboard" class="back-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Dashboard
        </router-link>
    </div>

    <header class="page-header">
      <div class="header-info">
          <h1>Locations List</h1>
          <p class="subtitle">Manage and monitor all parking locations</p>
      </div>
      <router-link to="/admin/location/add" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add New Location
      </router-link>
    </header>

    <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading locations...</p>
    </div>
    <div v-else-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-else class="table-card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Location ID</th>
              <th>Location Name</th>
              <th>Category</th>
              <th>Validity Period</th>
              <th>Current Status</th>
              <th class="text-right">Management</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="locations.length === 0">
              <td colspan="6" class="empty-state">No locations found. Start by adding one.</td>
            </tr>
            <tr v-for="loc in locations" :key="loc.location_id">
              <td><span class="id-badge">{{ loc.location_id }}</span></td>
              <td class="font-bold">{{ loc.location_name }}</td>
              <td><span class="category-tag">{{ loc.location_type }}</span></td>
              <td>
                <div class="validity-info">
                    <span>{{ formatDate(loc.valid_from) }}</span>
                    <span class="arrow">→</span>
                    <span>{{ loc.valid_to ? formatDate(loc.valid_to) : 'Permanent' }}</span>
                </div>
              </td>
              <td>
                <div class="status-wrapper">
                    <span :class="['status-pill', loc.status ? 'pill-active' : 'pill-inactive']">
                      {{ loc.status ? 'ACTIVE' : 'INACTIVE' }}
                    </span>
                    <span v-if="isExpired(loc)" class="expired-tag">EXPIRED</span>
                </div>
              </td>
              <td class="text-right">
                <button
                  type="button"
                  class="action-btn"
                  :class="loc.status ? 'btn-disable' : 'btn-enable'"
                  :disabled="togglingId === loc.location_id"
                  @click="toggleStatus(loc)"
                >
                  {{ togglingId === loc.location_id ? '...' : (loc.status ? 'Disable' : 'Enable') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default {
  name: 'LocationList',
  setup() {
    const authStore = useAuthStore();
    const locations = ref([]);
    const loading = ref(true);
    const errorMessage = ref('');
    const togglingId = ref(null);

    const fetchLocations = async () => {
      loading.value = true;
      errorMessage.value = '';
      try {
        const response = await axios.get(`${API_BASE_URL}/admin/locations`, {
          headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
          locations.value = response.data.data;
        }
      } catch (err) {
        errorMessage.value = err.response?.data?.message || 'Failed to load locations.';
      } finally {
        loading.value = false;
      }
    };

    const formatDate = (d) => {
      if (!d) return '—';
      const date = new Date(d);
      return date.toLocaleDateString();
    };

    const isExpired = (loc) => {
      if (!loc.valid_to) return false;
      return new Date(loc.valid_to) < new Date();
    };

    const toggleStatus = async (loc) => {
      togglingId.value = loc.location_id;
      try {
        const response = await axios.put(
          `${API_BASE_URL}/admin/locations/${encodeURIComponent(loc.location_id)}/status`,
          { status: !loc.status },
          { headers: { Authorization: `Bearer ${authStore.token}` } }
        );
        if (response.data.success) {
          loc.status = !loc.status;
        }
      } catch (err) {
        errorMessage.value = err.response?.data?.message || 'Failed to update status.';
      } finally {
        togglingId.value = null;
      }
    };

    onMounted(fetchLocations);

    return {
      locations,
      loading,
      errorMessage,
      togglingId,
      formatDate,
      isExpired,
      toggleStatus
    };
  }
};
</script>

<style scoped>
.location-list-page {
  padding: 24px;
  max-width: 1300px;
  margin: 0 auto;
}

.page-top-actions {
    margin-bottom: 20px;
}

.back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #64748b;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: color 0.2s;
}

.back-link:hover {
    color: var(--primary);
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 32px;
}

.header-info h1 {
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 4px 0;
    letter-spacing: -0.025em;
}

.subtitle {
    font-size: 15px;
    color: #64748b;
    margin: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(101, 69, 229, 0.2);
}

.btn-primary:hover {
    background: var(--primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 10px 15px -3px rgba(101, 69, 229, 0.3);
}

/* Table Design */
.table-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    border: 1px solid #f1f5f9;
    overflow: hidden;
}

.table-responsive {
    overflow-x: auto;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 800px;
}

.data-table th {
    background: #f8fafc;
    padding: 16px 24px;
    text-align: left;
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #f1f5f9;
}

.data-table td {
    padding: 18px 24px;
    font-size: 15px;
    color: #334155;
    border-bottom: 1px solid #f1f5f9;
}

.data-table tr:hover {
    background: #f8fafc;
}

.data-table tr:last-child td {
    border-bottom: none;
}

/* Data Elements */
.id-badge {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 12px;
    font-weight: 600;
    background: #f1f5f9;
    color: #475569;
    padding: 4px 8px;
    border-radius: 6px;
}

.font-bold {
    font-weight: 600;
    color: #1e293b;
}

.category-tag {
    font-size: 13px;
    background: #eff6ff;
    color: #2563eb;
    padding: 4px 10px;
    border-radius: 20px;
    font-weight: 500;
}

.validity-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #64748b;
}

.arrow {
    color: #94a3b8;
}

/* Status Styles */
.status-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.status-pill {
    display: inline-flex;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.025em;
    width: fit-content;
}

.pill-active { background: #dcfce7; color: #166534; }
.pill-inactive { background: #fee2e2; color: #991b1b; }

.expired-tag {
    font-size: 10px;
    font-weight: 800;
    color: #ef4444;
    letter-spacing: 0.05em;
}

/* Action Buttons */
.text-right { text-align: right; }

.action-btn {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
}

.btn-enable { background: #f0fdf4; color: #15803d; }
.btn-enable:hover:not(:disabled) { background: #dcfce7; }

.btn-disable { background: #fff1f2; color: #be123c; }
.btn-disable:hover:not(:disabled) { background: #fee2e2; }

.action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* States */
.loading-state {
    padding: 80px 24px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.spinner {
    width: 30px;
    height: 30px;
    border: 3px solid #f1f5f9;
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: rotate 0.8s linear infinite;
}

@keyframes rotate {
    to { transform: rotate(360deg); }
}

.error-message {
    padding: 24px;
    text-align: center;
    color: #ef4444;
    background: #fef2f2;
    border: 1px solid #fee2e2;
    border-radius: 12px;
    margin: 20px 0;
}

.empty-state {
    padding: 60px 24px;
    text-align: center;
    color: #94a3b8;
    font-size: 15px;
}

@media (max-width: 768px) {
    .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 20px;
    }
    
    .btn { width: 100%; justify-content: center; }
}
</style>
