<template>
  <div class="users-management animate-fade-in">
    <header class="page-header">
      <div>
        <h1 class="page-title">Users & Team</h1>
        <p class="subtitle" v-if="locationName">{{ locationName }}</p>
      </div>
      <div class="header-actions">
        <div class="live-indicator">
          <span class="dot animate-pulse"></span>
          Live Updates
        </div>
        <button @click="openAddDriverModal" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Driver
        </button>
      </div>
    </header>

    <!-- Tabs -->
    <div class="tabs-container">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
      >
        {{ tab.label }}
        <span class="count-badge" v-if="getCount(tab.id) > 0">{{ getCount(tab.id) }}</span>
      </button>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="loading && !users.length" class="loading-state">
      <div class="spinner"></div>
      <span>Loading team members...</span>
    </div>

    <div v-else-if="!filteredUsers.length" class="empty-state">
      <div class="empty-icon-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
      </div>
      <h3>No {{ activeTab }} Found</h3>
      <p>There are currently no {{ activeTab }} assigned to this location.</p>
    </div>

    <div v-else class="users-grid">
      <div v-for="user in filteredUsers" :key="user.user_id" class="user-card">
        <div class="user-card-header">
          <div class="user-avatar" :class="user.role_name.toLowerCase()">
            {{ user.name.charAt(0).toUpperCase() }}
          </div>
          <div class="user-main-info">
            <h3>{{ user.name }}</h3>
            <span class="user-role-tag">{{ user.role_name }}</span>
          </div>
          <div :class="['status-dot', user.status ? 'active' : 'inactive']" :title="user.status ? 'Active' : 'Inactive'"></div>
        </div>

        <div class="user-details">
          <div class="detail-row">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            <span>{{ user.email_id }}</span>
          </div>
          <div class="detail-row">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <span>{{ user.phone_number }}</span>
          </div>
          <div class="detail-row id-row">
            <span class="id-label">ID:</span>
            <span class="id-value">{{ user.user_id }}</span>
          </div>
        </div>

        <div class="user-card-actions" v-if="authStore.user.role !== 'MANAGER' || user.role_name !== 'MANAGER'">
          <button @click="openEditModal(user)" class="btn-action-outline">Edit</button>
          <button 
            @click="toggleStatus(user)" 
            :class="['btn-status', user.status ? 'btn-deactivate' : 'btn-activate']"
            :disabled="togglingId === user.user_id"
          >
            {{ togglingId === user.user_id ? '...' : (user.status ? 'Deactivate' : 'Activate') }}
          </button>
        </div>
        <div class="user-card-actions view-only" v-else>
          <span class="view-only-tag">View Only Access</span>
        </div>
      </div>
    </div>

    <!-- Add/Edit User Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Edit User Details' : 'Add New Driver' }}</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        
        <form @submit.prevent="handleSubmit" class="modal-body">
          <div v-if="modalError" class="modal-error-message">
            {{ modalError }}
          </div>

          <div class="form-group">
            <label class="form-label">Full Name <span class="required">*</span></label>
            <input v-model="form.name" type="text" required placeholder="e.g. John Doe" class="form-input" />
          </div>

          <div class="form-group">
            <label class="form-label">Email ID <span class="required">*</span></label>
            <input v-model="form.email_id" type="email" required placeholder="name@example.com" class="form-input" />
          </div>

          <div class="form-group">
            <label class="form-label">Phone Number <span class="required">*</span></label>
            <input v-model="form.phone_number" type="tel" required placeholder="e.g. +91 9876543210" class="form-input" />
          </div>

          <div class="form-group" v-if="!isEditing">
            <label class="form-label">Password <span class="required">*</span></label>
            <input v-model="form.password" type="password" required minlength="6" placeholder="Min 6 characters" class="form-input" />
          </div>

          <div class="modal-footer">
            <button type="button" @click="closeModal" class="btn btn-outline">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Saving...' : (isEditing ? 'Update Details' : 'Create Member') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';

const authStore = useAuthStore();
const users = ref([]);
const loading = ref(false);
const submitting = ref(false);
const togglingId = ref(null);
const error = ref(null);
const modalError = ref(null);
const locationName = ref('');
const locationId = ref(null);
const activeTab = ref('drivers');

const tabs = [
  { id: 'drivers', label: 'Drivers' },
  { id: 'managers', label: 'Managers' }
];

// Modal state
const showModal = ref(false);
const isEditing = ref(false);
const editingUserId = ref(null);

const form = ref({
  name: '',
  email_id: '',
  phone_number: '',
  password: ''
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const filteredUsers = computed(() => {
  return users.value.filter(u => {
    if (activeTab.value === 'drivers') return u.role_name === 'DRIVER';
    if (activeTab.value === 'managers') return u.role_name === 'MANAGER';
    return false;
  });
});

const getCount = (tabId) => {
  if (tabId === 'drivers') return users.value.filter(u => u.role_name === 'DRIVER').length;
  if (tabId === 'managers') return users.value.filter(u => u.role_name === 'MANAGER').length;
  return 0;
};

const fetchData = async (showLoading = true) => {
  if (showLoading && !users.value.length) loading.value = true;
  error.value = null;

  try {
    if (!authStore.accessibleLocations?.length) {
      error.value = 'No accessible location found.';
      loading.value = false;
      return;
    }

    locationId.value = authStore.accessibleLocations[0].location_id;
    locationName.value = authStore.accessibleLocations[0].location_name;

    // Fetch both managers and drivers for this location
    const [mgrRes, drvRes] = await Promise.all([
      axios.get(`${API_URL}/dashboard/owner/locations/${locationId.value}/users?type=managers`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      }),
      axios.get(`${API_URL}/dashboard/owner/locations/${locationId.value}/users?type=drivers`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
    ]);

    const combined = [];
    if (mgrRes.data.success) combined.push(...mgrRes.data.data);
    if (drvRes.data.success) combined.push(...drvRes.data.data);
    
    users.value = combined;
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to load team data.';
  } finally {
    loading.value = false;
  }
};

const openAddDriverModal = () => {
  isEditing.value = false;
  form.value = { name: '', email_id: '', phone_number: '', password: '' };
  modalError.value = null;
  showModal.value = true;
};

const openEditModal = (user) => {
  isEditing.value = true;
  editingUserId.value = user.user_id;
  form.value = {
    name: user.name,
    email_id: user.email_id,
    phone_number: user.phone_number
  };
  modalError.value = null;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  modalError.value = null;
};

const handleSubmit = async () => {
  submitting.value = true;
  modalError.value = null;

  try {
    let response;
    if (isEditing.value) {
      response = await axios.put(`${API_URL}/owner/user/${editingUserId.value}`, form.value, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      });
    } else {
      // Create Driver
      response = await axios.post(`${API_URL}/owner/location/${locationId.value}/driver`, form.value, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      });
    }

    if (response.data.success) {
      await fetchData();
      closeModal();
    } else {
      modalError.value = response.data.message || 'Action failed.';
    }
  } catch (err) {
    modalError.value = err.response?.data?.message || err.message || 'An error occurred.';
  } finally {
    submitting.value = false;
  }
};

const toggleStatus = async (user) => {
  if (togglingId.value) return;
  togglingId.value = user.user_id;
  
  try {
    const response = await axios.put(`${API_URL}/owner/user/${user.user_id}/status`, 
      { status: !user.status },
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    );

    if (response.data.success) {
      user.status = !user.status;
    }
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to update status.');
  } finally {
    togglingId.value = null;
  }
};

let pollInterval;
onMounted(() => {
  fetchData();
  pollInterval = setInterval(() => fetchData(false), 5000);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>
.users-management {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.subtitle {
  color: var(--text-muted);
  font-size: 16px;
  margin-top: 4px;
}

/* Tabs */
.tabs-container {
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
  background: var(--bg-main);
  padding: 6px;
  border-radius: 14px;
  width: fit-content;
  border: 1px solid var(--border-subtle);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.dot {
  width: 8px; height: 8px; background: #16a34a; border-radius: 50%;
}
.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
}

.tab-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: var(--ts-base);
}

.tab-btn:hover {
  color: var(--text-main);
}

.tab-btn.active {
  background: var(--bg-card);
  color: var(--primary);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-subtle);
}

.count-badge {
  font-size: 11px;
  background: var(--primary-light);
  color: var(--primary);
  padding: 2px 8px;
  border-radius: 8px;
}

/* Users Grid */
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.user-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  transition: var(--ts-base);
  box-shadow: var(--shadow-sm);
}

.user-card:hover {
  border-color: var(--primary-border);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.user-card-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 20px;
  font-family: 'Outfit', sans-serif;
  flex-shrink: 0;
}

.user-avatar.manager { background: var(--primary-light); color: var(--primary); }
.user-avatar.driver { background: var(--success-light); color: var(--success); }

.user-main-info { flex: 1; }
.user-main-info h3 { font-size: 17px; margin: 0 0 2px 0; color: var(--text-main); font-weight: 700; }
.user-role-tag { font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }

.status-dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--bg-card); box-shadow: 0 0 0 1px var(--border-subtle); }
.status-dot.active { background: var(--success); }
.status-dot.inactive { background: var(--text-muted); }

.user-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--bg-main);
  border-radius: 16px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--text-main);
  font-weight: 500;
}

.detail-row svg {
  color: var(--primary);
  opacity: 0.7;
}

.id-row { margin-top: 4px; border-top: 1px solid var(--border-subtle); padding-top: 10px; }
.id-label { font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
.id-value { font-family: monospace; font-size: 12px; color: var(--text-muted); }

.user-card-actions {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 12px;
  padding-top: 4px;
}

.btn-action-outline {
  padding: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--ts-base);
}

.btn-action-outline:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--bg-main);
}

.btn-status {
  padding: 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: var(--ts-base);
}

.btn-activate { background: var(--success-light); color: var(--success); }
.btn-activate:hover { background: var(--success); color: white; }

.btn-deactivate { background: var(--danger-light); color: var(--danger); }
.btn-deactivate:hover { background: var(--danger); color: white; }

.view-only {
  grid-column: span 2;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  background: var(--bg-main);
  border-radius: 12px;
  border: 1px dashed var(--border-subtle);
}

.view-only-tag {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Modal Styling Overhaul */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-card {
  background: var(--bg-card);
  width: 100%;
  max-width: 480px;
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

.required { color: var(--danger); margin-left: 2px; }

.modal-footer { margin-top: 32px; display: flex; justify-content: flex-end; gap: 12px; }

/* States */
.loading-state, .empty-state { min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); }

.spinner { width: 44px; height: 44px; border: 3px solid var(--border-subtle); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 20px; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-icon-container { width: 88px; height: 88px; background: var(--bg-main); border-radius: 24px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); opacity: 0.5; margin-bottom: 24px; }
.empty-state h3 { color: var(--text-main); font-size: 20px; margin-bottom: 8px; }

.error-message, .modal-error-message { padding: 12px 20px; background: var(--danger-light); border: 1px solid var(--danger); color: var(--danger); border-radius: 12px; margin-bottom: 24px; font-size: 14px; font-weight: 600; }
</style>
