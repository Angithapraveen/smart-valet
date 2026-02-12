<template>
  <div class="location-details-page">
    <!-- Professional Header -->
    <header class="page-header" v-if="location">
        <div class="header-top">
            <button class="back-btn" @click="$router.back()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                Back to Dashboard
            </button>
        </div>
        <div class="header-main">
            <div class="location-identity">
                <div class="loc-icon-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <div>
                    <h1>{{ location.location_name }}</h1>
                    <div class="meta-row">
                        <span class="badge" :class="location.status ? 'badge-success' : 'badge-danger'">
                            {{ location.status ? 'Active' : 'Inactive' }}
                        </span>
                        <span class="meta-separator">•</span>
                        <span class="location-type">{{ location.location_type }}</span>
                        <span class="meta-separator">•</span>
                        <span class="location-code">Code: {{ location.location_short_code }}</span>
                    </div>
                </div>
            </div>
            <div class="header-stats">
                 <!-- Future stats can go here -->
            </div>
        </div>
    </header>

    <div v-else class="loading-state">
        Loading location details...
    </div>

    <!-- Main Content Grid -->
    <div class="content-grid" v-if="location">
        
        <!-- Left Column: Details -->
        <aside class="details-sidebar">
            <div class="info-card">
                <h3>Details</h3>
                <div class="info-list">
                    <div class="info-item">
                        <label>Address</label>
                        <p>{{ location.address || 'No address provided' }}</p>
                    </div>
                    <div class="info-item">
                        <label>Valid From</label>
                        <p>{{ location.valid_from ? new Date(location.valid_from).toLocaleDateString() : 'N/A' }}</p>
                    </div>
                     <div class="info-item">
                        <label>Valid To</label>
                        <p>{{ location.valid_to ? new Date(location.valid_to).toLocaleDateString() : 'N/A' }}</p>
                    </div>
                </div>
            </div>
        </aside>

        <!-- Right Column: Tabs & Data -->
        <main class="main-data-area">
            <div class="tabs-container">
                <div class="tabs-header">
                    <button 
                        v-for="tab in tabs" 
                        :key="tab.id"
                        class="tab-btn"
                        :class="{ active: currentTab === tab.id }"
                        @click="currentTab = tab.id"
                    >
                        {{ tab.label }}
                    </button>
                </div>

                <div class="tab-content-area">
                    <!-- BLOCKS TAB -->
                    <div v-if="currentTab === 'blocks'" class="tab-pane">
                        <div class="pane-header">
                            <h3>Blocks Management</h3>
                            <button class="btn btn-outline-primary btn-sm">Manage Blocks</button>
                        </div>
                        <div class="empty-state-pane">
                            <p>No blocks configured for this location yet.</p>
                        </div>
                    </div>

                    <!-- OWNERS TAB -->
                    <div v-if="currentTab === 'owners'" class="tab-pane">
                        <div class="pane-header">
                            <h3>Assigned Owners</h3>
                            <button class="btn btn-primary btn-sm icon-btn" @click="$router.push({ path: '/admin/owner/add', query: { location_id: locationId } })">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                Add Owner
                            </button>
                        </div>
                        
                        <div class="table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Status</th>
                                        <th class="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="owner in owners" :key="owner.user_id">
                                        <td class="font-medium">{{ owner.name }}</td>
                                        <td class="text-dim">{{ owner.email_id }}</td>
                                        <td class="text-dim">{{ owner.phone_number }}</td>
                                        <td>
                                            <span class="status-dot" :class="owner.status ? 'active' : 'inactive'"></span>
                                            {{ owner.status ? 'Active' : 'Inactive' }}
                                        </td>
                                        <td class="text-right">
                                            <button class="btn-text">Edit</button>
                                        </td>
                                    </tr>
                                    <tr v-if="owners.length === 0">
                                        <td colspan="5" class="empty-message">No owners assigned to this location.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- DRIVERS TAB -->
                    <div v-if="currentTab === 'drivers'" class="tab-pane">
                         <div class="pane-header">
                            <h3>Assigned Drivers</h3>
                            <button class="btn btn-primary btn-sm">Add Driver</button>
                        </div>
                        <div class="empty-state-pane">
                            Drivers list coming soon...
                        </div>
                    </div>

                    <!-- SUMMARY TAB -->
                    <div v-if="currentTab === 'summary'" class="tab-pane">
                        <div class="pane-header">
                            <h3>Performance Summary</h3>
                        </div>
                         <div class="empty-state-pane">
                            Stats coming soon...
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../../stores/auth';

const route = useRoute();
const authStore = useAuthStore();
const locationId = route.params.id;

const location = ref(null);
const owners = ref([]);
const currentTab = ref('owners'); // Default to owners for now as it has data

const tabs = [
  { id: 'blocks', label: 'Blocks' },
  { id: 'owners', label: 'Owners' },
  { id: 'drivers', label: 'Drivers' },
  { id: 'summary', label: 'Summary' }
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const fetchLocationDetails = async () => {
    try {
        // Optimally, backend should have a specific endpoint. 
        // Using list for now as per previous context constraints/speed.
        const response = await axios.get(`${API_URL}/admin/locations`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
            const loc = response.data.data.find(l => l.location_id === locationId);
            if (loc) location.value = loc;
        }
    } catch (e) {
        console.error("Error fetching location", e);
    }
};

const fetchOwners = async () => {
    try {
        const response = await axios.get(`${API_URL}/admin/locations/${locationId}/owners`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
            owners.value = response.data.data;
        }
    } catch (e) {
        console.error("Error fetching owners", e);
    }
};

onMounted(() => {
    fetchLocationDetails();
    fetchOwners();
});
</script>

<style scoped>
.location-details-page {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
    min-height: 80vh;
}

/* Header Styles */
.page-header {
    background: white;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    margin-bottom: 30px;
}

.header-top {
    margin-bottom: 20px;
}

.back-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: none;
    color: #666;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    padding: 8px 0;
    transition: color 0.2s;
}

.back-btn:hover {
    color: var(--primary);
}

.header-main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.location-identity {
    display: flex;
    gap: 24px;
    align-items: flex-start;
}

.loc-icon-lg {
    width: 64px;
    height: 64px;
    background: #f0fdf4;
    color: #22c55e;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.location-identity h1 {
    font-size: 28px;
    font-weight: 700;
    color: #111;
    margin: 0 0 8px 0;
    line-height: 1.2;
}

.meta-row {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    color: #666;
}

.meta-separator { color: #ddd; }

.location-code {
    font-family: monospace;
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    color: #555;
    font-size: 12px;
}

/* Layout Grid */
.content-grid {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 30px;
}

/* Sidebar */
.info-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    border: 1px solid #f0f0f0;
}

.info-card h3 {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
}

.info-item { margin-bottom: 20px; }
.info-item:last-child { margin-bottom: 0; }
.info-item label {
    display: block;
    font-size: 12px;
    text-transform: uppercase;
    color: #888;
    margin-bottom: 6px;
    letter-spacing: 0.5px;
    font-weight: 600;
}
.info-item p {
    color: #333;
    font-size: 15px;
    font-weight: 500;
    line-height: 1.5;
}

/* Main Tabs Area */
.tabs-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    border: 1px solid #f0f0f0;
    overflow: hidden;
    min-height: 500px;
}

.tabs-header {
    display: flex;
    border-bottom: 1px solid #eee;
    padding: 0 24px;
    background: #fafafa;
}

.tab-btn {
    padding: 16px 24px;
    border: none;
    background: none;
    font-size: 14px;
    font-weight: 500;
    color: #666;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
}

.tab-btn:hover { color: #333; }
.tab-btn.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
    background: white;
}

.tab-content-area { padding: 0; }

.tab-pane { padding: 24px; }

.pane-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.pane-header h3 {
    font-size: 18px;
    font-weight: 600;
    color: #333;
}

/* Tables */
.table-container {
    border: 1px solid #eee;
    border-radius: 8px;
    overflow: hidden;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th, .data-table td {
    padding: 14px 20px;
    text-align: left;
    border-bottom: 1px solid #eee;
}

.data-table th {
    background: #f9f9f9;
    font-size: 12px;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: #fcfcfc; }

.font-medium { font-weight: 600; color: #333; }
.text-dim { color: #666; font-size: 14px; }
.text-right { text-align: right; }

.status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
}
.status-dot.active { background: #22c55e; }
.status-dot.inactive { background: #ef4444; }

.btn-text {
    background: none;
    border: none;
    color: var(--primary);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
}
.btn-text:hover { text-decoration: underline; }

/* Buttons & Badges */
.btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.btn-primary {
    background: var(--primary);
    color: white;
}
.btn-primary:hover { background: var(--primary-hover); }

.btn-outline-primary {
    background: white;
    border-color: var(--primary);
    color: var(--primary);
}

.badge {
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
}
.badge-success { background: #dcfce7; color: #15803d; }
.badge-danger { background: #fee2e2; color: #b91c1c; }

.loading-state, .empty-state-pane, .empty-message {
    text-align: center;
    padding: 40px;
    color: #888;
    background: #f9f9f9;
    border-radius: 8px;
}

@media (max-width: 1024px) {
    .content-grid {
        grid-template-columns: 1fr;
    }
}
</style>
