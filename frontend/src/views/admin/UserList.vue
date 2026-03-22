<template>
  <div class="user-list-page animate-fade-in">
    <div class="page-header">
      <div class="header-main">
        <button class="back-btn" @click="$router.push('/admin/dashboard')">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <h1>Manage Users</h1>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search by name, email, phone or location..." 
            class="search-input"
          />
        </div>
        <select v-model="roleFilter" class="filter-select">
          <option value="ALL">All Roles</option>
          <option value="OWNER">Owners</option>
          <option value="MANAGER">Managers</option>
          <option value="DRIVER">Drivers</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Fetching users...</p>
    </div>

    <div v-else-if="filteredUsers.length === 0" class="empty-state">
      <p>No users found matching your criteria.</p>
    </div>

    <div v-else class="users-grid">
      <div v-for="user in filteredUsers" :key="user.user_id" class="user-card" :class="{ inactive: !user.status }">
        <div class="user-card-header">
          <div class="user-avatar-large">{{ getInitials(user.name) }}</div>
          <div class="user-info-main">
            <h3>{{ user.name }}</h3>
            <span class="role-badge" :class="user.role_name.toLowerCase()">{{ user.role_name }}</span>
          </div>
          <div class="status-toggle">
            <label class="switch">
              <input type="checkbox" :checked="user.status" @change="toggleUserStatus(user)">
              <span class="slider round"></span>
            </label>
          </div>
        </div>

        <div class="user-details">
          <div class="detail-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            <span>{{ user.email_id }}</span>
          </div>
          <div class="detail-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <span>{{ user.phone_number }}</span>
          </div>
          <div class="detail-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span class="location-names" :title="user.location_names">
              {{ user.location_count > 0 ? user.location_names : 'No locations assigned' }}
            </span>
          </div>
        </div>

        <div class="user-actions">
          <button class="btn btn-primary-light" @click="openEditModal(user)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Edit Details
          </button>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-container animate-slide-up">
        <div class="modal-header">
          <div class="header-content">
            <div class="icon-circle">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </div>
            <h3>Edit User Details</h3>
          </div>
          <button class="close-btn" @click="closeEditModal">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <form @submit.prevent="handleUpdateUser" class="modal-form">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" v-model="editForm.name" required />
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" v-model="editForm.email_id" required />
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <input type="text" v-model="editForm.phone_number" required />
          </div>
          <div class="form-group">
            <label>New Password (Optional)</label>
            <div class="password-input-wrapper">
              <input :type="showPassword ? 'text' : 'password'" v-model="editForm.password" placeholder="Leave blank to keep current" />
              <button type="button" @click="showPassword = !showPassword" class="eye-btn">
                <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              </button>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" @click="closeEditModal">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../../stores/auth';
import { useToast } from '../../stores/toast';

const authStore = useAuthStore();
const toast = useToast();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const users = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const roleFilter = ref('ALL');

const showEditModal = ref(false);
const showPassword = ref(false);
const saving = ref(false);
const editForm = ref({
  user_id: '',
  name: '',
  email_id: '',
  phone_number: '',
  password: ''
});

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await axios.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    if (response.data.success) {
      users.value = response.data.data;
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    toast.error('Failed to load users');
  } finally {
    loading.value = false;
  }
};

const filteredUsers = computed(() => {
  return users.value.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.email_id.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.phone_number.includes(searchQuery.value) ||
      (user.location_names && user.location_names.toLowerCase().includes(searchQuery.value.toLowerCase()));
    
    const matchesRole = roleFilter.value === 'ALL' || user.role_name === roleFilter.value;
    
    return matchesSearch && matchesRole;
  });
});

const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const toggleUserStatus = async (user) => {
  const newStatus = !user.status;
  try {
    const response = await axios.put(`${API_URL}/admin/users/${user.user_id}/status`, 
      { status: newStatus },
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    );
    if (response.data.success) {
      user.status = newStatus;
      toast.success(`User ${newStatus ? 'activated' : 'deactivated'}`);
    }
  } catch (error) {
    console.error('Error toggling status:', error);
    toast.error('Failed to update user status');
    // Revert checkbox state
    fetchUsers();
  }
};

const openEditModal = (user) => {
  editForm.value = {
    user_id: user.user_id,
    name: user.name,
    email_id: user.email_id,
    phone_number: user.phone_number
  };
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
};

const handleUpdateUser = async () => {
  saving.value = true;
  try {
    const response = await axios.put(`${API_URL}/admin/users/${editForm.value.user_id}`, 
      editForm.value,
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    );
    if (response.data.success) {
      const index = users.value.findIndex(u => u.user_id === editForm.value.user_id);
      if (index !== -1) {
        users.value[index] = { ...users.value[index], ...editForm.value };
      }
      toast.success('User details updated successfully');
      closeEditModal();
    }
  } catch (error) {
    console.error('Error updating user:', error);
    toast.error(error.response?.data?.message || 'Failed to update user details');
  } finally {
    saving.value = false;
  }
};

onMounted(fetchUsers);
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-main h1 {
  font-size: 32px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
}

.back-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--bg-soft);
  color: var(--primary);
  border-color: var(--primary-border);
  transform: translateX(-4px);
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  padding: 12px 16px 12px 42px;
  background: var(--bg-card);
  border: 1.5px solid var(--border-subtle);
  border-radius: 14px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  width: 300px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
  width: 360px;
}

.filter-select {
  padding: 12px 16px;
  background: var(--bg-card);
  border: 1.5px solid var(--border-subtle);
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  cursor: pointer;
  outline: none;
}

.filter-select:focus {
  border-color: var(--primary);
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

.user-card {
  background: var(--bg-card);
  border-radius: 24px;
  padding: 24px;
  border: 1px solid var(--border-subtle);
  transition: all 0.3s var(--ease-out);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
}

.user-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-light);
}

.user-card.inactive {
  opacity: 0.7;
  background: var(--bg-main);
}

.user-card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.user-avatar-large {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  box-shadow: 0 8px 16px var(--primary-shadow);
}

.user-info-main {
  flex: 1;
}

.user-info-main h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 4px;
}

.role-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.role-badge.owner { background: var(--success-light); color: var(--success); }
.role-badge.manager { background: var(--warning-light); color: var(--warning); }
.role-badge.driver { background: var(--info-light); color: var(--info); }

.user-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: var(--bg-main);
  border-radius: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
}

.detail-item svg {
  color: var(--primary);
  opacity: 0.7;
}

.location-names {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-primary-light {
  background: var(--primary-light);
  color: var(--primary);
  border: none;
  font-weight: 700;
  padding: 10px;
  width: 100%;
}

.btn-primary-light:hover {
  background: var(--primary);
  color: white;
}

/* Switch Styles */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input { 
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

input:checked + .slider {
  background-color: var(--success);
}

input:focus + .slider {
  box-shadow: 0 0 1px var(--success);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.slider.round {
  border-radius: 24px;
}

.slider.round:before {
  border-radius: 50%;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-container {
  background: var(--bg-card);
  width: 500px;
  max-width: 100%;
  border-radius: 28px;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
}

.modal-header {
  padding: 24px 32px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-form {
  padding: 32px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid var(--border-subtle);
  border-radius: 12px;
  font-size: 15px;
  background: var(--bg-main);
  color: var(--text-main);
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper input {
  padding-right: 48px;
}

.eye-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.eye-btn:hover {
  color: var(--primary);
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
}

.modal-actions .btn {
  flex: 1;
  padding: 14px;
  font-weight: 700;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 80px;
  background: var(--bg-card);
  border-radius: 32px;
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f1f5f9;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
