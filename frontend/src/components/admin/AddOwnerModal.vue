<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-container animate-slide-up">
        <div class="modal-header">
          <div class="header-content">
            <div class="icon-circle">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <div>
              <h3>Add New Owner</h3>
              <p>Onboard a new administrator</p>
            </div>
          </div>
          <button class="close-btn" @click="$emit('close')">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="handleSubmit" class="modal-form">
            <div v-if="error" class="modal-error">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              {{ error }}
            </div>

            <div class="form-section">
              <div class="section-title">
                <span class="number">01</span>
                User Identity
              </div>
              <div class="form-grid">
                <div class="form-group full-width">
                  <label>Full Name *</label>
                  <div class="input-container">
                    <input v-model="form.name" type="text" placeholder="e.g. Robert Smith" required />
                  </div>
                </div>

                <div class="form-group">
                  <label>Email Address *</label>
                  <div class="input-container">
                    <input 
                      v-model="form.email_id" 
                      type="email" 
                      placeholder="e.g. robert@example.com" 
                      autocomplete="off"
                      @input="handleEmailInput"
                      required 
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label>Phone Number *</label>
                  <div class="input-container">
                    <input 
                      v-model="form.phone_number" 
                      type="text" 
                      placeholder="Enter 10-digit phone number" 
                      maxlength="10"
                      @input="handlePhoneInput"
                      autocomplete="none"
                      required 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="form-section">
              <div class="section-title">
                <span class="number">02</span>
                Security & Assignment
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label>Password *</label>
                  <div class="input-container">
                    <input 
                      v-model="form.password" 
                      type="password" 
                      placeholder="Enter password" 
                      minlength="6" 
                      autocomplete="new-password"
                      required 
                    />
                  </div>
                  <span class="hint">Minimum 6 characters</span>
                </div>

                <div class="form-group">
                  <label>Primary Location</label>
                  <div class="input-container">
                    <select v-model="form.location_id" required :disabled="loadingLocations">
                      <option value="" disabled>Select location</option>
                      <option v-for="loc in locations" :key="loc.location_id" :value="loc.location_id">
                        {{ loc.location_name }}
                      </option>
                    </select>
                  </div>
                  <span v-if="loadingLocations" class="hint pulse">Loading...</span>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" @click="$emit('close')">Cancel</button>
              <button type="submit" class="btn btn-primary btn-premium" :disabled="loading || loadingLocations">
                <span class="btn-text">{{ loading ? 'Deploying...' : 'Create User' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, ref, onMounted, watch } from 'vue';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';

const props = defineProps({
  show: Boolean
});

const emit = defineEmits(['close', 'success']);

const authStore = useAuthStore();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const loading = ref(false);
const loadingLocations = ref(false);
const error = ref('');
const locations = ref([]);

const form = reactive({
  name: '',
  email_id: '',
  phone_number: '',
  password: '',
  location_id: ''
});

const resetForm = () => {
  form.name = '';
  form.email_id = '';
  form.phone_number = '';
  form.password = '';
  form.location_id = '';
  error.value = '';
};

const handleEmailInput = (e) => {
  // Only allow characters valid in an email address while typing
  const value = e.target.value.replace(/[^a-zA-Z0-9@._%+-]/g, '');
  form.email_id = value.toLowerCase();
};

const handlePhoneInput = (e) => {
  // Allow only digits
  const value = e.target.value.replace(/\D/g, '');
  // Limit to 10 digits
  form.phone_number = value.slice(0, 10);
};

const fetchLocations = async () => {
  loadingLocations.value = true;
  try {
    const response = await axios.get(`${API_URL}/admin/locations`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    if (response.data.success) {
      locations.value = response.data.data.filter(loc => loc.status);
    }
  } catch (err) {
    error.value = 'Failed to load locations.';
  } finally {
    loadingLocations.value = false;
  }
};

const handleSubmit = async () => {
  error.value = '';

  // 1. Check if all fields are filled
  if (!form.name || !form.email_id || !form.phone_number || !form.password || !form.location_id) {
    error.value = 'Please fill in all required fields.';
    return;
  }

  // 2. Email Validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(form.email_id)) {
    error.value = 'Enter a valid email address';
    return;
  }

  // 3. Phone Validation
  if (form.phone_number.length !== 10) {
    error.value = 'Phone number must be exactly 10 digits.';
    return;
  }

  // 4. Password Check
  if (form.password.length < 6) {
    error.value = 'Password must be at least 6 characters.';
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

    const response = await axios.post(`${API_URL}/admin/owners`, payload, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });

    if (response.data.success) {
      emit('success');
      emit('close');
      resetForm();
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create owner.';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchLocations);

watch(() => props.show, (newVal) => {
  resetForm();
});
</script>

<style scoped>
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
}

.modal-container {
    background: var(--bg-card);
    width: 600px;
    max-width: 100%;
    max-height: 90vh;
    border-radius: 28px;
    box-shadow: var(--shadow-lg);
    overflow-y: auto;
    border: 1px solid var(--border-subtle);
}

.modal-header {
    padding: 20px 32px;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 10;
}

.header-content {
    display: flex;
    align-items: center;
    gap: 16px;
}

.icon-circle {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--primary-light), #e2daff);
    color: var(--primary);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px -2px var(--primary-shadow);
}

.modal-header h3 {
    font-size: 18px;
    font-weight: 800;
    color: var(--text-main);
    margin: 0;
    font-family: 'Outfit', sans-serif;
    letter-spacing: -0.02em;
}

.modal-header p {
    font-size: 13px;
    color: var(--text-muted);
    margin: 2px 0 0 0;
    font-weight: 500;
}

.close-btn {
    background: var(--bg-main);
    border: 1px solid var(--border-subtle);
    color: var(--text-muted);
    cursor: pointer;
    padding: 6px;
    border-radius: 10px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-btn:hover {
    background: var(--bg-main);
    color: var(--danger);
    transform: rotate(90deg);
}

.modal-body {
    padding: 24px 32px;
}

.form-section {
  margin-bottom: 20px;
  background: var(--bg-main);
  padding: 16px 20px;
  border-radius: 16px;
  border: 1px solid var(--border-subtle);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 800;
  color: var(--text-main);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 16px;
}

.section-title .number {
  background: var(--bg-card);
  color: var(--primary);
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border: 1px solid var(--border-subtle);
}

.modal-error {
    background: var(--danger-light);
    color: var(--danger);
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 24px;
    border: 1px solid var(--danger);
    display: flex;
    align-items: center;
    gap: 10px;
    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
    10%, 90% { transform: translate3d(-1px, 0, 0); }
    20%, 80% { transform: translate3d(2px, 0, 0); }
    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
    40%, 60% { transform: translate3d(4px, 0, 0); }
}

.modal-form .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.modal-form .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.modal-form .full-width {
    grid-column: span 2;
}

.modal-form label {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-muted);
    margin-left: 2px;
}

.input-container {
    position: relative;
    display: flex;
    align-items: center;
}

.required-dot {
    position: absolute;
    right: 16px;
    color: #ef4444;
    font-size: 18px;
}

.modal-form input, .modal-form select, .modal-form textarea {
    width: 100%;
    padding: 10px 14px;
    background: var(--bg-card);
    border: 1.5px solid var(--border-subtle);
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-main);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-form input:hover, .modal-form select:hover, .modal-form textarea:hover {
    border-color: var(--primary-border);
    background: var(--bg-main);
}

.modal-form input:focus, .modal-form select:focus, .modal-form textarea:focus {
    outline: none;
    border-color: var(--primary);
    background: var(--bg-card);
    box-shadow: 0 0 0 4px var(--primary-shadow);
}

.hint {
    font-size: 10px;
    color: var(--text-muted);
    margin-left: 2px;
    font-weight: 600;
}

.modal-footer {
    margin-top: 32px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;
}

.btn {
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 14px;
}

.btn-ghost {
  background: var(--bg-main);
  color: var(--text-muted);
}

.btn-ghost:hover {
  background: var(--bg-card);
  color: var(--text-main);
  border: 1px solid var(--border-subtle);
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-premium {
  padding: 12px 28px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  font-size: 15px;
  box-shadow: 0 8px 16px -4px var(--primary-shadow);
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-premium:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px -6px var(--primary-shadow);
}

.btn-premium:active {
  transform: translateY(0);
}

.btn-premium:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.animate-slide-up {
    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(20px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

.pulse {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}
</style>
