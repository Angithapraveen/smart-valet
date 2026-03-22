<template>
  <div class="owner-list-page">
    <div class="page-top-actions">
        <router-link to="/admin/dashboard" class="back-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Dashboard
        </router-link>
    </div>

    <header class="page-header">
      <div class="header-info">
          <h1>Owners List</h1>
          <p class="subtitle">Manage and monitor all platform owners</p>
      </div>
      <button class="btn btn-primary" @click="showAddOwnerModal = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add New Owner
      </button>

      <AddOwnerModal 
        :show="showAddOwnerModal" 
        @close="showAddOwnerModal = false"
        @success="fetchOwners"
      />
    </header>

    <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading owners...</p>
    </div>
    <div v-else-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-else class="table-card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Owner ID</th>
              <th>Owner Name</th>
              <th>Email Address</th>
              <th>Phone</th>
              <th>Locations</th>
              <th>Account Status</th>
              <th>Joined Date</th>
              <th class="text-right">Management</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="owners.length === 0">
              <td colspan="9" class="empty-state">No owners found. Start by adding one.</td>
            </tr>
            <tr v-for="owner in owners" :key="owner.user_id">
              <td><span class="id-badge">{{ owner.user_id }}</span></td>
              <td class="font-bold">{{ owner.name }}</td>
              <td>{{ owner.email_id }}</td>
              <td>{{ owner.phone_number }}</td>
              <td>
                <div class="location-pills-container">
                    <span v-for="(loc, index) in (owner.location_names ? owner.location_names.split(', ') : [])" 
                          :key="index" 
                          class="location-name-pill">
                        {{ loc }}
                    </span>
                    <span v-if="!owner.location_names" class="empty-hint">None</span>
                </div>
              </td>
              <td>
                <span :class="['status-pill', owner.status ? 'pill-active' : 'pill-inactive']">
                  {{ owner.status ? 'ACTIVE' : 'INACTIVE' }}
                </span>
              </td>
              <td>{{ formatDate(owner.created_at) }}</td>
              <td class="text-right">
                <div class="management-actions">
                  <button type="button" class="action-btn btn-edit-access" @click="openEditModal(owner)">
                    Edit Access
                  </button>
                  <button
                    type="button"
                    class="action-btn"
                    :class="owner.status ? 'btn-disable' : 'btn-enable'"
                    :disabled="togglingId === owner.user_id"
                    @click="toggleStatus(owner)"
                  >
                    {{ togglingId === owner.user_id ? '...' : (owner.status ? 'Deactivate' : 'Activate') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit Access Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Manage Access: {{ selectedOwner?.name }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <p class="modal-hint">Select the locations this owner should have access to:</p>
          <div v-if="loadingLocations" class="modal-loading">
            <div class="spinner"></div>
            <p>Loading locations...</p>
          </div>
          <div v-else class="locations-grid">
            <label v-for="loc in allLocations" :key="loc.location_id" class="location-checkbox-card" :class="{ checked: isSelected(loc.location_id) }">
              <input type="checkbox" :value="loc.location_id" v-model="tempSelectedLocations">
              <div class="loc-card-content">
                <span class="loc-name">{{ loc.location_name }}</span>
                <span class="loc-id">{{ loc.location_id }}</span>
              </div>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal" :disabled="saving">Cancel</button>
          <button class="btn btn-primary" @click="saveAccess" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';
import AddOwnerModal from '../../components/admin/AddOwnerModal.vue';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default {
  name: 'OwnerList',
  components: {
    AddOwnerModal
  },
  setup() {
    const authStore = useAuthStore();
    const owners = ref([]);
    const loading = ref(true);
    const errorMessage = ref('');
    const togglingId = ref(null);
    const showModal = ref(false);
    const showAddOwnerModal = ref(false);
    const selectedOwner = ref(null);
    const allLocations = ref([]);
    const tempSelectedLocations = ref([]);
    const loadingLocations = ref(false);
    const saving = ref(false);

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

    const fetchLocations = async () => {
      if (allLocations.value.length > 0) return;
      loadingLocations.value = true;
      try {
        const response = await axios.get(`${API_BASE_URL}/admin/locations`, {
          headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
          allLocations.value = response.data.data;
        }
      } catch (err) {
        console.error('Failed to fetch locations:', err);
      } finally {
        loadingLocations.value = false;
      }
    };

    const openEditModal = (owner) => {
      selectedOwner.value = owner;
      tempSelectedLocations.value = owner.location_ids ? owner.location_ids.split(',') : [];
      showModal.value = true;
      fetchLocations();
    };

    const closeModal = () => {
      showModal.value = false;
      selectedOwner.value = null;
      tempSelectedLocations.value = [];
    };

    const isSelected = (id) => tempSelectedLocations.value.includes(id);

    const saveAccess = async () => {
      saving.value = true;
      try {
        const response = await axios.put(
          `${API_BASE_URL}/admin/owners/${encodeURIComponent(selectedOwner.value.user_id)}/locations`,
          { location_ids: tempSelectedLocations.value },
          { headers: { Authorization: `Bearer ${authStore.token}` } }
        );
        
        if (response.data.success) {
          await fetchOwners(); // Refresh list to update location pills
          closeModal();
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to save access.');
      } finally {
        saving.value = false;
      }
    };

    const formatDate = (d) => {
      if (!d) return '—';
      const date = new Date(d);
      return date.toLocaleDateString();
    };

    const toggleStatus = async (owner) => {
      togglingId.value = owner.user_id;
      try {
        const response = await axios.put(
          `${API_BASE_URL}/admin/owners/${encodeURIComponent(owner.user_id)}/status`,
          { status: !owner.status },
          { headers: { Authorization: `Bearer ${authStore.token}` } }
        );
        if (response.data.success) {
          owner.status = !owner.status;
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to update status.');
      } finally {
        togglingId.value = null;
      }
    };

    onMounted(fetchOwners);

    return {
      owners,
      loading,
      errorMessage,
      togglingId,
      showModal,
      selectedOwner,
      allLocations,
      tempSelectedLocations,
      loadingLocations,
      saving,
      formatDate,
      toggleStatus,
      openEditModal,
      closeModal,
      isSelected,
      saveAccess,
      showAddOwnerModal
    };
  }
};
</script>

<style scoped>
.page-top-actions {
    margin-bottom: 20px;
}

.back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--text-muted);
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
    align-items: center;
    margin-bottom: 32px;
}

.header-info h1 {
    font-size: 28px;
    font-weight: 800;
    color: var(--text-main);
    margin: 0 0 4px 0;
    letter-spacing: -0.025em;
}

.subtitle {
    font-size: 15px;
    color: var(--text-muted);
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
    background: var(--bg-card);
    border-radius: 16px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-subtle);
    overflow: hidden;
}

.table-responsive {
    overflow-x: auto;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 900px;
}

.data-table th {
    background: var(--bg-main);
    padding: 16px 24px;
    text-align: left;
    font-size: 12px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--border-subtle);
}

.data-table td {
    padding: 18px 24px;
    font-size: 14px;
    color: var(--text-main);
    border-bottom: 1px solid var(--border-subtle);
}

.data-table tr:hover {
    background: var(--bg-main);
}

.data-table tr:last-child td {
    border-bottom: none;
}

/* Data Elements */
.id-badge {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 12px;
    font-weight: 600;
    background: var(--bg-main);
    color: var(--text-muted);
    padding: 4px 8px;
    border-radius: 6px;
}

.font-bold {
    font-weight: 600;
    color: var(--text-main);
    font-size: 15px;
}

.location-pills-container {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    max-width: 300px;
}

.location-name-pill {
    font-size: 11px;
    background: var(--primary-light);
    color: var(--primary);
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 600;
    white-space: nowrap;
    border: 1px solid var(--primary-border);
}

.empty-hint {
    color: var(--text-muted);
    font-size: 12px;
    font-style: italic;
}

/* Status Styles */
.status-pill {
    display: inline-flex;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.025em;
    width: fit-content;
}

.pill-active { background: var(--success-light); color: var(--success); }
.pill-inactive { background: var(--danger-light); color: var(--danger); }

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

.btn-enable { background: var(--success-light); color: var(--success); }
.btn-enable:hover:not(:disabled) { background: var(--bg-main); border: 1px solid var(--success); }

.btn-disable { background: var(--danger-light); color: var(--danger); }
.btn-disable:hover:not(:disabled) { background: var(--bg-main); border: 1px solid var(--danger); }

.action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.management-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

.btn-edit-access {
    background: var(--primary-light);
    color: var(--primary);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
}

.btn-edit-access:hover {
    background: var(--bg-main);
    border: 1px solid var(--primary);
}

.btn-secondary {
    background: var(--bg-main);
    color: var(--text-muted);
}

.btn-secondary:hover {
    background: var(--bg-card);
    color: var(--text-main);
    border: 1px solid var(--border-subtle);
}

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
}

.modal-content {
    background: var(--bg-card);
    border-radius: 20px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-subtle);
}

.modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--text-main);
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: var(--text-muted);
    cursor: pointer;
}

.modal-body {
    padding: 24px;
    overflow-y: auto;
}

.modal-hint {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 20px;
}

.modal-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px;
    gap: 16px;
}

.locations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
}

.location-checkbox-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border: 2px solid var(--border-subtle);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
}

.location-checkbox-card:hover {
    border-color: var(--text-muted);
    background: var(--bg-main);
}

.location-checkbox-card.checked {
    border-color: var(--primary);
    background: var(--primary-light);
}

.loc-card-content {
    display: flex;
    flex-direction: column;
}

.loc-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-main);
}

.loc-id {
    font-size: 11px;
    color: var(--text-muted);
}

.modal-footer {
    padding: 20px 24px;
    border-top: 1px solid var(--border-subtle);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
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
    color: var(--danger);
    background: var(--danger-light);
    border: 1px solid var(--danger);
    border-radius: 12px;
    margin: 20px 0;
}

.empty-state {
    padding: 60px 24px;
    text-align: center;
    color: var(--text-muted);
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
