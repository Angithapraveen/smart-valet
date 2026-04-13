<template>
  <div class="location-access-page">
    <div class="page-top-actions">
        <router-link to="/admin/owners" class="back-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Owners List
        </router-link>
    </div>

    <header class="page-header">
      <div class="header-info">
          <h1>Location Access Management</h1>
          <p class="subtitle">Assign and manage which locations each owner can access</p>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading data...</p>
    </div>
    <div v-else-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-else class="content-grid">
      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Owner Name</th>
                <th>Assigned Locations</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="owner in owners" :key="owner.user_id">
                <td class="font-bold">{{ owner.name }} <br><span class="id-hint">{{ owner.user_id }}</span></td>
                <td>
                  <div class="location-pills-container">
                      <span v-for="(loc, index) in (owner.location_names ? owner.location_names.split(', ') : [])" 
                            :key="index" 
                            class="location-name-pill">
                          {{ loc }}
                      </span>
                      <span v-if="!owner.location_names" class="empty-hint">No locations assigned</span>
                  </div>
                </td>
                <td class="text-right">
                  <button class="action-btn btn-edit" @click="openEditModal(owner)">
                    Edit Access
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
          <div class="locations-grid">
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
import { useToast } from '../../stores/toast';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default {
  name: 'LocationAccess',
  setup() {
    const authStore = useAuthStore();
    const toast = useToast();
    const owners = ref([]);
    const allLocations = ref([]);
    const loading = ref(true);
    const saving = ref(false);
    const errorMessage = ref('');
    
    // Modal state
    const showModal = ref(false);
    const selectedOwner = ref(null);
    const tempSelectedLocations = ref([]);

    const fetchData = async () => {
      loading.value = true;
      errorMessage.value = '';
      try {
        const [ownersRes, locationsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/admin/owners`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
          }),
          axios.get(`${API_BASE_URL}/admin/locations`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
          })
        ]);

        if (ownersRes.data.success) owners.value = ownersRes.data.data;
        if (locationsRes.data.success) allLocations.value = locationsRes.data.data;
      } catch (err) {
        errorMessage.value = err.response?.data?.message || 'Failed to load data.';
      } finally {
        loading.value = false;
      }
    };

    const openEditModal = (owner) => {
      selectedOwner.value = owner;
      // Get current location IDs for this owner
      // We need to fetch the IDs specifically or parse them if the API doesn't provide them nicely.
      // Looking at ownerController.js, getOwners returns location_names but not location_ids.
      // I should update ownerController.js to return location_ids as well.
      // For now, I'll assume I'll fix the backend to provide IDs.
      // Wait, let me check the ownerController.js getOwners query again.
      
      // Query in ownerController.js:
      // STRING_AGG(l.location_name, ', ') as location_names
      // I should change it to also include IDs.
      
      // For now, I'll just use an empty array and re-fetch if needed, or I'll fix the backend now.
      tempSelectedLocations.value = owner.location_ids ? owner.location_ids.split(',') : [];
      showModal.value = true;
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
          toast.success('Location access updated successfully');
          await fetchData(); // Refresh data
          closeModal();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to save access.');
      } finally {
        saving.value = false;
      }
    };

    onMounted(fetchData);

    return {
      owners,
      allLocations,
      loading,
      saving,
      errorMessage,
      showModal,
      selectedOwner,
      tempSelectedLocations,
      openEditModal,
      closeModal,
      isSelected,
      saveAccess
    };
  }
};
</script>

<style scoped>
.location-access-page {
  padding: 32px;
  max-width: 1400px;
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
}

.page-header {
    margin-bottom: 32px;
}

.header-info h1 {
    font-size: 28px;
    font-weight: 800;
    color: var(--text-main);
    margin: 0 0 4px 0;
}

.subtitle {
    font-size: 15px;
    color: var(--text-muted);
}

.table-card {
    background: var(--bg-card);
    border-radius: 16px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-subtle);
    overflow: hidden;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th {
    background: var(--bg-main);
    padding: 16px 24px;
    text-align: left;
    font-size: 12px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    border-bottom: 1px solid var(--border-subtle);
}

.data-table td {
    padding: 18px 24px;
    font-size: 14px;
    border-bottom: 1px solid var(--border-subtle);
    color: var(--text-main);
}

.id-hint {
    font-size: 11px;
    color: #94a3b8;
    font-family: monospace;
}

.location-pills-container {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.location-name-pill {
    font-size: 11px;
    background: var(--primary-light);
    color: var(--primary);
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 600;
    border: 1px solid var(--primary-border, var(--primary-light));
}

.empty-hint {
    color: #94a3b8;
    font-size: 12px;
    font-style: italic;
}

.action-btn {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
}

.btn-edit { background: var(--primary-light); color: var(--primary); border: 1px solid var(--primary-border, var(--primary-light)); }
.btn-edit:hover { background: var(--primary); color: white; }

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.5);
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
    box-shadow: var(--shadow-xl);
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
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: #64748b;
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
    background: var(--bg-main);
    border-radius: 12px;
    cursor: pointer;
    transition: var(--ts-base);
}

.location-checkbox-card:hover {
    border-color: var(--primary-light);
    background: var(--bg-card);
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
    color: #94a3b8;
}

.modal-footer {
    padding: 20px 24px;
    border-top: 1px solid var(--border-subtle);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.btn {
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
}

.btn-primary { background: var(--primary); color: white; }
.btn-secondary { background: var(--bg-main); color: var(--text-main); border: 1px solid var(--border-subtle); }

.loading-state, .spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px;
}

.spinner {
    width: 30px;
    height: 30px;
    border: 3px solid #f1f5f9;
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: rotate 0.8s linear infinite;
}

@keyframes rotate { to { transform: rotate(360deg); } }

.error-message {
    padding: 16px;
    background: #fef2f2;
    color: #ef4444;
    border-radius: 8px;
    margin: 20px 0;
    text-align: center;
}
</style>
