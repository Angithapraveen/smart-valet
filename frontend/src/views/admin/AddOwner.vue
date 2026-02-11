<template>
  <div class="add-owner-page">
    <header class="page-header">
      <router-link to="/admin/owners" class="back-link">← Owners</router-link>
      <h1>Add Owner</h1>
    </header>

    <form @submit.prevent="handleSubmit" class="owner-form">
      <section class="form-section">
        <h2>Owner Details</h2>

        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

        <div class="form-group">
          <label for="name">Owner Name <span class="required">*</span></label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            placeholder="e.g. John Doe"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="email_id">Email <span class="required">*</span></label>
          <input
            id="email_id"
            v-model="form.email_id"
            type="email"
            required
            placeholder="e.g. owner@example.com"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="phone_number">Phone Number <span class="required">*</span></label>
          <input
            id="phone_number"
            v-model="form.phone_number"
            type="tel"
            required
            placeholder="e.g. +1234567890"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="password">Password <span class="required">*</span></label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            placeholder="Enter password"
            class="form-input"
            minlength="6"
          />
          <span class="hint">Minimum 6 characters</span>
        </div>

        <div class="form-group">
          <label for="location_id">Location <span class="required">*</span></label>
          <select
            id="location_id"
            v-model="form.location_id"
            required
            class="form-input"
            :disabled="loadingLocations"
          >
            <option value="">Select location</option>
            <option v-for="loc in locations" :key="loc.location_id" :value="loc.location_id">
              {{ loc.location_name }} ({{ loc.location_id }})
            </option>
          </select>
          <span v-if="loadingLocations" class="hint">Loading locations...</span>
        </div>
      </section>

      <div class="form-actions">
        <router-link to="/admin/owners" class="btn btn-secondary">Cancel</router-link>
        <button type="submit" class="btn btn-primary" :disabled="loading || loadingLocations">
          {{ loading ? 'Creating...' : 'Create Owner' }}
        </button>
      </div>
    </form>
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
  max-width: 640px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.back-link {
  display: inline-block;
  color: #6545e5;
  text-decoration: none;
  margin-bottom: 8px;
  font-size: 14px;
}

.back-link:hover {
  text-decoration: underline;
}

.page-header h1 {
  font-size: 24px;
  color: #333;
}

.form-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
}

.form-section h2 {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.required {
  color: #dc3545;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #6545e5;
  box-shadow: 0 0 0 2px rgba(101, 69, 229, 0.2);
}

.form-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.hint {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  display: block;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  border: none;
}

.btn-primary {
  background: #6545e5;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #7c5ef0;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #d1d5db;
}
</style>
