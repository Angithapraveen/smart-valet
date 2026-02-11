<template>
  <div class="location-list-page">
    <header class="page-header">
      <h1>Locations</h1>
      <div class="header-actions">
        <router-link to="/admin/dashboard" class="back-link">← Dashboard</router-link>
        <router-link to="/admin/location/add" class="btn btn-primary">Add Location</router-link>
      </div>
    </header>

    <div v-if="loading" class="loading">Loading locations...</div>
    <div v-else-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-else class="table-wrapper">
      <table class="locations-table">
        <thead>
          <tr>
            <th>Location ID</th>
            <th>Name</th>
            <th>Type</th>
            <th>Valid From</th>
            <th>Valid To</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="locations.length === 0">
            <td colspan="7" class="empty-cell">No locations found.</td>
          </tr>
          <tr v-for="loc in locations" :key="loc.location_id">
            <td><code>{{ loc.location_id }}</code></td>
            <td>{{ loc.location_name }}</td>
            <td>{{ loc.location_type }}</td>
            <td>{{ formatDate(loc.valid_from) }}</td>
            <td>{{ loc.valid_to ? formatDate(loc.valid_to) : '—' }}</td>
            <td>
              <span :class="['status-badge', loc.status ? 'status-active' : 'status-inactive']">
                {{ loc.status ? 'Active' : 'Inactive' }}
              </span>
              <span v-if="isExpired(loc)" class="expired-hint">(Expired)</span>
            </td>
            <td>
              <button
                type="button"
                class="btn-sm"
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
  max-width: 1200px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}
.page-header h1 {
  font-size: 24px;
  color: #333;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.back-link {
  color: #6545e5;
  text-decoration: none;
  font-size: 14px;
}
.back-link:hover { text-decoration: underline; }
.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  border: none;
  cursor: pointer;
}
.btn-primary {
  background: #6545e5;
  color: white;
}
.btn-primary:hover { background: #7c5ef0; }
.loading, .error-message {
  padding: 24px;
  text-align: center;
}
.error-message { color: #dc2626; background: #fef2f2; border-radius: 8px; }
.table-wrapper {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  overflow-x: auto;
}
.locations-table {
  width: 100%;
  border-collapse: collapse;
}
.locations-table th,
.locations-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}
.locations-table th {
  background: #f9fafb;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
}
.locations-table td code {
  font-size: 13px;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
}
.empty-cell { color: #9ca3af; text-align: center; padding: 40px; }
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
.status-active { background: #d1fae5; color: #065f46; }
.status-inactive { background: #fee2e2; color: #991b1b; }
.expired-hint { font-size: 12px; color: #9ca3af; margin-left: 4px; }
.btn-sm {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
}
.btn-sm:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-enable { background: #d1fae5; color: #065f46; }
.btn-enable:hover:not(:disabled) { background: #a7f3d0; }
.btn-disable { background: #fee2e2; color: #991b1b; }
.btn-disable:hover:not(:disabled) { background: #fecaca; }
</style>
