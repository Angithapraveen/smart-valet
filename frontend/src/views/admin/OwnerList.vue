<template>
  <div class="owner-list-page">
    <header class="page-header">
      <h1>Owners</h1>
      <div class="header-actions">
        <router-link to="/admin/dashboard" class="back-link">← Dashboard</router-link>
        <router-link to="/admin/owner/add" class="btn btn-primary">Add Owner</router-link>
      </div>
    </header>

    <div v-if="loading" class="loading">Loading owners...</div>
    <div v-else-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-else class="table-wrapper">
      <table class="owners-table">
        <thead>
          <tr>
            <th>Owner ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Locations</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="owners.length === 0">
            <td colspan="7" class="empty-cell">No owners found.</td>
          </tr>
          <tr v-for="owner in owners" :key="owner.user_id">
            <td><code>{{ owner.user_id }}</code></td>
            <td>{{ owner.name }}</td>
            <td>{{ owner.email_id }}</td>
            <td>{{ owner.phone_number }}</td>
            <td>
              <span class="location-count">{{ owner.location_count || 0 }}</span>
            </td>
            <td>
              <span :class="['status-badge', owner.status ? 'status-active' : 'status-inactive']">
                {{ owner.status ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>{{ formatDate(owner.created_at) }}</td>
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
  name: 'OwnerList',
  setup() {
    const authStore = useAuthStore();
    const owners = ref([]);
    const loading = ref(true);
    const errorMessage = ref('');

    const fetchOwners = async () => {
      loading.value = true;
      errorMessage.value = '';
      try {
        const response = await axios.get(`${API_BASE_URL}/admin/owners`, {
          headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
          owners.value = response.data.data;
        }
      } catch (err) {
        errorMessage.value = err.response?.data?.message || 'Failed to load owners.';
      } finally {
        loading.value = false;
      }
    };

    const formatDate = (d) => {
      if (!d) return '—';
      const date = new Date(d);
      return date.toLocaleDateString();
    };

    onMounted(fetchOwners);

    return {
      owners,
      loading,
      errorMessage,
      formatDate
    };
  }
};
</script>

<style scoped>
.owner-list-page {
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

.back-link:hover {
  text-decoration: underline;
}

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

.btn-primary:hover {
  background: #7c5ef0;
}

.loading,
.error-message {
  padding: 24px;
  text-align: center;
}

.error-message {
  color: #dc2626;
  background: #fef2f2;
  border-radius: 8px;
}

.table-wrapper {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.owners-table {
  width: 100%;
  border-collapse: collapse;
}

.owners-table th,
.owners-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.owners-table th {
  background: #f9fafb;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
}

.owners-table td code {
  font-size: 13px;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
}

.empty-cell {
  color: #9ca3af;
  text-align: center;
  padding: 40px;
}

.location-count {
  display: inline-block;
  background: #e0e7ff;
  color: #4338ca;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.status-active {
  background: #d1fae5;
  color: #065f46;
}

.status-inactive {
  background: #fee2e2;
  color: #991b1b;
}
</style>
