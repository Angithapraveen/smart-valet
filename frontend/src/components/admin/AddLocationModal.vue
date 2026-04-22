<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-container animate-slide-up">
        <div class="modal-header">
          <div class="header-content">
            <div class="icon-circle">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </div>
            <div>
              <h3>New Location</h3>
              <p>Configure a new parking facility</p>
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
                Identity & Type
              </div>
              <div class="form-grid">
                <div class="form-group full-width">
                  <label>Location Name</label>
                  <div class="input-container">
                    <input v-model="form.location_name" type="text" placeholder="e.g. Grand Plaza" required />
                    <span class="required-dot">•</span>
                  </div>
                </div>

                <div class="form-group">
                  <label>Short Code</label>
                  <div class="input-container">
                    <input 
                        v-model="form.location_short_code" 
                        type="text" 
                        placeholder="ABC" 
                        maxlength="3" 
                        class="uppercase font-mono" 
                        required 
                        @input="form.location_short_code = form.location_short_code.toUpperCase()"
                    />
                  </div>
                  <span class="hint">Exactly 3 characters</span>
                </div>

                <div class="form-group">
                  <label>Category</label>
                  <div class="input-container">
                    <select v-model="form.location_type" required>
                      <option value="" disabled>Select category</option>
                      <option value="Mall">Shopping Mall</option>
                      <option value="Hotel">Luxury Hotel</option>
                      <option value="Hospital">Hospital</option>
                      <option value="Other">Custom Type</option>
                    </select>
                  </div>
                </div>

                <div v-if="form.location_type === 'Other'" class="form-group full-width animate-fade-in">
                  <label>Custom Category Name</label>
                  <input v-model="form.location_type_other" type="text" placeholder="e.g. Airport" />
                </div>
              </div>
            </div>

            <div class="form-section">
              <div class="section-title">
                <span class="number">02</span>
                Regional Details
              </div>
              <div class="form-grid">
                <div class="form-group full-width">
                  <label>Street Address</label>
                  <textarea v-model="form.address" rows="2" placeholder="e.g. 123 Business Park"></textarea>
                </div>

                <div class="form-group">
                  <label>City</label>
                  <div class="input-container suggest-container">
                    <input 
                      v-model="form.city" 
                      type="text" 
                      placeholder="e.g. Coimbatore" 
                      @input="handleCitySearch" 
                      @blur="hideCitySuggestionsDelayed"
                      required
                    />
                    <div v-if="showCitySuggestions" class="suggestions-list scroll-thin">
                      <div 
                        v-for="s in citySuggestions" 
                        :key="s.city_name + s.state_name" 
                        class="suggestion-item" 
                        @mousedown="selectCity(s)"
                      >
                        <span class="city">{{ s.city_name }}</span>
                        <span class="state">{{ s.state_name }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label>State</label>
                  <div class="input-container">
                    <input 
                        v-model="form.state" 
                        type="text" 
                        placeholder="e.g. Tamil Nadu" 
                        readonly 
                        class="bg-readonly"
                        required
                    />
                  </div>
                </div>

                <div class="form-group full-width">
                  <label>Pincode</label>
                  <div class="input-container suggest-container">
                    <input 
                        v-model="form.pincode" 
                        type="text" 
                        placeholder="e.g. 641030" 
                        maxlength="6" 
                        @input="handlePincodeSearch"
                        @blur="hidePincodeSuggestionsDelayed"
                        required
                    />
                    <div v-if="showPincodeSuggestions" class="suggestions-list scroll-thin">
                        <div 
                        v-for="p in pincodeSuggestions" 
                        :key="p" 
                        class="suggestion-item" 
                        @mousedown="selectPincode(p)"
                        >
                        {{ p }}
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-section">
              <div class="section-title">
                <span class="number">03</span>
                Operation Dates
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label>Valid From</label>
                  <input v-model="form.valid_from" type="date" required />
                </div>

                <div class="form-group">
                  <label>Valid To</label>
                  <input v-model="form.valid_to" type="date" />
                </div>
              </div>
            </div>

            <div class="form-options-row">
                <div class="operational-label">
                  <h4>Operational Status</h4>
                  <p>Enable location services immediately after creation</p>
                </div>
                <label class="premium-toggle">
                    <input v-model="form.status" type="checkbox" />
                    <span class="toggle-slider"></span>
                </label>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" @click="$emit('close')">Discard Changes</button>
              <button type="submit" class="btn btn-primary btn-premium" :disabled="loading">
                <span class="btn-text">{{ loading ? 'Deploying...' : 'Deploy Location' }}</span>
                <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
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
import { LocationMasterService } from '../../services/LocationMasterService';

const props = defineProps({
  show: Boolean
});

const emit = defineEmits(['close', 'success']);
const authStore = useAuthStore();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const loading = ref(false);
const error = ref('');

const form = reactive({
  location_name: '',
  location_short_code: '',
  location_type: '',
  location_type_other: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  valid_from: new Date().toISOString().slice(0, 10),
  valid_to: '',
  status: true
});

const citySuggestions = ref([]);
const showCitySuggestions = ref(false);
const pincodeSuggestions = ref([]);
const showPincodeSuggestions = ref(false);

const handleCitySearch = async (e) => {
    // Restrict input to only letters and spaces
    if (e && e.target) {
        const sanitized = e.target.value.replace(/[^a-zA-Z\s]/g, '');
        if (form.city !== sanitized) {
            form.city = sanitized;
        }
    }

    if (form.city.length < 2) {
        citySuggestions.value = [];
        showCitySuggestions.value = false;
        return;
    }
    try {
        const results = await LocationMasterService.searchCities(form.city);
        citySuggestions.value = results;
        showCitySuggestions.value = true;
    } catch (err) {
        console.error('City search failed', err);
    }
};

const selectCity = async (s) => {
    form.city = s.city_name;
    form.state = s.state_name;
    showCitySuggestions.value = false;
    
    // Fetch pincodes for this city
    try {
        const pincodes = await LocationMasterService.getPincodes(s.city_name, s.state_name);
        pincodeSuggestions.value = pincodes;
    } catch (err) {
        console.error('Pincode fetch failed', err);
    }
};

const handlePincodeSearch = async (e) => {
    // Restrict input to only numbers, max 6 digits
    if (e && e.target) {
        const sanitized = e.target.value.replace(/\D/g, '').slice(0, 6);
        if (form.pincode !== sanitized) {
            form.pincode = sanitized;
        }
    }

    if (form.pincode.length === 6) {
        try {
            const res = await LocationMasterService.getByPincode(form.pincode);
            if (res.success && res.data) {
                form.city = res.data.city_name;
                form.state = res.data.state_name;
            }
        } catch (err) {
            console.warn('Pincode lookup failed');
        }
    } else if (pincodeSuggestions.value.length > 0) {
        showPincodeSuggestions.value = true;
    }
};

const selectPincode = (p) => {
    form.pincode = p;
    showPincodeSuggestions.value = false;
};

const hideCitySuggestionsDelayed = () => {
    setTimeout(() => { showCitySuggestions.value = false; }, 200);
};

const hidePincodeSuggestionsDelayed = () => {
    setTimeout(() => { showPincodeSuggestions.value = false; }, 200);
};

const handleSubmit = async () => {
  error.value = '';
  
  if (form.location_short_code.length !== 3) {
    error.value = 'Short code must be exactly 3 characters.';
    return;
  }

  loading.value = true;
  try {
    let fullAddress = form.address.trim();
    if (form.city.trim()) {
      fullAddress += (fullAddress ? ', ' : '') + form.city.trim();
    }
    if (form.state.trim()) {
      fullAddress += (fullAddress ? ', ' : '') + form.state.trim();
    }
    if (form.pincode.trim()) {
      fullAddress += (fullAddress ? ' - ' : '') + form.pincode.trim();
    }

    const payload = {
      location_name: form.location_name.trim(),
      location_short_code: form.location_short_code.toUpperCase(),
      location_type: form.location_type === 'Other' ? form.location_type_other : form.location_type,
      address: fullAddress || null,
      valid_from: form.valid_from,
      valid_to: form.valid_to || null,
      status: form.status
    };

    const response = await axios.post(`${API_URL}/admin/locations`, payload, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });

    if (response.data.success) {
      emit('success', response.data.data.location_id);
      // Wait for parent to handle the event before closing
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create location.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(12px) saturate(180%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
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
    background: #fef2f2;
    color: #dc2626;
    border-color: #fee2e2;
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
  background: var(--primary);
  color: white;
  font-size: 10px;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
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
  color: #fb7185;
  font-size: 20px;
  pointer-events: none;
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
    box-shadow: 0 0 0 5px var(--primary-light);
    transform: translateY(-1px);
}

.uppercase.font-mono {
    text-transform: uppercase;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.1em;
    font-size: 14px;
    font-weight: 800;
}

.suggest-container {
    position: relative;
}

.suggestions-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    margin-top: 5px;
    z-index: 100;
    max-height: 200px;
    overflow-y: auto;
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
}

.suggestion-item {
    padding: 12px 16px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    transition: all 0.2s;
    color: var(--text-main);
}

.suggestion-item:hover {
    background: var(--primary);
    color: #ffffff;
}

.suggestion-item .state {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 600;
    text-transform: uppercase;
}

.scroll-thin::-webkit-scrollbar { width: 4px; }
.scroll-thin::-webkit-scrollbar-track { background: transparent; }
.scroll-thin::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 10px; }

.bg-readonly {
    background: var(--bg-main) !important;
}

.hint {
    font-size: 10px;
    color: var(--text-muted);
    margin-left: 2px;
    font-weight: 600;
}

.form-options-row {
    margin-top: 4px;
    padding: 16px 24px;
    background: var(--bg-main);
    border-radius: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid var(--border-subtle);
}

.operational-label h4 {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0 0 2px 0;
}

.operational-label p {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

.premium-toggle {
    position: relative;
    cursor: pointer;
}

.premium-toggle input { display: none; }

.premium-toggle .toggle-slider {
    width: 52px;
    height: 28px;
    background: var(--border-subtle);
    border-radius: 100px;
    display: block;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.premium-toggle .toggle-slider::before {
    content: '';
    position: absolute;
    width: 22px;
    height: 22px;
    background: white;
    border-radius: 50%;
    top: 3px;
    left: 3px;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.premium-toggle input:checked + .toggle-slider { 
    background: var(--success); 
    box-shadow: 0 0 15px rgba(34, 197, 94, 0.3);
}

.premium-toggle input:checked + .toggle-slider::before { 
    transform: translateX(24px); 
}

.modal-footer {
    margin-top: 32px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;
}

.btn-premium {
  padding: 12px 28px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  font-size: 15px;
  box-shadow: 0 8px 16px -4px var(--primary-shadow);
}

.btn-premium:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 18px 32px -8px var(--primary-shadow);
}

.btn-premium:active {
  transform: translateY(0) scale(0.98);
}

.btn-text {
  font-family: 'Outfit', sans-serif;
}

.animate-slide-up {
    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(40px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 640px) {
  .modal-form .form-grid { grid-template-columns: 1fr; }
  .modal-body { padding: 24px; }
  .modal-header { padding: 20px 24px; }
  .form-section { padding: 16px; }
  .form-options-row { flex-direction: column; gap: 16px; text-align: center; }
  .modal-footer { flex-direction: column-reverse; width: 100%; }
  .modal-footer .btn { width: 100%; }
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
  box-shadow: 0 4px 6px -1px var(--primary-shadow);
}

.btn-ghost {
    background: transparent;
    color: var(--text-muted);
}

.btn-ghost:hover {
    background: var(--bg-main);
    color: var(--text-main);
}
</style>
