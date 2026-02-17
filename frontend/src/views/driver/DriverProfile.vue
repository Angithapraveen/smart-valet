<template>
<div class="driver-profile-page">
    <div class="profile-header">
        <button class="back-btn" @click="$router.push('/driver/dashboard')">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <h1>My Profile</h1>
        <button class="edit-btn" @click="openEditModal">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
    </div>

    <!-- ... Content ... -->
    <div class="profile-content">
        <div class="avatar-section">
            <div class="avatar-circle">
                {{ userInitial }}
            </div>
            <h2 class="user-name">{{ user.name }}</h2>
            <span class="user-role">Valet Driver</span>
        </div>

        <div class="info-group">
            <label>Assigned Location</label>
            <div class="info-card location-card">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>{{ locationName }}</span>
            </div>
        </div>

        <div class="info-group">
            <label>Contact Info</label>
            <div class="info-card">
                <div class="info-row">
                    <span class="label">Driver ID</span>
                    <span class="value">{{ user.user_id }}</span>
                </div>
                <div class="separator"></div>
                <div class="info-row">
                    <span class="label">Email</span>
                    <span class="value">{{ user.email_id }}</span>
                </div>
                <div class="separator"></div>
                <div class="info-row">
                    <span class="label">Phone</span>
                    <span class="value">{{ user.phone_number }}</span>
                </div>
            </div>
        </div>

        <button class="logout-btn" @click="logout">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Logout
        </button>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
        <div class="edit-modal">
            <h3>Edit Profile</h3>
            <div class="form-group">
                <label>Full Name</label>
                <input v-model="editForm.name" type="text" class="form-input" placeholder="Enter name">
            </div>
            <div class="form-group">
                <label>Phone Number</label>
                <input v-model="editForm.phone_number" type="tel" class="form-input" placeholder="Enter phone number">
            </div>
            <div class="modal-actions">
                <button class="cancel-btn" @click="closeEditModal">Cancel</button>
                <button class="save-btn" @click="saveProfile" :disabled="saving">
                    {{ saving ? 'Saving...' : 'Save Changes' }}
                </button>
            </div>
        </div>
    </div>
</div>
</template>

<script setup>
import { computed, ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';

const router = useRouter();
const authStore = useAuthStore();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const user = computed(() => authStore.user || {});
const userInitial = computed(() => (user.value.name ? user.value.name.charAt(0).toUpperCase() : 'U'));
const locationName = computed(() => {
    return authStore.accessibleLocations?.[0]?.location_name || 'No Location Assigned';
});

// Edit State
const showEditModal = ref(false);
const saving = ref(false);
const editForm = reactive({
    name: '',
    phone_number: ''
});

const openEditModal = () => {
    editForm.name = user.value.name;
    editForm.phone_number = user.value.phone_number;
    showEditModal.value = true;
};

const closeEditModal = () => {
    showEditModal.value = false;
};

const saveProfile = async () => {
    if (!editForm.name || !editForm.phone_number) {
        alert('Please fill in all fields');
        return;
    }

    saving.value = true;
    try {
        const response = await axios.put(`${API_URL}/auth/update-profile`, {
            name: editForm.name,
            phone_number: editForm.phone_number
        }, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        if (response.data.success) {
            // Update store
            await authStore.fetchCurrentUser();
            closeEditModal();
        }
    } catch (error) {
        console.error('Failed to update profile:', error);
        alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
        saving.value = false;
    }
};

const logout = () => {
    authStore.logout();
    router.push('/login');
};

onMounted(() => {
    authStore.fetchCurrentUser();
});
</script>

<style scoped>
.driver-profile-page {
    max-width: 420px;
    margin: 0 auto;
    background: linear-gradient(180deg, #0b0f1a 0%, #020617 100%);
    min-height: 100vh;
    color: white;
    font-family: 'Inter', sans-serif;
    padding: 20px;
}

.profile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
    padding-top: 20px;
}

.back-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.profile-header h1 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
}

.placeholder {
    width: 40px;
}

.avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 40px;
}

.avatar-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    font-size: 32px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
    border: 3px solid rgba(255, 255, 255, 0.1);
}

.user-name {
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 4px 0;
}

.user-role {
    color: #94a3b8;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.info-group {
    margin-bottom: 24px;
}

.info-group label {
    display: block;
    color: #94a3b8;
    font-size: 12px;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.info-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 16px;
}

.location-card {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #f59e0b;
    font-weight: 600;
}

.info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
}

.info-row .label {
    color: #64748b;
    font-size: 14px;
    text-transform: none;
    margin: 0;
}

.info-row .value {
    color: white;
    font-weight: 500;
}

.separator {
    height: 1px;
    background: rgba(255, 255, 255, 0.05);
    margin: 12px 0;
}

.logout-btn {
    width: 100%;
    margin-top: 20px;
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
    padding: 16px;
    border-radius: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.logout-btn:active {
    background: rgba(239, 68, 68, 0.2);
    transform: scale(0.98);
}
</style>


<!-- Edit Profile Modal -->
<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    backdrop-filter: blur(5px);
}

.edit-modal {
    background: #1a1a1a;
    padding: 24px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    max-width: 340px;
    width: 90%;
}

.edit-modal h3 {
    margin-top: 0;
    margin-bottom: 20px;
    color: white;
    text-align: center;
}

.form-group {
    margin-bottom: 16px;
}

.form-group label {
    display: block;
    color: #94a3b8;
    font-size: 12px;
    margin-bottom: 6px;
}

.form-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 12px;
    border-radius: 12px;
    color: white;
    font-size: 14px;
    outline: none;
}

.form-input:focus {
    border-color: #f59e0b;
}

.modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
}

.cancel-btn, .save-btn {
    flex: 1;
    padding: 12px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    font-size: 14px;
}

.cancel-btn {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

.save-btn {
    background: #f59e0b;
    color: black;
}

.edit-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #f59e0b;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}
</style>
