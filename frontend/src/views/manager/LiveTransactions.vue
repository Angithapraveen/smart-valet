<template>
  <div class="transactions-page animate-fade-in">
    <header class="page-header">
      <div>
        <h1 class="page-title">Live Transactions</h1>
        <p class="subtitle" v-if="locationName">
          Real-time parking status for {{ locationName }}
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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clip-rule="evenodd"
        />
      </svg>
      {{ error }}
    </div>

    <!-- Empty State -->
    <div v-if="!loading && transactions.length === 0" class="empty-state">
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <h3>No Active Transactions</h3>
      <p>There are no vehicles currently parked or requested.</p>
    </div>

    <!-- Transactions List -->
    <div v-else class="transactions-container">
      <div class="table-container">
        <table class="transactions-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>KeySlot</th>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Status</th>
              <th>Timestamps</th>
              <th>Block / Slot</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="txn in transactions"
              :key="txn.valet_id"
              class="txn-row animate-slide-up"
            >
              <td class="col-id">
                <span class="ticket-id">{{ formatTicketId(txn.valet_id) }}</span>
              </td>
               <td class="col-key">
                <span v-if="txn.key_slot" class="key-tag">
                   <span class="key-label">KEYSLOT</span>
                   <span class="key-num">{{ formatKeySlot(txn.key_slot) }}</span>
                </span>
                <span v-else class="text-muted text-xs">--</span>
              </td>
              <td class="col-customer">
                <div class="customer-info">
                  <span class="customer-name">{{ txn.customer_name }}</span>
                  <span class="customer-phone">{{ txn.phone_number }}</span>
                </div>
              </td>
              <td class="col-vehicle">
                <div class="vehicle-info">
                  <div class="car-row">
                    <span class="car-model">{{ txn.car_model || 'Unknown Model' }}</span>
                    <span v-if="txn.car_number" class="car-plate-tag">{{ txn.car_number }}</span>
                  </div>
                  <span class="car-category badge badge-outline">{{ txn.car_category || 'N/A' }}</span>
                </div>
              </td>
              <td class="col-status">
                <span :class="['status-badge', getStatusClass(txn.status)]">
                  <span class="status-dot"></span>
                  {{ formatStatus(txn.status) }}
                </span>
                <div v-if="txn.status === 'RETURN_REQUESTED'" class="urgent-indicator">
                  <span class="pulse"></span> Action Required
                </div>
              </td>
              <td class="col-time">
                <div class="time-info">
                  <div class="time-row" v-if="txn.parked_time">
                    <span class="time-label">Parked:</span>
                    <span class="time-value">{{ formatTime(txn.parked_time) }}</span>
                  </div>
                  <div class="time-row highlight" v-if="txn.return_requested_time">
                    <span class="time-label">Requested:</span>
                    <span class="time-value">{{ formatTime(txn.return_requested_time) }}</span>
                  </div>
                </div>
              </td>
              <td class="col-location">
                <div v-if="txn.block_entry_id" class="slot-badge">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                   {{ txn.block_entry_id.split('-').slice(1).join('-') }}
                </div>
                <span v-else class="text-muted text-sm">Not Assigned</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';

const authStore = useAuthStore();
const transactions = ref([]);
const loading = ref(false);
const error = ref(null);
const locationName = ref('');

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const formatTicketId = (id) => {
  if (!id) return '';
  const parts = id.split('-');
  return parts.length > 2 ? parts.slice(1).join('-') : id;
};

const formatKeySlot = (id) => {
    if (!id) return '';
    return id.toString().padStart(3, '0');
};

const formatStatus = (status) => {
  if (!status) return '';
  return status.replace('_', ' ');
};

const getStatusClass = (status) => {
  switch (status) {
    case 'PARKED': return 'status-parked';
    case 'RETURN_REQUESTED': return 'status-requested';
    case 'READY': return 'status-ready';
    case 'RETURNED': return 'status-returned';
    default: return 'status-default';
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

const fetchTransactions = async (showLoading = true) => {
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
    } else {
      error.value = response.data.message || 'Failed to fetch transactions.';
    }
  } catch (err) {
    console.error('Fetch transactions error:', err);
    error.value = err.response?.data?.message || err.message || 'Failed to load transactions.';
  } finally {
    loading.value = false;
  }
};

let pollInterval;
onMounted(() => {
  fetchTransactions();
  pollInterval = setInterval(() => fetchTransactions(false), 5000);
});
onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>
.transactions-page {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.subtitle {
  color: var(--text-muted);
  font-size: 15px;
  margin-top: 4px;
}

.header-actions {
  display: flex;
  gap: 12px;
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

.error-message {
  padding: 12px 16px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  border-radius: 8px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
  font-size: 14px;
}

/* Empty State */
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

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 4px;
}

/* Table */
.table-container {
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}

.transactions-table {
  width: 100%;
  border-collapse: collapse;
}

.transactions-table th {
  text-align: left;
  padding: 16px 24px;
  background: var(--bg-main);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-subtle);
}

.transactions-table td {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}

.transactions-table tr:last-child td {
  border-bottom: none;
}

.transactions-table tr:hover {
  background-color: var(--bg-main);
}

/* Column Styles */
.col-id {
  width: 140px;
}

.ticket-id {
  font-family: 'Outfit', monospace;
  font-weight: 600;
  color: var(--primary);
  font-size: 15px;
  background: var(--primary-light);
  padding: 4px 8px;
  border-radius: 6px;
}

.key-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  padding: 4px 10px;
  border-radius: 8px;
  font-family: 'Outfit', sans-serif;
}

.key-label {
  font-size: 9px;
  font-weight: 800;
  color: #0369a1;
  letter-spacing: 0.05em;
}

.key-num {
  font-size: 15px;
  font-weight: 900;
  color: #0c4a6e;
}

.customer-info {
  display: flex;
  flex-direction: column;
}

.customer-name {
  font-weight: 600;
  color: var(--text-main);
  font-size: 15px;
}

.customer-phone {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 2px;
}

.vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.car-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.car-model {
  font-weight: 500;
  color: var(--text-main);
}

.car-plate-tag {
  background: var(--bg-main);
  border: 1px solid var(--border-subtle);
  color: var(--primary);
  font-family: 'Outfit', monospace;
  font-weight: 700;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
}

.badge-outline {
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  background: transparent;
  font-size: 11px;
  padding: 2px 8px;
}

/* Status Badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-parked {
  background: var(--info-light);
  color: var(--info);
}
.status-parked .status-dot { background: var(--info); }

.status-requested {
  background: var(--warning-light);
  color: var(--warning);
  border: 1px solid var(--warning-border, var(--warning));
}
.status-requested .status-dot { background: var(--warning); }

.status-ready {
  background: var(--success-light);
  color: var(--success);
}
.status-ready .status-dot { background: var(--success); }

.status-returned {
  background: var(--bg-main);
  color: var(--text-muted);
}
.status-returned .status-dot { background: var(--text-muted); }

.urgent-indicator {
  margin-top: 8px;
  font-size: 11px;
  font-weight: 700;
  color: #ea580c;
  display: flex;
  align-items: center;
  gap: 6px;
}

.pulse {
  width: 8px;
  height: 8px;
  background: #ea580c;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(234, 88, 12, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(234, 88, 12, 0); }
  100% { box-shadow: 0 0 0 0 rgba(234, 88, 12, 0); }
}

/* Time Info */
.time-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.time-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  gap: 12px;
}

.time-label {
  color: var(--text-muted);
}

.time-value {
  font-family: 'Outfit', monospace;
  font-weight: 500;
  color: var(--text-main);
}

.time-row.highlight .time-value {
  color: #ea580c;
  font-weight: 700;
}

/* Slot Badge */
.slot-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-main);
  border: 1px solid var(--border-subtle);
  padding: 6px 10px;
  border-radius: 8px;
  font-weight: 600;
  color: var(--text-main);
  font-family: 'Outfit', monospace;
}

.text-sm { font-size: 12px; }

/* Spinning Animation */
.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin { 100% { transform: rotate(360deg); } }

/* Animations */
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.4s ease-out forwards;
  opacity: 0;
  transform: translateY(10px);
}

.txn-row:nth-child(1) { animation-delay: 0.1s; }
.txn-row:nth-child(2) { animation-delay: 0.15s; }
.txn-row:nth-child(3) { animation-delay: 0.2s; }
.txn-row:nth-child(4) { animation-delay: 0.25s; }
.txn-row:nth-child(5) { animation-delay: 0.3s; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 1024px) {
  .col-time, .col-location {
    display: none;
  }
}

@media (max-width: 768px) {
  .transactions-table thead { display: none; }
  .transactions-table, .transactions-table tbody, .transactions-table tr, .transactions-table td {
    display: block;
    width: 100%;
  }
  
  .txn-row {
    margin-bottom: 16px;
    border-bottom: 1px solid var(--border-subtle);
    padding-bottom: 16px;
  }

  .transactions-table td {
    padding: 8px 0;
    text-align: right;
    border-bottom: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .transactions-table td::before {
    content: attr(data-label);
    float: left;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 11px;
    color: var(--text-muted);
  }
}
</style>
