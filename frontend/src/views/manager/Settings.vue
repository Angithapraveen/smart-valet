<template>
  <div class="settings-page animate-fade-in">
    <header class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">Settings</h1>
          <p class="subtitle">Location management and board configurations</p>
        </div>
        <div class="header-badges" v-if="location">
           <span class="badge" :class="location.status ? 'badge-success' : 'badge-danger'">
              {{ location.status ? 'Active' : 'Inactive' }}
           </span>
           <span class="badge badge-outline">
              {{ location.location_short_code }}
           </span>
        </div>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>Loading configurations...</span>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-card">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <h3>Failed to Load</h3>
        <p>{{ error }}</p>
        <button @click="fetchLocationData" class="btn btn-primary mt-4">Retry</button>
      </div>
    </div>

    <div v-else class="settings-container">
      <!-- 1. General Overview (Read-Only) -->
      <div class="ui-card info-card">
        <div class="card-header-ui">
          <div class="header-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          </div>
          <div class="header-text">
            <h3>Location Details</h3>
            <p>Fundamental information about this location</p>
          </div>
        </div>
        
        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">Location Name</span>
            <span class="detail-value">{{ location.location_name }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Short Code</span>
            <span class="detail-value uppercase font-mono">{{ location.location_short_code }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Category</span>
            <span class="detail-value">{{ location.location_type }}</span>
          </div>
          <div class="detail-item full-width">
            <span class="detail-label">Address</span>
            <span class="detail-value address-text">{{ location.address || 'No address provided' }}</span>
          </div>
        </div>
      </div>

      <div class="secondary-grid">
         <!-- 2. Operational Validity (Read-Only) -->
         <div class="ui-card validity-card">
            <div class="card-header-ui">
              <div class="header-icon purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <div class="header-text">
                <h3>Operation Dates</h3>
                <p>Contractual validity period</p>
              </div>
            </div>
            <div class="validity-content">
               <div class="date-row">
                  <div class="date-label">From:</div>
                  <div class="date-value">{{ formatDate(location.valid_from) }}</div>
               </div>
               <div class="date-row">
                  <div class="date-label">To:</div>
                  <div class="date-value">{{ location.valid_to ? formatDate(location.valid_to) : 'Permanent' }}</div>
               </div>
            </div>
            <div class="status-footer-hint">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
               Contact Admin to modify dates or status.
            </div>
         </div>

         <!-- 3. Key Board Configuration (Editable) -->
         <div class="ui-card config-card active">
            <div class="card-header-ui">
              <div class="header-icon green">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
              </div>
              <div class="header-text">
                <h3>Key Configuration</h3>
                <p>Manage the physical keyboard slots</p>
              </div>
            </div>
            
            <form @submit.prevent="handleSubmit" class="config-form">
                <div class="form-group-ui">
                   <label>Total Key Capacity</label>
                   <div class="input-wrapper-ui">
                      <input 
                        v-model.number="form.total_capacity" 
                        type="number" 
                        min="1" 
                        max="1000" 
                        placeholder="100" 
                        required 
                        class="ui-input"
                      />
                      <div class="input-suffix">SLOTS</div>
                   </div>
                   <p class="input-hint">Maximum number of keys the system can assign (Max: 1000)</p>
                </div>

                <div class="form-actions-ui">
                   <button type="button" class="btn-cancel-ui" @click="router.push('/manager/dashboard')">Discard</button>
                   <button type="submit" class="btn-save-ui" :disabled="saving">
                      {{ saving ? 'Saving...' : 'Save Configuration' }}
                   </button>
                </div>
            </form>
         </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useToast } from '../../stores/toast';
import axios from 'axios';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const loading = ref(true);
const saving = ref(false);
const error = ref('');
const location = ref(null);

const form = reactive({
  total_capacity: 100
});

const fetchLocationData = async () => {
    try {
        loading.value = true;
        error.value = '';
        
        const response = await axios.get(`${API_URL}/dashboard/manager`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        if (response.data.success && response.data.data.location) {
            location.value = response.data.data.location;
            form.total_capacity = location.value.total_capacity || 100;
        } else {
            error.value = 'Could not find location associated with your account.';
        }
    } catch (err) {
        console.error('Fetch location error:', err);
        error.value = 'Failed to load location data.';
    } finally {
        loading.value = false;
    }
};

const formatDate = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const handleSubmit = async () => {
  saving.value = true;
  
  try {
    const payload = {
      // Send all existing data but only modified capacity
      location_name: location.value.location_name,
      location_type: location.value.location_type,
      address: location.value.address,
      valid_from: location.value.valid_from,
      valid_to: location.value.valid_to,
      status: location.value.status,
      total_capacity: form.total_capacity,
    };

    const response = await axios.put(`${API_URL}/owner/location/${location.value.location_id}`, payload, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });

    if (response.data.success) {
      toast.success('Key board configuration updated');
      location.value = response.data.data;
    }
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to update configuration.');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
    fetchLocationData();
});
</script>

<style scoped>
.settings-page {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
}

.subtitle {
  color: var(--text-muted);
  font-size: 15px;
  margin-top: 4px;
}

.header-badges {
    display: flex;
    gap: 8px;
}

.badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.badge-success { background: rgba(34, 197, 94, 0.1); color: #16a34a; border: 1px solid rgba(34, 197, 94, 0.2); }
.badge-danger { background: rgba(239, 68, 68, 0.1); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.2); }
.badge-outline { background: var(--bg-main); color: var(--text-muted); border: 1px solid var(--border-subtle); }

.settings-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.ui-card {
    background: var(--bg-card);
    border-radius: 24px;
    border: 1px solid var(--border-subtle);
    padding: 32px;
    box-shadow: var(--shadow-sm);
}

.card-header-ui {
    display: flex;
    gap: 16px;
    margin-bottom: 32px;
}

.header-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-icon.blue { background: #eff6ff; color: #3b82f6; }
.header-icon.purple { background: #f5f3ff; color: #8b5cf6; }
.header-icon.green { background: #f0fdf4; color: #22c55e; }

.header-text h3 {
    font-size: 18px;
    font-weight: 800;
    color: var(--text-main);
    margin: 0;
}

.header-text p {
    font-size: 13px;
    color: var(--text-muted);
    margin-top: 2px;
}

/* Details Grid */
.details-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.detail-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
}

.detail-value {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-main);
}

.full-width { grid-column: span 3; }

.address-text {
    line-height: 1.6;
    color: var(--text-muted);
    font-weight: 400;
}

/* Secondary Grid */
.secondary-grid {
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: 24px;
}

.validity-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.date-row {
    display: flex;
    justify-content: space-between;
    padding-bottom: 12px;
    border-bottom: 1px dashed var(--border-subtle);
}

.date-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-muted);
}

.date-value {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-main);
}

.status-footer-hint {
    margin-top: 24px;
    background: var(--bg-main);
    padding: 12px;
    border-radius: 12px;
    font-size: 12px;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 8px;
}

/* Config Form */
.config-card.active {
    border: 1px solid var(--primary-light);
    box-shadow: 0 0 0 1px var(--primary-light);
}

.form-group-ui {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.form-group-ui label {
    font-size: 14px;
    font-weight: 800;
    color: var(--text-main);
}

.input-wrapper-ui {
    display: flex;
    align-items: center;
    position: relative;
    max-width: 320px;
}

.ui-input {
    width: 100%;
    padding: 16px 20px;
    padding-right: 80px;
    background: var(--bg-main);
    border: 2px solid var(--border-subtle);
    border-radius: 16px;
    font-size: 18px;
    font-weight: 800;
    color: var(--primary);
    transition: all 0.3s;
}

.ui-input:focus {
    outline: none;
    border-color: var(--primary);
    background: var(--bg-card);
    transform: translateY(-1px);
    box-shadow: 0 8px 16px -4px var(--primary-shadow);
}

.input-suffix {
    position: absolute;
    right: 20px;
    font-size: 12px;
    font-weight: 900;
    color: var(--text-muted);
    letter-spacing: 0.1em;
    pointer-events: none;
}

.input-hint {
    font-size: 12px;
    color: var(--text-muted);
}

.form-actions-ui {
    margin-top: 40px;
    display: flex;
    justify-content: flex-end;
    gap: 16px;
    padding-top: 24px;
    border-top: 1px solid var(--border-subtle);
}

.btn-save-ui {
    padding: 14px 32px;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 14px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 12px -2px var(--primary-shadow);
}

.btn-save-ui:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px -4px var(--primary-shadow);
}

.btn-cancel-ui {
    padding: 14px 32px;
    background: transparent;
    color: var(--text-muted);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-cancel-ui:hover {
    background: var(--bg-main);
    color: var(--text-main);
}

/* Base UI */
.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
  gap: 16px;
  color: var(--text-muted);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-subtle);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1024px) {
    .secondary-grid { grid-template-columns: 1fr; }
    .details-grid { grid-template-columns: 1fr 1fr; }
}
</style>
