<template>
  <div class="return-requests-page animate-fade-in">
    <header class="page-header">
      <div>
        <h1 class="page-title">Return Requests</h1>
        <p class="subtitle" v-if="locationName">
          Manage vehicle returns for {{ locationName }}
        </p>
      </div>
      <div class="header-actions">
        <div class="live-indicator">
          <span class="dot animate-pulse"></span>
          Live Updates
        </div>
      </div>
    </header>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- Stats Summary -->
    <div class="stats-summary mb-6">
      <div class="stat-box warning">
        <span class="stat-label">Pending Requests</span>
        <span class="stat-value">{{ pendingRequestsCount }}</span>
      </div>
      <div class="stat-box success">
        <span class="stat-label">Ready for Pickup</span>
        <span class="stat-value">{{ readyCount }}</span>
      </div>
    </div>

    <div v-if="loading && !activeRequests.length" class="loading-state">
      <div class="spinner"></div>
      <span>Loading requests...</span>
    </div>

    <div v-else-if="activeRequests.length === 0" class="empty-state">
      <div class="empty-icon-container">
        <svg
          class="empty-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
          />
        </svg>
      </div>
      <h3>No Active Return Requests</h3>
      <p>There are no vehicles currently requested for return.</p>
    </div>

    <div v-else class="requests-grid">
      <div
        v-for="req in activeRequests"
        :key="req.valet_id"
        class="request-card"
        :class="req.status === 'RETURN_REQUESTED' ? 'status-requested' : 'status-ready'"
      >
        <div class="card-header">
          <span class="ticket-id">{{ formatTicketId(req.valet_id) }}</span>
          <span :class="['status-badge', getStatusClass(req.status)]">
            {{ formatStatus(req.status) }}
          </span>
        </div>

        <div class="card-body">
          <div class="vehicle-info">
            <div class="model-row">
              <h3>{{ req.car_model || 'Unknown Model' }}</h3>
              <span v-if="req.car_number" class="car-number-badge">{{ req.car_number }}</span>
            </div>
            <p class="customer-name">{{ req.customer_name }}</p>
            <div v-if="req.block_entry_id" class="location-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              {{ req.block_entry_id.split('-').slice(1).join('-') }}
            </div>
          </div>

          <div class="timers">
            <div class="time-item">
              <span class="label">Requested:</span>
              <span class="value">{{ formatTime(req.return_requested_time) }}</span>
            </div>
            <div v-if="req.ready_time" class="time-item">
              <span class="label">Ready:</span>
              <span class="value">{{ formatTime(req.ready_time) }}</span>
            </div>
          </div>
        </div>

        <div class="card-actions">
          <button
            v-if="req.status === 'RETURN_REQUESTED'"
            @click="markAsReady(req)"
            class="btn btn-primary btn-full"
            :disabled="processingId === req.valet_id"
          >
            <span v-if="processingId === req.valet_id">Processing...</span>
            <span v-else>Mark as Ready</span>
          </button>

          <button
            v-if="req.status === 'READY'"
            @click="markAsReturned(req)"
            class="btn btn-success btn-full"
            :disabled="processingId === req.valet_id"
          >
            <span v-if="processingId === req.valet_id">Processing...</span>
            <span v-else>Complete Return</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';
import { useToast } from '../../stores/toast';

const authStore = useAuthStore();
const toast = useToast();
const transactions = ref([]);
const loading = ref(false);
const error = ref(null);
const locationName = ref('');
const processingId = ref(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const activeRequests = computed(() => {
  return transactions.value.filter(t => ['RETURN_REQUESTED', 'READY'].includes(t.status));
});

const pendingRequestsCount = computed(() => {
  return transactions.value.filter(t => t.status === 'RETURN_REQUESTED').length;
});

const readyCount = computed(() => {
  return transactions.value.filter(t => t.status === 'READY').length;
});

const formatTicketId = (id) => {
  if (!id) return '';
  const parts = id.split('-');
  return parts.length > 2 ? parts.slice(1).join('-') : id;
};

const formatStatus = (status) => {
  if (!status) return '';
  return status.replace('_', ' ');
};

const getStatusClass = (status) => {
  switch (status) {
    case 'RETURN_REQUESTED': return 'badge-warning';
    case 'READY': return 'badge-success';
    default: return 'badge-default';
  }
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
};

const fetchData = async (showLoading = true) => {
  if (showLoading && transactions.value.length === 0) loading.value = true;
  error.value = null;

  try {
    if (!authStore.accessibleLocations || authStore.accessibleLocations.length === 0) {
      error.value = 'No accessible location found.';
      loading.value = false;
      return;
    }

    const locationId = authStore.accessibleLocations[0].location_id;
    locationName.value = authStore.accessibleLocations[0].location_name;

    const response = await axios.get(`${API_URL}/valet/vehicles`, {
      params: { location_id: locationId },
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    });

    if (response.data.success) {
      transactions.value = response.data.data;
    }
  } catch (err) {
    console.error('Fetch error:', err);
    error.value = 'Failed to load return requests.';
  } finally {
    loading.value = false;
  }
};

const updateStatus = async (txn, newStatus) => {
  processingId.value = txn.valet_id;
  try {
    const response = await axios.put(
      `${API_URL}/valet/status/${txn.valet_id}`,
      { status: newStatus },
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    );

    if (response.data.success) {
      toast.success(`Vehicle marked as ${newStatus}`);
      await fetchData(); // Refresh data
    } else {
      toast.error(response.data.message || 'Update failed');
    }
  } catch (err) {
    console.error('Update status error:', err);
    toast.error('Failed to update status');
  } finally {
    processingId.value = null;
  }
};

const markAsReady = (txn) => updateStatus(txn, 'READY');
const markAsReturned = (txn) => updateStatus(txn, 'RETURNED');

let pollInterval;
onMounted(() => {
  fetchData();
  pollInterval = setInterval(() => fetchData(false), 5000);
});
onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>
/* Reuse and extend styles from dashboard/transactions */
.return-requests-page {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.subtitle {
  color: var(--text-muted);
  font-size: 15px;
  margin-top: 4px;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.dot {
  width: 8px; height: 8px; background: #16a34a; border-radius: 50%;
}
.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
}

.stats-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-box {
  background: var(--bg-card);
  padding: 16px 24px;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: var(--shadow-sm);
}

.stat-box.warning { border-left: 4px solid #ea580c; }
.stat-box.success { border-left: 4px solid #16a34a; }

.stat-label { font-size: 14px; color: var(--text-muted); font-weight: 500; }
.stat-value { font-size: 24px; font-weight: 700; color: var(--text-main); font-family: 'Outfit', sans-serif;}

.requests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.request-card {
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.request-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.request-card.status-requested { border-top: 4px solid #ea580c; }
.request-card.status-ready { border-top: 4px solid #16a34a; }

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ticket-id {
  font-family: 'Outfit', monospace;
  font-weight: 700;
  font-size: 16px;
  color: var(--text-main);
}

.status-badge {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 20px;
  letter-spacing: 0.05em;
}

.badge-warning { background: var(--warning-light); color: var(--warning); border: 1px solid var(--warning-border, var(--warning)); }
.badge-success { background: var(--success-light); color: var(--success); border: 1px solid var(--success-border, var(--success)); }

.card-body {
  padding: 20px;
  flex: 1;
}

.vehicle-info .model-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.vehicle-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 0;
}

.car-number-badge {
  background: var(--bg-main);
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  font-family: 'Outfit', monospace;
  font-weight: 700;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}

.customer-name {
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 12px;
}

.location-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-main);
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.timers {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.time-item .label { color: var(--text-muted); }
.time-item .value { font-weight: 600; color: var(--text-main); font-family: 'Outfit', monospace; }

.card-actions {
  padding: 16px 20px;
  background: var(--bg-main);
  border-top: 1px solid var(--border-subtle);
}

.btn-full {
  width: 100%;
  justify-content: center;
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
}
.btn-primary:hover { background: var(--primary-hover); }

.btn-success {
  background: var(--success);
  color: white;
  border: none;
}
.btn-success:hover { opacity: 0.9; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px dashed var(--border-subtle);
  color: var(--text-muted);
}

.empty-icon-container {
  width: 80px;
  height: 80px;
  background: var(--bg-main);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-icon {
  width: 32px;
  height: 32px;
  color: var(--text-muted);
  opacity: 0.7;
}

/* Animations */
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Responsive */
@media (max-width: 640px) {
  .stats-summary { flex-direction: column; gap: 12px; }
  .requests-grid { grid-template-columns: 1fr; }
}
</style>
