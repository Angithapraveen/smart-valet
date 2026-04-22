<template>
  <div class="owner-location-details-page animate-fade-in">
    <!-- Header Section -->
    <header class="location-header" v-if="location">
      <button class="back-link" @click="$router.push('/owner/dashboard')">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
                Back to Dashboard
            </button>

      <div class="location-info-stack">
        <div class="title-row">
            <h1 class="page-title">{{ location.location_name }}</h1>
            <button class="btn-edit-main" @click="openLocationModal">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit Location
            </button>
        </div>
        <div class="location-meta">
            <span class="badge" :class="location.status ? 'badge-success' : 'badge-danger'">
                {{ location.status ? 'Active' : 'Inactive' }}
            </span>
            <span class="meta-dot"></span>
            <span class="location-type">{{ location.location_type }}</span>
            <span v-if="location.address" class="meta-dot"></span>
            <span v-if="location.address" class="location-address">{{ location.address }}</span>
        </div>
      </div>
    </header>

    <div v-else class="loading-state">
        Loading location details...
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid" v-if="stats">
        <div class="stat-card">
            <div class="stat-value">{{ stats.total_blocks }}</div>
            <div class="stat-label">Total Blocks</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{{ stats.total_managers }}</div>
            <div class="stat-label">Total Managers</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{{ stats.total_drivers }}</div>
            <div class="stat-label">Total Drivers</div>
        </div>
         <div class="stat-card">
            <div class="stat-value text-primary">{{ stats.active_parkings }}</div>
            <div class="stat-label">Active Parkings</div>
        </div>
        <div class="stat-card">
            <div class="stat-value text-success">{{ stats.available_slots }}</div>
            <div class="stat-label">Available Slots</div>
        </div>
        <div class="stat-card">
            <div class="stat-value text-danger">{{ stats.occupied_slots }}</div>
            <div class="stat-label">Occupied Slots</div>
        </div>
    </div>

    <!-- Tabs Section -->
    <div class="tabs-section" v-if="location">
        <div class="tabs-header">
            <div class="tabs-nav">
                <button 
                    v-for="tab in tabs" 
                    :key="tab.id" 
                    class="tab-btn" 
                    :class="{ active: activeTab === tab.id }"
                    @click="switchTab(tab.id)"
                >
                    {{ tab.label }}
                </button>
            </div>
            <div class="tabs-actions">
                <button v-if="activeTab === 'blocks'" class="btn-add" @click="showBlockModal = true">
                    + Add Block
                </button>
                <button v-if="activeTab === 'managers'" class="btn-add" @click="showManagerModal = true">
                    + Add Manager
                </button>
                <button v-if="activeTab === 'drivers'" class="btn-add" @click="showDriverModal = true">
                    + Add Driver
                </button>
            </div>
        </div>

        <div class="tab-content">
             <!-- Loading State for Tab Data -->
             <div v-if="tabLoading" class="tab-loading">
                 <div class="spinner"></div>
                 <span>Loading {{ activeTab.replace('_', ' ') }}...</span>
             </div>

             <!-- Data Display -->
             <div v-else>
                 <!-- USERS LIST (Managers, Drivers, Owners) -->
                 <div v-if="['managers', 'drivers', 'owners'].includes(activeTab)">
                     <div v-if="tabData.length > 0" class="grid-list">
                         <div v-for="user in tabData" :key="user.user_id" class="user-card">
                             <div class="user-info">
                                 <p class="user-name">{{ user.name }}</p>
                                 <p class="user-email">{{ user.email_id }}</p>
                                 <div class="status-badge-compact" :class="user.status ? 'status-active' : 'status-inactive'">
                                     {{ user.status ? 'Active' : 'Inactive' }}
                                 </div>
                             </div>
                             <div class="user-actions" v-if="activeTab !== 'owners'">
                                 <button 
                                     class="action-btn-sm" 
                                     :class="user.status ? 'btn-deactivate' : 'btn-activate'"
                                     @click="toggleUserStatus(user)"
                                     :disabled="togglingUser === user.user_id"
                                 >
                                     {{ togglingUser === user.user_id ? '...' : (user.status ? 'Deactivate' : 'Activate') }}
                                 </button>
                             </div>
                         </div>
                     </div>
                     <div v-else class="empty-tab">
                         No {{ activeTab }} found.
                     </div>
                 </div>

                 <!-- BLOCKS LIST -->
                 <div v-if="activeTab === 'blocks'">
                     <div v-if="tabData.length > 0" class="blocks-container">
                         <div v-for="block in tabData" :key="block.block_id" class="block-detail-card">
                             <!-- Block Header -->
                             <div class="block-card-header">
                                 <div class="block-info-row">
                                     <div>
                                         <h3 class="block-name">{{ block.block_name }}</h3>
                                         <span class="block-id">{{ block.block_id }}</span>
                                     </div>
                                     <span :class="['status-badge', block.status ? 'status-active' : 'status-inactive']">
                                         {{ block.status ? 'ACTIVE' : 'INACTIVE' }}
                                     </span>
                                 </div>
                             </div>
                             
                             <!-- Block Details -->
                             <div class="block-details-grid">
                                 <div class="detail-item">
                                     <span class="detail-label">Capacity:</span>
                                     <span class="detail-value">{{ block.capacity }}</span>
                                 </div>
                                 <div class="detail-item">
                                     <span class="detail-label">Valid:</span>
                                     <span class="detail-value">{{ formatDate(block.valid_from) }} → {{ formatDate(block.valid_to) }}</span>
                                 </div>
                             </div>
                             
                             <!-- Edit Button -->
                             <button class="btn-edit-block" @click="openEditBlockModal(block)">
                                 Edit Block
                             </button>
                             
                             <!-- Block Entries Grid -->
                             <div class="entries-section">
                                 <h4 class="entries-heading">Parking Slots</h4>
                                 <div class="entries-grid">
                                     <div
                                         v-for="entry in block.entries"
                                         :key="entry.block_entry_id"
                                         :class="['entry-box', entry.status === 'AVAILABLE' ? 'entry-available' : 'entry-occupied']"
                                     >
                                         <div class="entry-id">{{ entry.block_entry_id }}</div>
                                         <div class="entry-status">{{ entry.status === 'AVAILABLE' ? 'Available' : 'Occupied' }}</div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>
                     <div v-else class="empty-tab">
                         No blocks found.
                     </div>
                 </div>

                 <!-- ACTIVE PARKING LIST -->
                 <div v-if="activeTab === 'active_parking'">
                     <div v-if="tabData.length > 0" class="parking-table-container">
                         <table class="parking-table">
                             <thead>
                                 <tr>
                                     <th>Ticket ID</th>
                                     <th>Customer</th>
                                     <th>Vehicle</th>
                                     <th>Details</th>
                                     <th>Status</th>
                                     <th>Parked At</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 <tr v-for="record in tabData" :key="record.valet_id">
                                     <td>
                                         <span class="ticket-id-badge">{{ record.valet_id }}</span>
                                     </td>
                                     <td>
                                         <div class="customer-info">
                                             <p class="c-name">{{ record.customer_name }}</p>
                                             <p class="c-phone">{{ record.phone_number }}</p>
                                         </div>
                                     </td>
                                     <td>
                                         <div class="vehicle-info">
                                             <p class="v-model">{{ record.car_model || 'Unknown Model' }}</p>
                                             <p class="v-cat">{{ record.car_category }}</p>
                                         </div>
                                     </td>
                                     <td>
                                          <div class="parking-loc">
                                              <span class="loc-block">{{ record.block_name || 'Unassigned' }}</span>
                                              <span class="loc-entry">{{ record.block_entry_id || 'N/A' }}</span>
                                          </div>
                                      </td>
                                      <td>
                                          <span :class="['status-pill', getStatusClass(record.status)]">
                                              {{ record.status.replace('_', ' ') }}
                                          </span>
                                      </td>
                                      <td>
                                          <div class="time-info">
                                              <p class="t-date">{{ formatDate(record.parked_time) }}</p>
                                              <p class="t-time">{{ record.parked_time ? new Date(record.parked_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A' }}</p>
                                          </div>
                                      </td>
                                 </tr>
                             </tbody>
                         </table>
                     </div>
                     <div v-else class="empty-tab">
                         No active parking records found.
                     </div>
                 </div>
                 
                 <!-- REPORTS TAB -->
                 <div v-if="activeTab === 'reports'">
                     <LocationReport :locationId="locationId" :locationName="location?.location_name || ''" :showHeader="false" />
                 </div>
             </div>
        </div>
    </div>

    <!-- Manager Modal -->
    <div v-if="showManagerModal" class="modal-overlay" @click.self="closeManagerModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add Manager</h2>
                <button class="modal-close" @click="closeManagerModal">×</button>
            </div>
            <form @submit.prevent="submitManager">
                <div v-if="managerError" class="error-message">{{ managerError }}</div>
                
                <div class="form-group">
                    <label>Name <span class="required">*</span></label>
                    <input v-model="managerForm.name" type="text" required placeholder="e.g. John Doe" class="form-input" @input="handleNameInput('manager')" />
                </div>
                
                <div class="form-group">
                    <label>Email <span class="required">*</span></label>
                    <input v-model="managerForm.email_id" type="email" required placeholder="e.g. manager@example.com" class="form-input" autocomplete="off" />
                </div>
                
                <div class="form-group">
                    <label>Phone Number <span class="required">*</span></label>
                    <input v-model="managerForm.phone_number" type="tel" required placeholder="e.g. 9876543210" class="form-input" autocomplete="off" @input="handlePhoneInput('manager')" maxlength="10" />
                </div>
                
                <div class="form-group">
                    <label>Password <span class="required">*</span></label>
                    <input v-model="managerForm.password" type="password" required minlength="6" placeholder="Minimum 6 characters" class="form-input" autocomplete="new-password" />
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" @click="closeManagerModal">Cancel</button>
                    <button type="submit" class="btn-primary" :disabled="managerLoading">
                        {{ managerLoading ? 'Creating...' : 'Create Manager' }}
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Driver Modal -->
    <div v-if="showDriverModal" class="modal-overlay" @click.self="closeDriverModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add Driver</h2>
                <button class="modal-close" @click="closeDriverModal">×</button>
            </div>
            <form @submit.prevent="submitDriver">
                <div v-if="driverError" class="error-message">{{ driverError }}</div>
                
                <div class="form-group">
                    <label>Name <span class="required">*</span></label>
                    <input v-model="driverForm.name" type="text" required placeholder="e.g. John Doe" class="form-input" @input="handleNameInput('driver')" />
                </div>
                
                <div class="form-group">
                    <label>Email <span class="required">*</span></label>
                    <input v-model="driverForm.email_id" type="email" required placeholder="e.g. driver@example.com" class="form-input" autocomplete="off" />
                </div>
                
                <div class="form-group">
                    <label>Phone Number <span class="required">*</span></label>
                    <input v-model="driverForm.phone_number" type="tel" required placeholder="e.g. 9876543210" class="form-input" autocomplete="off" @input="handlePhoneInput('driver')" maxlength="10" />
                </div>
                
                <div class="form-group">
                    <label>Password <span class="required">*</span></label>
                    <input v-model="driverForm.password" type="password" required minlength="6" placeholder="Minimum 6 characters" class="form-input" autocomplete="new-password" />
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" @click="closeDriverModal">Cancel</button>
                    <button type="submit" class="btn-primary" :disabled="driverLoading">
                        {{ driverLoading ? 'Creating...' : 'Create Driver' }}
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Block Modal -->
    <div v-if="showBlockModal" class="modal-overlay" @click.self="closeBlockModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add Block</h2>
                <button class="modal-close" @click="closeBlockModal">×</button>
            </div>
            <form @submit.prevent="submitBlock">
                <div v-if="blockError" class="error-message">{{ blockError }}</div>
                
                <div class="form-group">
                    <label>Block Name <span class="required">*</span></label>
                    <input v-model="blockForm.block_name" type="text" required placeholder="e.g. Basement A" class="form-input" />
                </div>
                
                <div class="form-group">
                    <label>Capacity <span class="required">*</span></label>
                    <input v-model.number="blockForm.capacity" type="number" required min="1" max="1000" placeholder="e.g. 50" class="form-input" />
                    <span class="hint">Number of parking slots (1-1000)</span>
                </div>
                
                <div class="form-group">
                    <label>Valid From <span class="required">*</span></label>
                    <input v-model="blockForm.valid_from" type="date" required class="form-input" />
                </div>
                
                <div class="form-group">
                    <label>Valid To <span class="required">*</span></label>
                    <input v-model="blockForm.valid_to" type="date" required class="form-input" />
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" @click="closeBlockModal">Cancel</button>
                    <button type="submit" class="btn-primary" :disabled="blockLoading">
                        {{ blockLoading ? 'Creating...' : 'Create Block' }}
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit Block Modal -->
    <div v-if="showEditBlockModal" class="modal-overlay" @click.self="closeEditBlockModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Block</h2>
                <button class="modal-close" @click="closeEditBlockModal">×</button>
            </div>
            <form @submit.prevent="submitEditBlock">
                <div v-if="editBlockError" class="error-message">{{ editBlockError }}</div>
                
                <div class="form-group">
                    <label>Block ID</label>
                    <input :value="editBlockForm.block_id" type="text" disabled class="form-input" style="background: #f3f4f6; cursor: not-allowed;" />
                </div>
                
                <div class="form-group">
                    <label>Block Name <span class="required">*</span></label>
                    <input v-model="editBlockForm.block_name" type="text" required placeholder="e.g. Basement A" class="form-input" />
                </div>
                
                <div class="form-group">
                    <label>Capacity <span class="required">*</span></label>
                    <input v-model.number="editBlockForm.capacity" type="number" required min="1" max="1000" placeholder="e.g. 50" class="form-input" />
                    <span class="hint">Number of parking slots (1-1000)</span>
                </div>
                
                <div class="form-group">
                    <label>Valid From <span class="required">*</span></label>
                    <input v-model="editBlockForm.valid_from" type="date" required class="form-input" />
                </div>
                
                <div class="form-group">
                    <label>Valid To <span class="required">*</span></label>
                    <input v-model="editBlockForm.valid_to" type="date" required class="form-input" />
                </div>
                
                <div class="form-group">
                    <label>Status <span class="required">*</span></label>
                    <select v-model="editBlockForm.status" required class="form-input">
                        <option :value="true">Active</option>
                        <option :value="false">Inactive</option>
                    </select>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" @click="closeEditBlockModal">Cancel</button>
                    <button type="submit" class="btn-primary" :disabled="editBlockLoading">
                        {{ editBlockLoading ? 'Updating...' : 'Update Block' }}
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit Location Modal -->
    <div v-if="showLocationModal" class="modal-overlay" @click.self="closeLocationModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Location Details</h2>
                <button class="modal-close" @click="closeLocationModal">×</button>
            </div>
            <form @submit.prevent="submitLocation">
                <div v-if="locationError" class="error-message">{{ locationError }}</div>
                
                <div class="form-group">
                    <label>Location ID</label>
                    <input :value="locationId" type="text" disabled class="form-input disabled-input" />
                </div>
                
                <div class="form-group">
                    <label>Location Name <span class="required">*</span></label>
                    <input v-model="locationForm.location_name" type="text" required class="form-input" />
                </div>
                
                <div class="form-group">
                    <label>Location Type <span class="required">*</span></label>
                    <select v-model="locationForm.location_type" required class="form-input">
                        <option value="Mall">Mall</option>
                        <option value="Hotel">Hotel</option>
                        <option value="Hospital">Hospital</option>
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                
                <div v-if="locationForm.location_type === 'Other'" class="form-group animate-slide-down">
                    <label>Custom Location Type <span class="required">*</span></label>
                    <input v-model="customLocationType" type="text" required placeholder="e.g. Airport, Stadium" class="form-input" />
                </div>
                
                <div class="form-group">
                    <label>Address</label>
                    <textarea v-model="locationForm.address" rows="2" class="form-input" placeholder="Enter full address"></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group col">
                        <label>Valid From <span class="required">*</span></label>
                        <input v-model="locationForm.valid_from" type="date" required class="form-input" />
                    </div>
                    <div class="form-group col">
                        <label>Valid To</label>
                        <input v-model="locationForm.valid_to" type="date" class="form-input" />
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group col">
                        <label>Total Capacity <span class="required">*</span></label>
                        <input v-model.number="locationForm.total_capacity" type="number" required min="1" class="form-input" />
                    </div>
                    <div class="form-group col">
                        <label>Status <span class="required">*</span></label>
                        <select v-model="locationForm.status" required class="form-input">
                            <option :value="true">Active</option>
                            <option :value="false">Inactive</option>
                        </select>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" @click="closeLocationModal">Cancel</button>
                    <button type="submit" class="btn-primary" :disabled="locationLoading">
                        {{ locationLoading ? 'Updating...' : 'Update Details' }}
                    </button>
                </div>
            </form>
        </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../../stores/auth';
import { useToast } from '../../stores/toast';
import LocationReport from '../../components/reports/LocationReport.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();
const locationId = route.params.id;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const location = ref(null);
const stats = ref(null);
const activeTab = ref('blocks');
const tabData = ref([]);
const tabLoading = ref(false);
const togglingUser = ref(null);

// Modal states
const showManagerModal = ref(false);
const showDriverModal = ref(false);
const showBlockModal = ref(false);
const showEditBlockModal = ref(false);
const showLocationModal = ref(false);
const managerLoading = ref(false);
const driverLoading = ref(false);
const blockLoading = ref(false);
const editBlockLoading = ref(false);
const locationLoading = ref(false);
const managerError = ref('');
const driverError = ref('');
const blockError = ref('');
const editBlockError = ref('');
const locationError = ref('');

const standardTypes = ['Mall', 'Hotel', 'Hospital', 'Residential', 'Commercial'];
const customLocationType = ref('');

// Forms
const managerForm = ref({
    name: '',
    email_id: '',
    phone_number: '',
    password: ''
});

const driverForm = ref({
    name: '',
    email_id: '',
    phone_number: '',
    password: ''
});

const blockForm = ref({
    block_name: '',
    capacity: null,
    valid_from: '',
    valid_to: ''
});

const editBlockForm = ref({
    block_id: '',
    block_name: '',
    capacity: null,
    valid_from: '',
    valid_to: '',
    status: true
});

const locationForm = ref({
    location_name: '',
    location_type: '',
    address: '',
    valid_from: '',
    valid_to: '',
    total_capacity: 100,
    status: true
});

const handleNameInput = (field) => {
    if (field === 'manager') {
        managerForm.value.name = managerForm.value.name.replace(/[^a-zA-Z\s]/g, '');
    } else if (field === 'driver') {
        driverForm.value.name = driverForm.value.name.replace(/[^a-zA-Z\s]/g, '');
    }
};

const handlePhoneInput = (field) => {
    if (field === 'manager') {
        managerForm.value.phone_number = managerForm.value.phone_number.replace(/\D/g, '').slice(0, 10);
    } else if (field === 'driver') {
        driverForm.value.phone_number = driverForm.value.phone_number.replace(/\D/g, '').slice(0, 10);
    }
};

const tabs = [
    { id: 'blocks', label: 'Blocks' },
    { id: 'active_parking', label: 'Active Parking' },
    { id: 'managers', label: 'Managers' },
    { id: 'drivers', label: 'Drivers' },
    { id: 'owners', label: 'Owners' },
    { id: 'reports', label: 'Reports' }
];

// Fetch Location & Stats
const fetchLocationDetails = async () => {
    try {
        const response = await axios.get(`${API_URL}/dashboard/owner/location/${locationId}`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
            location.value = response.data.data.location;
            stats.value = response.data.data.stats;
            // Load initial tab
            switchTab('blocks');
        }
    } catch (error) {
        console.error('Error fetching details:', error);
    }
};

// Switch Tab & Load Data
const switchTab = async (tabId) => {
    activeTab.value = tabId;
    
    if (tabId === 'reports') {
        tabLoading.value = false;
        return;
    }
    
    tabLoading.value = true;
    tabData.value = [];

    try {
        let endpoint = '';
        if (tabId === 'blocks') {
            endpoint = `${API_URL}/owner/locations/${locationId}/blocks`;
        } else if (tabId === 'active_parking') {
            endpoint = `${API_URL}/dashboard/owner/location/${locationId}/active-parking`;
        } else {
            endpoint = `${API_URL}/dashboard/owner/locations/${locationId}/users?type=${tabId}`;
        }

        const response = await axios.get(endpoint, {
             headers: { Authorization: `Bearer ${authStore.token}` }
        });

        if (response.data.success) {
            tabData.value = response.data.data;
        }

    } catch (error) {
        console.error(`Error fetching ${tabId}:`, error);
    } finally {
        tabLoading.value = false;
    }
};

const toggleUserStatus = async (user) => {
    togglingUser.value = user.user_id;
    try {
        const response = await axios.put(`${API_URL}/owner/user/${user.user_id}/status`, 
            { status: !user.status },
            { headers: { Authorization: `Bearer ${authStore.token}` } }
        );

        if (response.data.success) {
            user.status = !user.status;
            toast.success(response.data.message || 'Status updated successfully.');
        }
    } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to update user status');
    } finally {
        togglingUser.value = null;
    }
};

// Manager Modal
const closeManagerModal = () => {
    showManagerModal.value = false;
    managerError.value = '';
    managerForm.value = { name: '', email_id: '', phone_number: '', password: '' };
};

const submitManager = async () => {
    managerError.value = '';
    managerLoading.value = true;
    
    try {
        const response = await axios.post(
            `${API_URL}/owner/location/${locationId}/manager`,
            managerForm.value,
            { headers: { Authorization: `Bearer ${authStore.token}` } }
        );
        
        if (response.data.success) {
            closeManagerModal();
            // Refresh managers list
            await switchTab('managers');
            // Update stats
            if (stats.value) {
                stats.value.total_managers += 1;
            }
            toast.success('Manager created successfully!');
        }
    } catch (error) {
        console.error('Manager creation error:', error);
        managerError.value = error.response?.data?.message || 'Failed to create manager.';
    } finally {
        managerLoading.value = false;
    }
};

// Driver Modal
const closeDriverModal = () => {
    showDriverModal.value = false;
    driverError.value = '';
    driverForm.value = { name: '', email_id: '', phone_number: '', password: '' };
};

const submitDriver = async () => {
    driverError.value = '';
    driverLoading.value = true;
    
    try {
        const response = await axios.post(
            `${API_URL}/owner/location/${locationId}/driver`,
            driverForm.value,
            { headers: { Authorization: `Bearer ${authStore.token}` } }
        );
        
        if (response.data.success) {
            closeDriverModal();
            // Refresh drivers list
            await switchTab('drivers');
            // Update stats
            if (stats.value) {
                stats.value.total_drivers += 1;
            }
            toast.success('Driver created successfully!');
        }
    } catch (error) {
        console.error('Driver creation error:', error);
        driverError.value = error.response?.data?.message || 'Failed to create driver.';
    } finally {
        driverLoading.value = false;
    }
};

// Block Modal
const closeBlockModal = () => {
    showBlockModal.value = false;
    blockError.value = '';
    blockForm.value = { block_name: '', capacity: null, valid_from: '', valid_to: '' };
};

const submitBlock = async () => {
    blockError.value = '';
    
    if (!blockForm.value.capacity || blockForm.value.capacity < 1 || blockForm.value.capacity > 1000) {
        blockError.value = 'Capacity must be between 1 and 1000.';
        return;
    }
    
    if (!blockForm.value.valid_from || !blockForm.value.valid_to) {
        blockError.value = 'Both validity dates are required.';
        return;
    }
    
    const fromDate = new Date(blockForm.value.valid_from);
    const toDate = new Date(blockForm.value.valid_to);
    
    if (fromDate >= toDate) {
        blockError.value = 'Valid From date must be before Valid To date.';
        return;
    }
    
    blockLoading.value = true;
    
    try {
        const response = await axios.post(
            `${API_URL}/owner/locations/${locationId}/blocks`,
            blockForm.value,
            { headers: { Authorization: `Bearer ${authStore.token}` } }
        );
        
        if (response.data.success) {
            closeBlockModal();
            // Refresh blocks list
            await switchTab('blocks');
            // Update stats
            if (stats.value) {
                stats.value.total_blocks += 1;
            }
            toast.success(`Block created successfully! ${response.data.data.entries_created} parking slots generated.`);
        }
    } catch (error) {
        console.error('Block creation error:', error);
        blockError.value = error.response?.data?.message || 'Failed to create block.';
    } finally {
        blockLoading.value = false;
    }
};

// Edit Block Modal
const openEditBlockModal = (block) => {
    editBlockForm.value = {
        block_id: block.block_id,
        block_name: block.block_name,
        capacity: block.capacity,
        valid_from: block.valid_from.split('T')[0], // Format date for input
        valid_to: block.valid_to.split('T')[0],
        status: block.status
    };
    showEditBlockModal.value = true;
};

const closeEditBlockModal = () => {
    showEditBlockModal.value = false;
    editBlockError.value = '';
    editBlockForm.value = {
        block_id: '',
        block_name: '',
        capacity: null,
        valid_from: '',
        valid_to: '',
        status: true
    };
};

const submitEditBlock = async () => {
    editBlockError.value = '';
    
    if (!editBlockForm.value.capacity || editBlockForm.value.capacity < 1 || editBlockForm.value.capacity > 1000) {
        editBlockError.value = 'Capacity must be between 1 and 1000.';
        return;
    }
    
    if (!editBlockForm.value.valid_from || !editBlockForm.value.valid_to) {
        editBlockError.value = 'Both validity dates are required.';
        return;
    }
    
    const fromDate = new Date(editBlockForm.value.valid_from);
    const toDate = new Date(editBlockForm.value.valid_to);
    
    if (fromDate >= toDate) {
        editBlockError.value = 'Valid From date must be before Valid To date.';
        return;
    }
    
    editBlockLoading.value = true;
    
    try {
        const payload = {
            block_name: editBlockForm.value.block_name,
            capacity: editBlockForm.value.capacity,
            valid_from: editBlockForm.value.valid_from,
            valid_to: editBlockForm.value.valid_to,
            status: editBlockForm.value.status
        };
        
        const response = await axios.put(
            `${API_URL}/owner/blocks/${editBlockForm.value.block_id}`,
            payload,
            { headers: { Authorization: `Bearer ${authStore.token}` } }
        );
        
        if (response.data.success) {
            closeEditBlockModal();
            // Refresh blocks list
            await switchTab('blocks');
            toast.success('Block updated successfully!');
        }
    } catch (error) {
        console.error('Block update error:', error);
        editBlockError.value = error.response?.data?.message || 'Failed to update block.';
    } finally {
        editBlockLoading.value = false;
    }
};

// Location Modal
const openLocationModal = () => {
    if (!location.value) return;
    
    if (standardTypes.includes(location.value.location_type)) {
        locationForm.value.location_type = location.value.location_type;
        customLocationType.value = '';
    } else {
        locationForm.value.location_type = 'Other';
        customLocationType.value = location.value.location_type || '';
    }

    locationForm.value = {
        ...locationForm.value,
        location_name: location.value.location_name,
        address: location.value.address || '',
        valid_from: location.value.valid_from ? location.value.valid_from.split('T')[0] : '',
        valid_to: location.value.valid_to ? location.value.valid_to.split('T')[0] : '',
        total_capacity: location.value.total_capacity || 100,
        status: location.value.status
    };
    showLocationModal.value = true;
};

const closeLocationModal = () => {
    showLocationModal.value = false;
    locationError.value = '';
    customLocationType.value = '';
};

const submitLocation = async () => {
    locationError.value = '';
    locationLoading.value = true;
    
    try {
        const payload = { ...locationForm.value };
        if (payload.location_type === 'Other') {
            if (!customLocationType.value.trim()) {
                locationError.value = 'Please specify a custom location type.';
                locationLoading.value = false;
                return;
            }
            payload.location_type = customLocationType.value.trim();
        }

        const response = await axios.put(
            `${API_URL}/owner/location/${locationId}`,
            payload,
            { headers: { Authorization: `Bearer ${authStore.token}` } }
        );
        
        if (response.data.success) {
            closeLocationModal();
            location.value = response.data.data;
            toast.success('Location details updated successfully!');
        }
    } catch (error) {
        console.error('Location update error:', error);
        locationError.value = error.response?.data?.message || 'Failed to update location details.';
    } finally {
        locationLoading.value = false;
    }
};

// Helper function to format dates
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getStatusClass = (status) => {
    switch (status) {
        case 'PARKED': return 'badge-success';
        case 'RETURN_REQUESTED': return 'badge-warning';
        case 'READY': return 'badge-primary';
        case 'RETURNED': return 'badge-info';
        default: return 'badge-secondary';
    }
};

onMounted(() => {
    fetchLocationDetails();
});
</script>

<style scoped>
.owner-location-details-page {
  padding-top: 16px;
}

/* Header Section */
.location-header {
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.back-link {
  display: inline-flex;
    align-items: center;
    gap: 8px;
  background: none;
    border: none;
  color: var(--text-muted);
    font-size: 14px;
  font-weight: 600;
    cursor: pointer;
  padding: 0;
  width: fit-content;
  transition: all 0.2s var(--ease-out);
}

.back-link:hover {
  color: var(--primary);
  transform: translateX(-4px);
}

.location-info-stack {
    display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-title {
  margin: 0;
  font-size: 36px;
  color: var(--text-main);
  font-weight: 800;
  line-height: 1.2;
}

.title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
}

.btn-edit-main {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--bg-card);
    color: var(--primary);
    border: 1px solid var(--primary);
    border-radius: 10px;
    padding: 10px 18px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s var(--ease-out);
    white-space: nowrap;
}

.btn-edit-main:hover {
    background: var(--primary);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--primary-light);
}

.location-address {
    font-size: 14px;
    color: var(--text-muted);
    font-weight: 500;
}

.location-meta {
    display: flex;
    align-items: center;
  gap: 12px;
}

.meta-dot {
  width: 4px;
  height: 4px;
  background: var(--border-subtle);
  border-radius: 50%;
}

.location-type {
    font-weight: 600;
  color: var(--text-muted);
  font-size: 14px;
}

/* Stats Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 16px;
    margin-bottom: 30px;
}

.stat-card {
    background: var(--bg-card);
    padding: 20px;
    border-radius: 12px;
    box-shadow: var(--shadow-sm);
    text-align: center;
    border: 1px solid var(--border-subtle);
}

.stat-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-main);
    line-height: 1.2;
    margin-bottom: 4px;
}

.stat-label {
    font-size: 12px;
    color: var(--text-muted);
    text-transform: uppercase;
    font-weight: 600;
}

.text-primary { color: var(--primary); }
.text-success { color: var(--success); }
.text-danger { color: var(--danger); }

/* Tabs Section */
.tabs-section {
    background: var(--bg-card);
    border-radius: 12px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-subtle);
    overflow: hidden;
    min-height: 400px;
}

.tabs-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-subtle);
    background: var(--bg-main);
    padding: 0 20px;
}

.tabs-nav {
    display: flex;
}

.tabs-actions {
    display: flex;
    gap: 10px;
}

.tab-btn {
    padding: 16px 24px;
    background: none;
    border: none;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-muted);
    cursor: pointer;
    border-bottom: 2px solid transparent;
}

.tab-btn:hover { color: var(--text-main); }
.tab-btn.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
    background: var(--bg-card);
}

.btn-add {
    background: #6545e5;
    color: white;
    border: none;
    border-radius: 10px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

.btn-add:hover {
    background: #7c5ef0;
}

.tab-content { padding: 24px; }

.tab-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: var(--text-muted);
    gap: 12px;
}

.spinner {
    width: 24px;
    height: 24px;
    border: 3px solid var(--border-subtle);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Grid List (Managers, Drivers, Owners) */
.grid-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
}

.user-card {
    background: var(--bg-main);
    padding: 16px;
    border-radius: 12px;
    border: 1px solid var(--border-subtle);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.user-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.user-name {
    font-weight: 600;
    color: var(--text-main);
    margin: 0;
}

.user-email {
    font-size: 13px;
    color: var(--text-muted);
    margin: 0;
}

.status-badge-compact {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 99px;
    width: fit-content;
    margin-top: 4px;
    text-transform: uppercase;
}

.status-active {
    background: #dcfce7;
    color: #166534;
}

.status-inactive {
    background: #fee2e2;
    color: #991b1b;
}

.action-btn-sm {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
}

.btn-activate {
    background: var(--success-light);
    color: var(--success);
    border-color: var(--success);
}

.btn-activate:hover {
    background: var(--bg-main);
}

.btn-deactivate {
    background: var(--danger-light);
    color: var(--danger);
    border-color: var(--danger);
}

.btn-deactivate:hover {
    background: var(--bg-main);
}

.action-btn-sm:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Block Cards */
.blocks-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.block-detail-card {
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 24px;
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.2s;
}

.block-detail-card:hover {
    box-shadow: var(--shadow-md);
}

.block-card-header {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 2px solid var(--border-subtle);
}

.block-info-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.block-name {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-main);
    margin: 0 0 6px 0;
}

.block-id {
    display: inline-block;
    background: var(--bg-main);
    color: var(--text-muted);
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Courier New', monospace;
}

.status-badge {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
}

.status-active {
    background: #dcfce7;
    color: #166534;
}

.status-inactive {
    background: #fee2e2;
    color: #991b1b;
}

.block-details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.detail-label {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
}

.detail-value {
    font-size: 15px;
    color: var(--text-main);
    font-weight: 600;
}

.btn-edit-block {
    background: #6545e5;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 20px;
}

.btn-edit-block:hover {
    background: #7c5ef0;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(101, 69, 229, 0.2);
}

.entries-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 2px solid var(--border-subtle);
}

.entries-heading {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-main);
    margin: 0 0 16px 0;
}

.entries-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 10px;
}

.entry-box {
    padding: 12px 8px;
    border-radius: 8px;
    text-align: center;
    transition: all 0.2s;
    cursor: default;
    border: 2px solid;
}

.entry-box:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.entry-id {
    font-size: 11px;
    font-weight: 700;
    font-family: 'Courier New', monospace;
    margin-bottom: 4px;
}

.entry-status {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.entry-available {
    background: var(--success-light);
    color: var(--success);
    border-color: var(--success);
}

.entry-occupied {
    background: var(--danger-light);
    color: var(--danger);
    border-color: var(--danger);
}

.block-card {
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 16px;
}

.block-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-subtle);
}

.block-code {
    font-weight: 700;
    font-size: 16px;
    color: var(--text-main);
}

.block-type {
    background: var(--bg-main);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    color: var(--text-muted);
}

.block-stats {
    display: flex;
    justify-content: space-between;
}

.b-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.b-val { font-weight: 600; font-size: 14px; color: var(--text-main); }
.b-lbl { font-size: 10px; color: var(--text-muted); text-transform: uppercase; }

.empty-tab {
    text-align: center;
    padding: 40px;
    color: var(--text-muted);
    background: var(--bg-main);
    border-radius: 8px;
}

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: var(--bg-card);
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-subtle);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-subtle);
}

.modal-header h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-main);
    margin: 0;
}

.modal-close {
    background: none;
    border: none;
    font-size: 28px;
    color: #999;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    width: 30px;
    height: 30px;
}

.modal-close:hover {
    color: #333;
}

.modal-content form {
    padding: 24px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-main);
    margin-bottom: 6px;
}

.required {
    color: #dc3545;
}

.hint {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 4px;
    display: block;
}

.form-input {
    width: 100%;
    padding: 10px 12px;
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    font-size: 15px;
    color: var(--text-main);
    box-sizing: border-box;
}

.form-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px var(--primary-light);
}

.disabled-input {
    background: rgba(255, 255, 255, 0.05) !important;
    color: var(--text-muted) !important;
    cursor: not-allowed !important;
    border-color: var(--border-subtle) !important;
}

.animate-slide-down {
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

.error-message {
    background: var(--danger-light);
    color: var(--danger);
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 14px;
    border: 1px solid var(--danger);
}

.modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
}

.form-row {
    display: flex;
    gap: 16px;
}

.form-row .col {
    flex: 1;
}

.btn-primary, .btn-secondary {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
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
    background: var(--bg-main);
    color: var(--text-muted);
}

.btn-secondary:hover {
    background: var(--bg-card);
    color: var(--text-main);
    border: 1px solid var(--border-subtle);
}

/* Parking Table Styles */
.parking-table-container {
    overflow-x: auto;
    background: var(--bg-card);
    border-radius: 8px;
}

.parking-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
}

.parking-table th {
    background: var(--bg-main);
    padding: 12px 16px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border-subtle);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.parking-table td {
    padding: 16px;
    border-bottom: 1px solid var(--border-subtle);
    vertical-align: middle;
}

.ticket-id-badge {
    background: var(--bg-main);
    color: var(--text-muted);
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 700;
    font-family: 'Courier New', monospace;
}

.customer-info .c-name, .vehicle-info .v-model {
    font-weight: 600;
    color: var(--text-main);
    margin: 0;
}

.customer-info .c-phone, .vehicle-info .v-cat, .parking-loc .loc-entry, .time-info .t-time {
    font-size: 13px;
    color: var(--text-muted);
    margin: 2px 0 0 0;
}

.parking-loc {
    display: flex;
    flex-direction: column;
}

.loc-block {
    font-weight: 600;
    color: var(--text-main);
}

.status-pill {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
}

.badge-success { background: var(--success-light); color: var(--success); }
.badge-warning { background: var(--warning-light); color: var(--warning); }
.badge-primary { background: var(--primary-light); color: var(--primary); }
.badge-info { background: var(--info-light); color: var(--info); }
.badge-secondary { background: var(--bg-main); color: var(--text-muted); }

.time-info .t-date {
    font-weight: 600;
    color: var(--text-main);
    margin: 0;
}
</style>
