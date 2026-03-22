<template>
  <div class="history-page animate-fade-in">
    <header class="page-header">
      <div>
        <h1 class="page-title">Vehicle Transactions</h1>
        <p class="subtitle" v-if="locationName">
          Transaction history for {{ locationName }}
        </p>
      </div>
      <div class="header-actions">
        <button @click="fetchHistory" class="btn btn-primary" :disabled="loading">
          <svg
            class="refresh-icon"
            :class="{ spinning: loading }"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span v-if="loading">Loading...</span>
          <span v-else>Refresh</span>
        </button>
      </div>
    </header>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- Filters -->
    <div class="filters-container">
      <div class="filter-group">
        <button 
          v-for="f in filters" 
          :key="f.value"
          @click="setFilter(f.value)"
          :class="['filter-btn', { active: currentFilter === f.value }]"
        >
          {{ f.label }}
        </button>
      </div>

      <div class="filter-group">
        <button 
          v-for="s in statusFilters" 
          :key="s.value"
          @click="statusFilter = s.value"
          :class="['filter-btn', { active: statusFilter === s.value }]"
        >
          {{ s.label }}
        </button>
      </div>
      
      <!-- Custom Date Range -->
      <div v-if="currentFilter === 'custom'" class="custom-date-inputs">
        <input type="date" v-model="customStart" class="date-input" />
        <span class="separator">to</span>
        <input type="date" v-model="customEnd" class="date-input" />
        <button @click="fetchHistory" class="btn btn-sm btn-primary">Apply</button>
      </div>
    </div>

    <!-- Data Table -->
    <div class="table-container">
      <div v-if="filteredTransactions.length === 0 && !loading" class="empty-state">
        <div class="empty-icon-container">
          <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3>No Transactions Found</h3>
        <p>No records found for the selected period and status.</p>
      </div>

      <table v-else class="transactions-table">
        <thead>
          <tr>
            <th>Ticket ID</th>
            <th>Customer</th>
            <th>Vehicle</th>
            <th>Status</th>
            <th>Entry Time</th>
            <th>Exit Time</th>
            <th>Slot</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="txn in filteredTransactions"
            :key="txn.valet_id"
            class="txn-row animate-slide-up"
          >
            <td class="col-id">
              <span class="ticket-id">{{ formatTicketId(txn.valet_id) }}</span>
            </td>
            <td>
              <div class="customer-info">
                <span class="name">{{ txn.customer_name }}</span>
                <span class="phone">{{ txn.phone_number }}</span>
              </div>
            </td>
            <td>
              <div class="vehicle-info">
                <span class="model">{{ txn.car_model || 'Unknown' }}</span>
                <span class="category">{{ txn.car_category }}</span>
              </div>
            </td>
            <td>
              <span :class="['status-badge', getStatusClass(txn.status)]">
                {{ formatStatus(txn.status) }}
              </span>
            </td>
            <td class="col-time">{{ formatTime(txn.created_at) }}</td>
            <td class="col-time">
              <span v-if="txn.returned_time">{{ formatTime(txn.returned_time) }}</span>
              <span v-else class="text-muted">-</span>
            </td>
            <td>
              <span v-if="txn.block_entry_id" class="slot-badge">
                 {{ txn.block_entry_id.split('-').slice(1).join('-') }}
              </span>
              <span v-else class="text-muted text-sm">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';

const authStore = useAuthStore();
const transactions = ref([]);
const loading = ref(false);
const error = ref(null);
const locationName = ref('');

const currentFilter = ref('today');
const statusFilter = ref('ALL');
const customStart = ref('');
const customEnd = ref('');

const filters = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last Week', value: 'week' },
  { label: 'Last Month', value: 'month' },
  { label: 'Custom', value: 'custom' }
];

const statusFilters = [
  { label: 'All', value: 'ALL' },
  { label: 'Parked', value: 'PARKED' },
  { label: 'Returning', value: 'RETURNING' },
  { label: 'Returned', value: 'RETURNED' }
];

const filteredTransactions = computed(() => {
  if (statusFilter.value === 'ALL') return transactions.value;
  
  return transactions.value.filter(txn => {
    if (statusFilter.value === 'PARKED') return txn.status === 'PARKED';
    if (statusFilter.value === 'RETURNING') return ['RETURN_REQUESTED', 'ON_THE_WAY', 'READY'].includes(txn.status);
    if (statusFilter.value === 'RETURNED') return txn.status === 'RETURNED';
    return true;
  });
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const formatTicketId = (id) => {
  if (!id) return '';
  const parts = id.split('-');
  return parts.length > 2 ? parts.slice(1).join('-') : id;
};

const formatStatus = (status) => status ? status.replace(/_/g, ' ') : '';

const getStatusClass = (status) => {
  switch (status) {
    case 'PARKED': return 'badge-info';
    case 'RETURN_REQUESTED': return 'badge-warning';
    case 'ON_THE_WAY': return 'badge-orange';
    case 'READY': return 'badge-success-light';
    case 'RETURNED': return 'badge-gray';
    case 'CANCELLED': return 'badge-danger';
    default: return 'badge-default';
  }
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);
};

const setFilter = (filter) => {
  currentFilter.value = filter;
  if (filter !== 'custom') {
    fetchHistory();
  }
};

const fetchHistory = async () => {
  loading.value = true;
  error.value = null;

  try {
    if (!authStore.accessibleLocations || authStore.accessibleLocations.length === 0) {
      error.value = 'No accessible location found.';
      loading.value = false;
      return;
    }

    const locationId = authStore.accessibleLocations[0].location_id;
    locationName.value = authStore.accessibleLocations[0].location_name;

    const params = {
      location_id: locationId,
      filter: currentFilter.value
    };

    if (currentFilter.value === 'custom') {
      if (!customStart.value || !customEnd.value) {
        // Don't fetch if dates are missing for custom
        loading.value = false;
        return;
      }
      params.startDate = customStart.value;
      params.endDate = customEnd.value;
    }

    const response = await axios.get(`${API_URL}/valet/history`, {
      params,
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    });

    if (response.data.success) {
      transactions.value = response.data.data;
    } else {
      error.value = response.data.message;
    }
  } catch (err) {
    console.error('Fetch history error:', err);
    error.value = 'Failed to load transaction history.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchHistory();
});
</script>

<style scoped>
.history-page {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.subtitle {
  color: var(--text-muted);
  font-size: 15px;
  margin-top: 4px;
}

/* Filters */
.filters-container {
  margin-bottom: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.filter-group {
  display: flex;
  background: var(--bg-card);
  padding: 4px;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}

.filter-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: var(--bg-main);
  color: var(--text-main);
}

.filter-btn.active {
  background: var(--primary);
  color: white;
  font-weight: 600;
}

.custom-date-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-card);
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
}

.date-input {
  border: 1px solid var(--border-subtle);
  padding: 6px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-main);
}

.separator { font-size: 13px; color: var(--text-muted); }

/* Table */
.table-container {
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  overflow-x: auto; 
}

.transactions-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px; /* Ensure table doesn't squish too much */
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
  white-space: nowrap;
}

.transactions-table td {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}

.transactions-table tr:hover { background-color: var(--bg-main); }

.ticket-id {
  font-family: 'Outfit', monospace;
  font-weight: 600;
  color: var(--primary);
  background: var(--primary-light);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
}

.customer-info, .vehicle-info {
  display: flex;
  flex-direction: column;
}

.name, .model { font-weight: 600; color: var(--text-main); font-size: 14px; }
.phone, .category { font-size: 12px; color: var(--text-muted); }

.status-badge {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 4px;
}

.badge-info { background: var(--info-light); color: var(--info); }
.badge-orange { background: var(--warning-light); color: var(--warning); }
.badge-warning { background: var(--warning-light-alt, var(--warning-light)); color: var(--warning-alt, var(--warning)); }
.badge-success-light { background: var(--success-light); color: var(--success); }
.badge-gray { background: var(--bg-main); color: var(--text-muted); }
.badge-danger { background: var(--danger-light); color: var(--danger); }
.badge-default { background: var(--bg-main); color: var(--text-muted); }

.col-time {
  font-family: 'Outfit', monospace;
  font-size: 13px;
  color: var(--text-main);
  white-space: nowrap;
}

.slot-badge {
  background: var(--bg-main);
  border: 1px solid var(--border-subtle);
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;
  font-family: 'Outfit', monospace;
  white-space: nowrap;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: var(--text-muted);
}
.empty-icon-container {
  width: 64px; height: 64px; background: var(--bg-main);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  margin-bottom: 16px;
}
.empty-icon { width: 28px; height: 28px; opacity: 0.6; }

.animate-fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
