<template>
  <div class="add-location-page">
    <header class="page-header">
      <router-link to="/admin/locations" class="back-link">← Locations</router-link>
      <h1>Add Location</h1>
    </header>

    <form @submit.prevent="handleSubmit" class="location-form">
      <section class="form-section">
        <h2>Location Details</h2>

        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

        <div class="form-group">
          <label for="location_name">Location Name <span class="required">*</span></label>
          <input
            id="location_name"
            v-model="form.location_name"
            type="text"
            required
            placeholder="e.g. Downtown Mall Parking"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="location_short_code">Location Short Code (3 characters) <span class="required">*</span></label>
          <input
            id="location_short_code"
            v-model="form.location_short_code"
            type="text"
            maxlength="3"
            required
            placeholder="e.g. ABC"
            class="form-input"
            @input="form.location_short_code = form.location_short_code.toUpperCase()"
          />
          <span class="hint">Uppercase, exactly 3 characters. Used in Location ID.</span>
        </div>

        <div class="form-group">
          <label for="location_type">Location Type <span class="required">*</span></label>
          <select id="location_type" v-model="form.location_type" required class="form-input">
            <option value="">Select type</option>
            <option value="Mall">Mall</option>
            <option value="Hotel">Hotel</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div v-if="form.location_type === 'Other'" class="form-group">
          <label for="location_type_other">Specify Location Type</label>
          <input
            id="location_type_other"
            v-model="form.location_type_other"
            type="text"
            placeholder="e.g. Airport"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="address">Address</label>
          <textarea
            id="address"
            v-model="form.address"
            rows="2"
            placeholder="Full address"
            class="form-input"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="valid_from">Valid From <span class="required">*</span></label>
            <input
              id="valid_from"
              v-model="form.valid_from"
              type="date"
              required
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="valid_to">Valid To</label>
            <input
              id="valid_to"
              v-model="form.valid_to"
              type="date"
              class="form-input"
            />
          </div>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input v-model="form.status" type="checkbox" />
            Active
          </label>
        </div>
      </section>

      <div class="form-actions">
        <router-link to="/admin/locations" class="btn btn-secondary">Cancel</router-link>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Creating...' : 'Create Location' }}
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
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
.required { color: #dc3545; }
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
textarea.form-input { resize: vertical; min-height: 60px; }
.hint { font-size: 12px; color: #666; margin-top: 4px; display: block; }
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.checkbox-group { margin-top: 8px; }
.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
}
.checkbox-label input { width: auto; }
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
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}
.btn-secondary:hover { background: #d1d5db; }
@media (max-width: 600px) {
  .form-row { grid-template-columns: 1fr; }
}
</style>
