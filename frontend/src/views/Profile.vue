<template>
  <div class="profile-page">
    <div class="profile-header-card">
      <button class="back-btn" @click="goBack">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Back to Dashboard
      </button>
      <div class="profile-header-content">
         <div class="avatar-large">{{ userInitial }}</div>
         <div class="profile-basic-info">
             <h1>{{ userData.name }}</h1>
             <span class="role-badge" :class="roleClass">{{ userData.role_name }}</span>
         </div>
      </div>
    </div>

    <div class="profile-content">
      <div class="info-card">
        <h3>Account Information</h3>
        <div class="info-grid">
            <div class="info-item">
                <label>User ID</label>
                <div class="value">{{ userData.user_id }}</div>
            </div>
            <div class="info-item">
                <label>Email Address</label>
                <div class="value">{{ userData.email_id }}</div>
            </div>
            <div class="info-item">
                <label>Phone Number</label>
                <div class="value">{{ userData.phone_number }}</div>
            </div>
            <div class="info-item">
                <label>Joined On</label>
                <div class="value">{{ formatDate(userData.created_at) }}</div>
            </div>
        </div>
      </div>

      <div class="locations-card" v-if="userLocations.length > 0">
          <h3>Assigned Locations</h3>
          <div class="locations-list">
              <div v-for="loc in userLocations" :key="loc.location_id" class="location-item-card" :class="{ 'active-location': loc.access_status === 'ACTIVE' }">
                  <div class="loc-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </div>
                  <div class="loc-details">
                      <h4>{{ loc.location_name }}</h4>
                      <p>{{ loc.address }}</p>
                      <span class="status-badge" :class="loc.access_status?.toLowerCase()">
                          {{ loc.access_status }}
                      </span>
                  </div>
              </div>
          </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import axios from 'axios';

const authStore = useAuthStore();
const router = useRouter();
const userData = ref({});
const userLocations = ref([]);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const userInitial = computed(() => {
  return (userData.value.name || 'U').charAt(0).toUpperCase();
});

const roleClass = computed(() => {
  const role = userData.value.role_name || '';
  switch(role) {
    case 'ADMIN': return 'badge-danger';
    case 'OWNER': return 'badge-success';
    case 'MANAGER': return 'badge-warning';
    case 'DRIVER': return 'badge-info';
    default: return 'badge-secondary';
  }
});

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

const fetchProfile = async () => {
    try {
        const response = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
            userData.value = response.data.data.user;
            userLocations.value = response.data.data.accessibleLocations || [];
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
};

const goBack = () => {
    const role = userData.value.role_name;
    if (role === 'ADMIN') router.push('/admin/dashboard');
    else if (role === 'OWNER') router.push('/owner/dashboard');
    else if (role === 'MANAGER') router.push('/manager/dashboard');
    else router.push('/');
};

onMounted(() => {
    fetchProfile();
});
</script>

<style scoped>
.profile-page {
    max-width: 1000px;
    margin: 0 auto;
}

.profile-header-card {
    background: var(--bg-card);
    color: var(--text-main);
    padding: 60px 40px 40px; /* Increased top padding for back button */
    border-radius: 20px;
    margin-bottom: 30px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-subtle);
    position: relative;
    overflow: hidden;
    transition: var(--ts-base);
}

.back-btn {
    position: absolute;
    top: 20px;
    left: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--bg-main);
    border: 1px solid var(--border-subtle);
    color: var(--text-muted);
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: var(--ts-base);
    z-index: 10;
}

.back-btn:hover {
    background: var(--primary-light);
    color: var(--primary);
    border-color: var(--primary-border, var(--primary));
    transform: translateY(-1px);
}

.profile-header-content {
    display: flex;
    align-items: center;
    gap: 30px;
}

.avatar-large {
    width: 100px;
    height: 100px;
    background: var(--primary);
    color: white;
    font-size: 40px;
    font-weight: 700;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 0 5px rgba(255,255,255,0.1);
}

.profile-basic-info h1 {
    font-size: 32px;
    margin-bottom: 12px;
}

.role-badge {
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    display: inline-block;
    letter-spacing: 0.5px;
}

/* Specific Badge Colors for Dark Background */
/* Specific Badge Colors */
.badge-secondary { background: var(--bg-main); color: var(--text-muted); border: 1px solid var(--border-subtle); }
.badge-danger { background: var(--danger-light); color: var(--danger); border: 1px solid var(--danger); }
.badge-success { background: var(--success-light); color: var(--success); border: 1px solid var(--success); }
.badge-warning { background: var(--warning-light); color: var(--warning); border: 1px solid var(--warning); }
.badge-info { background: var(--info-light); color: var(--info); border: 1px solid var(--info); }

.profile-content {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
}

.info-card, .locations-card {
    background: var(--bg-card);
    padding: 30px;
    border-radius: 20px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-subtle);
}

h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-main);
    margin-bottom: 24px;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--border-subtle);
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
}

.info-item label {
    display: block;
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.info-item .value {
    font-size: 16px;
    color: var(--text-main);
    font-weight: 500;
}

.locations-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

.location-item-card {
    background: var(--bg-main);
    border: 1px solid var(--border-subtle);
    padding: 20px;
    border-radius: 16px;
    display: flex;
    align-items: flex-start;
    gap: 15px;
    transition: var(--ts-base);
}

.location-item-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--primary-border, var(--primary));
}

.loc-icon {
    background: var(--primary-light);
    color: var(--primary);
    padding: 10px;
    border-radius: 12px;
}

.loc-details h4 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 4px;
}

.loc-details p {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 10px;
}

.status-badge {
    font-size: 12px;
    font-weight: 600;
}

.status-badge.active, .status-badge.active-status { color: var(--success); }
.status-badge.inactive, .status-badge.inactive-status { color: var(--text-muted); }

.location-item-card.active-location {
    border-color: var(--primary);
    background: var(--primary-light);
    box-shadow: 0 4px 12px var(--primary-shadow);
}
</style>
