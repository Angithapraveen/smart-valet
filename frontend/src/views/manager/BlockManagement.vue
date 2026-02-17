<template>
  <div class="block-management animate-fade-in">
    <header class="page-header">
      <div>
        <h1 class="page-title">Block Management</h1>
        <p class="subtitle" v-if="locationName">{{ locationName }}</p>
      </div>
      <div class="header-actions">
        <button @click="showAddModal = true" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Block
        </button>
      </div>
    </header>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="loading && !blocks.length" class="loading-state">
      <div class="spinner"></div>
      <span>Loading blocks...</span>
    </div>

    <div v-else-if="!blocks.length" class="empty-state">
      <div class="empty-icon-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
      </div>
      <h3>No Blocks Found</h3>
      <p>Start by adding your first parking block.</p>
      <button @click="showAddModal = true" class="btn btn-outline mt-6">Add Block</button>
    </div>

    <div v-else class="blocks-list">
      <div v-for="block in blocks" :key="block.block_id" class="block-row-card">
        <div class="block-main-info">
          <div class="block-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20"></path><path d="M5 20V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12"></path><path d="M9 20v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"></path></svg>
          </div>
          <div class="block-details">
            <h3>{{ block.block_name }}</h3>
            <span class="block-id-tag">ID: {{ block.block_id }}</span>
          </div>
        </div>

        <div class="block-metrics">
          <div class="metric">
            <span class="metric-label">Capacity</span>
            <span class="metric-value badge badge-info">{{ block.capacity }} Slots</span>
          </div>
          <div class="metric">
            <span class="metric-label">Status</span>
            <span :class="['badge', block.status ? 'badge-success' : 'badge-danger']">
              {{ block.status ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="metric">
            <span class="metric-label">Validity Period</span>
            <span class="metric-value date">{{ formatDate(block.valid_from) }} - {{ formatDate(block.valid_to) }}</span>
          </div>
        </div>

        <div class="block-actions">
          <button @click="openEditModal(block)" class="btn-edit">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Edit block details
          </button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Edit Block' : 'Add New Block' }}</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        
        <form @submit.prevent="handleSubmit" class="modal-body">
          <div v-if="modalError" class="modal-error-message">
            {{ modalError }}
          </div>

          <div class="form-grid">
            <div class="form-group full-width">
              <label class="form-label">Block Name <span class="required">*</span></label>
              <input 
                v-model="form.block_name" 
                type="text" 
                required 
                placeholder="e.g. Area A, Floor 1" 
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Capacity <span class="required">*</span></label>
              <input 
                v-model.number="form.capacity" 
                type="number" 
                required 
                min="1" 
                max="1000"
                placeholder="Max slots" 
                class="form-input"
              />
              <span class="input-hint">Enter capacity between 1 to 1000.</span>
            </div>

            <div class="form-group">
              <label class="form-label">Operating Status</label>
              <select v-model="form.status" class="form-input">
                <option :value="true">Active</option>
                <option :value="false">Inactive</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Valid From <span class="required">*</span></label>
              <input 
                v-model="form.valid_from" 
                type="date" 
                required 
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Valid To <span class="required">*</span></label>
              <input 
                v-model="form.valid_to" 
                type="date" 
                required 
                class="form-input"
              />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" @click="closeModal" class="btn btn-outline">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Saving...' : (isEditing ? 'Update Block' : 'Create Block') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';

const authStore = useAuthStore();
const blocks = ref([]);
const loading = ref(false);
const submitting = ref(false);
const error = ref(null);
const modalError = ref(null);
const locationName = ref('');
const locationId = ref(null);

// Modal state
const showModal = ref(false);
const isEditing = ref(false);
const editingBlockId = ref(null);
const showAddModal = computed({
  get: () => showModal.value && !isEditing.value,
  set: (val) => {
    isEditing.value = false;
    showModal.value = val;
    if (val) resetForm();
  }
});

const form = ref({
  block_name: '',
  capacity: null,
  valid_from: '',
  valid_to: '',
  status: true
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const resetForm = () => {
  form.value = {
    block_name: '',
    capacity: null,
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    status: true
  };
  modalError.value = null;
};

const closeModal = () => {
  showModal.value = false;
  isEditing.value = false;
  editingBlockId.value = null;
  resetForm();
};

const openEditModal = (block) => {
  isEditing.value = true;
  editingBlockId.value = block.block_id;
  form.value = {
    block_name: block.block_name,
    capacity: block.capacity,
    valid_from: block.valid_from.split('T')[0],
    valid_to: block.valid_to.split('T')[0],
    status: block.status
  };
  showModal.value = true;
};

const fetchData = async () => {
  loading.value = true;
  error.value = null;

  try {
    if (!authStore.accessibleLocations?.length) {
      error.value = 'No accessible location found.';
      loading.value = false;
      return;
    }

    locationId.value = authStore.accessibleLocations[0].location_id;
    locationName.value = authStore.accessibleLocations[0].location_name;

    const response = await axios.get(`${API_URL}/owner/locations/${locationId.value}/blocks`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });

    if (response.data.success) {
      blocks.value = response.data.data;
    } else {
      error.value = response.data.message || 'Failed to fetch blocks.';
    }
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to load data.';
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  submitting.value = true;
  modalError.value = null;

  try {
    const url = isEditing.value 
      ? `${API_URL}/owner/blocks/${editingBlockId.value}`
      : `${API_URL}/owner/locations/${locationId.value}/blocks`;
    
    const method = isEditing.value ? 'put' : 'post';
    
    // Validate dates
    const fromDate = new Date(form.value.valid_from);
    const toDate = new Date(form.value.valid_to);
    if (fromDate >= toDate) {
      modalError.value = 'Valid From date must be before Valid To date.';
      submitting.value = false;
      return;
    }

    const response = await axios[method](url, form.value, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });

    if (response.data.success) {
      await fetchData();
      closeModal();
    } else {
      modalError.value = response.data.message || 'Failed to save block.';
    }
  } catch (err) {
    modalError.value = err.response?.data?.message || err.message || 'Error occurred while saving.';
  } finally {
    submitting.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

onMounted(fetchData);
</script>

<style scoped>
.block-management {
  width: 100%;
}

.subtitle {
  color: var(--text-muted);
  font-size: 16px;
  margin-top: 4px;
}

.blocks-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.block-row-card {
  background: white;
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  transition: var(--ts-base);
  box-shadow: var(--shadow-sm);
}

.block-row-card:hover {
  border-color: var(--primary-border);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.block-main-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.block-icon {
  width: 48px;
  height: 48px;
  background: var(--primary-light);
  color: var(--primary);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.block-details h3 {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 2px 0;
  color: var(--text-main);
}

.block-id-tag {
  font-size: 11px;
  background: var(--bg-main);
  padding: 2px 8px;
  border-radius: 6px;
  color: var(--text-muted);
  font-family: monospace;
  font-weight: 600;
}

.block-metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--bg-main);
  border-radius: 16px;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  font-weight: 700;
}

.metric-value {
  font-size: 13px;
  color: var(--text-main);
  font-weight: 600;
}

.metric-value.date {
  font-size: 12px;
  color: var(--text-muted);
}

.btn-edit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: white;
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--ts-base);
  width: 100%;
}

.btn-edit:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--bg-main);
}

/* Modal Styling Overhaul */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-card {
  background: white;
  width: 100%;
  max-width: 520px;
  border-radius: 24px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  animation: modalIn 0.3s var(--ease-out);
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  padding: 24px 32px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 { font-size: 20px; font-weight: 700; color: var(--text-main); margin: 0; }

.close-btn { 
  width: 32px; 
  height: 32px; 
  border-radius: 50%; 
  border: none; 
  background: var(--bg-main); 
  color: var(--text-muted); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  cursor: pointer; 
  transition: var(--ts-base);
  font-size: 20px;
}

.close-btn:hover { background: var(--danger-light); color: var(--danger); }

.modal-body { padding: 32px; }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.full-width {
  grid-column: span 2;
}

.required { color: var(--danger); margin-left: 2px; }

.input-hint {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 6px;
  font-weight: 500;
}

.modal-footer { margin-top: 32px; display: flex; justify-content: flex-end; gap: 12px; }

/* States */
.loading-state, .empty-state { min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); }

.spinner { width: 44px; height: 44px; border: 3px solid var(--border-subtle); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 20px; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-icon-container { width: 88px; height: 88px; background: var(--bg-main); border-radius: 24px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); opacity: 0.5; margin-bottom: 24px; }
.empty-state h3 { color: var(--text-main); font-size: 20px; margin-bottom: 8px; }

.error-message, .modal-error-message { padding: 12px 20px; background: var(--danger-light); border: 1px solid var(--danger); color: var(--danger); border-radius: 12px; margin-bottom: 24px; font-size: 14px; font-weight: 600; }
</style>
