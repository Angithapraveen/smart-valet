<template>
  <div class="add-location-page">
    <div class="page-top-actions">
        <router-link to="/admin/dashboard" class="back-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Dashboard
        </router-link>
    </div>

    <header class="page-header">
      <div class="header-info">
          <h1>Configure New Location</h1>
          <p class="subtitle">Set up a new parking facility in the system</p>
      </div>
    </header>

    <div class="form-container">
      <form @submit.prevent="handleSubmit" class="location-form">
        <div class="form-card">
          <div class="card-header">
            <div class="title-with-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <h2>General Information</h2>
            </div>
          </div>

          <div v-if="errorMessage" class="error-alert">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              {{ errorMessage }}
          </div>

          <div class="form-grid">
            <div class="form-group full-width">
              <label for="location_name">Location Display Name <span class="required">*</span></label>
              <div class="input-wrapper">
                  <input
                    id="location_name"
                    v-model="form.location_name"
                    type="text"
                    required
                    placeholder="e.g. Grand Plaza Parking"
                    class="form-control"
                  />
              </div>
            </div>

            <div class="form-group">
              <label for="location_short_code">Short Code (ID Prefix) <span class="required">*</span></label>
              <div class="input-wrapper">
                  <input
                    id="location_short_code"
                    v-model="form.location_short_code"
                    type="text"
                    maxlength="3"
                    required
                    placeholder="e.g. GPZ"
                    class="form-control uppercase"
                    @input="form.location_short_code = form.location_short_code.toUpperCase()"
                  />
              </div>
              <span class="field-hint">Uppercase, exactly 3 characters.</span>
            </div>

            <div class="form-group">
              <label for="location_type">Facility Category <span class="required">*</span></label>
              <div class="input-wrapper">
                  <select id="location_type" v-model="form.location_type" required class="form-control">
                    <option value="" disabled>Select category</option>
                    <option value="Mall">Shopping Mall</option>
                    <option value="Hotel">Luxury Hotel</option>
                    <option value="Hospital">Hospital</option>
                    <option value="Other">Custom Type</option>
                  </select>
              </div>
            </div>

            <div v-if="form.location_type === 'Other'" class="form-group full-width animate-fade">
              <label for="location_type_other">Specify Custom Type</label>
              <div class="input-wrapper">
                  <input
                    id="location_type_other"
                    v-model="form.location_type_other"
                    type="text"
                    placeholder="e.g. Airport, Event Venue"
                    class="form-control"
                  />
              </div>
            </div>

            <div class="form-group full-width">
              <label for="address">Postal Address</label>
              <div class="input-wrapper">
                  <textarea
                    id="address"
                    v-model="form.address"
                    rows="2"
                    placeholder="Enter full physical address"
                    class="form-control"
                  ></textarea>
              </div>
            </div>

            <div class="form-group">
              <label for="valid_from">Activate From <span class="required">*</span></label>
              <div class="input-wrapper">
                  <input
                    id="valid_from"
                    v-model="form.valid_from"
                    type="date"
                    required
                    class="form-control"
                  />
              </div>
            </div>

            <div class="form-group">
              <label for="valid_to">Expiration Date</label>
              <div class="input-wrapper">
                  <input
                    id="valid_to"
                    v-model="form.valid_to"
                    type="date"
                    class="form-control"
                  />
              </div>
            </div>
          </div>

          <div class="form-group checkbox-wrapper">
            <label class="toggle-switch">
              <input v-model="form.status" type="checkbox" />
              <span class="slider"></span>
              <span class="label-text">Status: <b>{{ form.status ? 'LIVE' : 'MAINTENANCE' }}</b></span>
            </label>
          </div>
        </div>

        <div class="form-footer-actions">
          <router-link to="/admin/dashboard" class="btn btn-ghost">Cancel</router-link>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading" class="btn-spinner"></span>
            {{ loading ? 'Configuring...' : 'Deploy Location' }}
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
  name: 'AddLocation',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    const loading = ref(false);
    const errorMessage = ref('');

    const form = reactive({
      location_name: '',
      location_short_code: '',
      location_type: '',
      location_type_other: '',
      address: '',
      valid_from: '',
      valid_to: '',
      status: true
    });

    const handleSubmit = async () => {
      errorMessage.value = '';
      if (form.location_short_code.length !== 3) {
        errorMessage.value = 'Location short code must be exactly 3 characters.';
        return;
      }
      loading.value = true;
      try {
        const payload = {
          location_name: form.location_name.trim(),
          location_short_code: form.location_short_code.trim().toUpperCase(),
          location_type: form.location_type === 'Other' && form.location_type_other
            ? form.location_type_other.trim()
            : form.location_type,
          address: form.address.trim() || undefined,
          valid_from: form.valid_from,
          valid_to: form.valid_to || undefined,
          status: form.status
        };
        const response = await axios.post(`${API_BASE_URL}/admin/locations`, payload, {
          headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
          alert('Location created successfully.');
          router.push('/admin/locations');
        }
      } catch (err) {
        errorMessage.value = err.response?.data?.message || 'Failed to create location.';
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      const today = new Date().toISOString().slice(0, 10);
      if (!form.valid_from) form.valid_from = today;
    });

    return { form, loading, errorMessage, handleSubmit };
  }
};
</script>

<style scoped>
.add-location-page {
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
.form-container {
    perspective: 1000px;
}

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
    margin-bottom: 24px;
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

.form-control::placeholder {
    color: #94a3b8;
}

.uppercase {
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
}

textarea.form-control {
    resize: vertical;
    min-height: 80px;
}

.field-hint {
    font-size: 12px;
    color: #94a3b8;
    margin-top: 4px;
}

/* Toggle Switch */
.checkbox-wrapper {
    margin-top: 16px;
    padding-top: 24px;
    border-top: 1px solid #f1f5f9;
}

.toggle-switch {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
}

.toggle-switch input {
    display: none;
}

.slider {
    width: 44px;
    height: 24px;
    background: #e2e8f0;
    border-radius: 100px;
    position: relative;
    transition: all 0.3s;
}

.slider::before {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    background: white;
    border-radius: 50%;
    left: 3px;
    top: 3px;
    transition: all 0.3s;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.toggle-switch input:checked + .slider {
    background: var(--primary);
}

.toggle-switch input:checked + .slider::before {
    left: 23px;
}

.label-text {
    font-size: 14px;
    color: #475569;
}

.label-text b {
    color: var(--primary);
    margin-left: 4px;
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
  min-width: 180px;
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

/* Animations */
.animate-fade {
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 640px) {
    .form-grid { grid-template-columns: 1fr; }
    .full-width { grid-column: span 1; }
    .form-card { padding: 20px; }
    .form-footer-actions { flex-direction: column-reverse; }
    .btn { width: 100%; }
}
</style>
