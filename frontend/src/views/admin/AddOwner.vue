<template>
  <div class="add-owner-page">
    <div class="page-top-actions">
        <router-link to="/admin/owners" class="back-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Owners
        </router-link>
    </div>

    <header class="page-header">
      <div class="header-info">
          <h1>Onboard New Owner</h1>
          <p class="subtitle">Assign a new administrator to manage parking locations</p>
      </div>
    </header>

    <div class="form-container">
      <form @submit.prevent="handleSubmit" class="owner-form">
        <div class="form-card">
          <div class="card-header">
            <div class="title-with-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <h2>Account Credentials</h2>
            </div>
          </div>

          <div v-if="errorMessage" class="error-alert">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              {{ errorMessage }}
          </div>

          <div class="form-grid">
            <div class="form-group full-width">
              <label for="name">Legal Name <span class="required">*</span></label>
              <div class="input-wrapper">
                  <input
                    id="name"
                    v-model="form.name"
                    type="text"
                    required
                    placeholder="e.g. Robert Smith"
                    class="form-control"
                  />
              </div>
            </div>

            <div class="form-group">
              <label for="email_id">Professional Email <span class="required">*</span></label>
              <div class="input-wrapper">
                  <input
                    id="email_id"
                    v-model="form.email_id"
                    type="email"
                    required
                    placeholder="e.g. robert@grandplaza.com"
                    class="form-control"
                  />
              </div>
            </div>

            <div class="form-group">
              <label for="phone_number">Contact Number <span class="required">*</span></label>
              <div class="input-wrapper">
                  <input
                    id="phone_number"
                    v-model="form.phone_number"
                    type="tel"
                    required
                    placeholder="e.g. +91 9876543210"
                    class="form-control"
                  />
              </div>
            </div>

            <div class="form-group">
              <label for="password">Secure Password <span class="required">*</span></label>
              <div class="input-wrapper">
                  <input
                    id="password"
                    v-model="form.password"
                    type="password"
                    required
                    placeholder="••••••••"
                    class="form-control"
                    minlength="6"
                  />
              </div>
              <span class="field-hint">Minimum 6 characters.</span>
            </div>

            <div class="form-group">
              <label for="location_id">Initial Assignment <span class="required">*</span></label>
              <div class="input-wrapper">
                  <select
                    id="location_id"
                    v-model="form.location_id"
                    required
                    class="form-control"
                    :disabled="loadingLocations"
                  >
                    <option value="" disabled>Select assigned location</option>
                    <option v-for="loc in locations" :key="loc.location_id" :value="loc.location_id">
                      {{ loc.location_name }} ({{ loc.location_id }})
                    </option>
                  </select>
              </div>
              <span v-if="loadingLocations" class="field-hint pulse">Syncing available locations...</span>
            </div>
          </div>
        </div>

        <div class="form-footer-actions">
          <router-link to="/admin/owners" class="btn btn-ghost">Cancel</router-link>
          <button type="submit" class="btn btn-primary" :disabled="loading || loadingLocations">
            <span v-if="loading" class="btn-spinner"></span>
            {{ loading ? 'Onboarding...' : 'Assign & Create Owner' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default {
  name: 'AddOwner',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    const loading = ref(false);
    const loadingLocations = ref(false);
    const errorMessage = ref('');
    const locations = ref([]);

    const form = reactive({
      name: '',
      email_id: '',
      phone_number: '',
      password: '',
      location_id: ''
    });

    const fetchLocations = async () => {
      loadingLocations.value = true;
      try {
        const response = await axios.get(`${API_BASE_URL}/admin/locations`, {
          headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
          locations.value = response.data.data.filter(loc => loc.status);
          
          // Pre-select location if passed in query
          const route = useRouter().currentRoute.value;
          if (route.query.location_id) {
             const preSelected = locations.value.find(l => l.location_id === route.query.location_id);
             if (preSelected) {
                 form.location_id = preSelected.location_id;
             }
          }
        }
      } catch (err) {
        errorMessage.value = 'Failed to load locations.';
      } finally {
        loadingLocations.value = false;
      }
    };

    const handleSubmit = async () => {
      errorMessage.value = '';
      if (form.password.length < 6) {
        errorMessage.value = 'Password must be at least 6 characters.';
        return;
      }
      loading.value = true;
      try {
        const payload = {
          name: form.name.trim(),
          email_id: form.email_id.trim().toLowerCase(),
          phone_number: form.phone_number.trim(),
          password: form.password,
          location_id: form.location_id
        };
        
        // Debug logging
        console.log('Sending owner data:', payload);
        
        const response = await axios.post(`${API_BASE_URL}/admin/owners`, payload, {
          headers: { Authorization: `Bearer ${authStore.token}` }
        });
        
        console.log('Owner creation response:', response.data);
        
        if (response.data.success) {
          alert('Owner created and assigned to location successfully.');
          router.push('/admin/owners');
        }
      } catch (err) {
        console.error('Owner creation error:', err);
        console.error('Error response:', err.response?.data);
        errorMessage.value = err.response?.data?.message || 'Failed to create owner.';
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchLocations);

    return {
      form,
      locations,
      loading,
      loadingLocations,
      errorMessage,
      handleSubmit
    };
  }
};
</script>

<style scoped>
.add-owner-page {
  padding: 24px;
  max-width: 800px;
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

/* Form Container & Card */
.form-card {
    background: white;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
    border: 1px solid #f1f5f9;
    padding: 32px;
}

.card-header {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f1f5f9;
}

.title-with-icon {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #0f172a;
}

.title-with-icon h2 {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
}

.title-with-icon svg {
    color: var(--primary);
}

/* Form Grid */
.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 8px;
}

.full-width {
    grid-column: span 2;
}

/* Form Groups */
.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-group label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
}

.required {
    color: #ef4444;
}

.input-wrapper {
    position: relative;
}

.form-control {
    width: 100%;
    padding: 12px 16px;
    border-radius: 12px;
    border: 1.5px solid #e2e8f0;
    font-size: 15px;
    color: #1e293b;
    transition: all 0.2s;
    background: #f8fafc;
}

.form-control:focus {
    outline: none;
    background: white;
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(101, 69, 229, 0.1);
}

.form-control:disabled {
    background: #f1f5f9;
    cursor: not-allowed;
    color: #94a3b8;
}

.field-hint {
    font-size: 12px;
    color: #94a3b8;
    margin-top: 4px;
}

.pulse {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

/* Alert */
.error-alert {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: #fef2f2;
    border: 1px solid #fee2e2;
    border-radius: 12px;
    color: #dc2626;
    font-size: 14px;
    margin-bottom: 24px;
}

/* Actions */
.form-footer-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;
    margin-top: 32px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary);
  color: white;
  min-width: 220px;
  box-shadow: 0 4px 6px -1px rgba(101, 69, 229, 0.2);
}

.btn-primary:hover:not(:disabled) {
    background: var(--primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 10px 15px -3px rgba(101, 69, 229, 0.3);
}

.btn-primary:disabled {
    opacity: 0.7;
    cursor: wait;
}

.btn-ghost {
    background: transparent;
    color: #64748b;
}

.btn-ghost:hover {
    background: #f1f5f9;
    color: #1e293b;
}

@media (max-width: 640px) {
    .form-grid { grid-template-columns: 1fr; }
    .full-width { grid-column: span 1; }
    .form-card { padding: 20px; }
    .form-footer-actions { flex-direction: column-reverse; }
    .btn { width: 100%; }
}
</style>
