<template>
  <div class="animate-fade-in" :class="[showHeader ? 'reports-page' : 'reports-tab-content']">
    <header class="page-header" v-if="showHeader">
      <div>
        <h1 class="page-title">Analytics & Reports</h1>
        <p class="subtitle" v-if="locationName">
          Performance metrics for {{ locationName }}
        </p>
      </div>
      <div class="header-actions">
        <div class="live-indicator">
          <span class="dot animate-pulse"></span>
          Live Updates
        </div>
      </div>
    </header>

    <div v-if="error" class="error-message">{{ error }}</div>

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
      
      <div v-if="currentFilter === 'custom'" class="custom-date-inputs">
        <input type="date" v-model="customStart" class="date-input" />
        <span class="separator">to</span>
        <input type="date" v-model="customEnd" class="date-input" />
        <button @click="fetchData(true)" class="btn btn-sm btn-primary">Apply</button>
      </div>
      
      <!-- Live Indicator for Tab Layout -->
      <div v-if="!showHeader" class="live-indicator ml-auto">
        <span class="dot animate-pulse"></span>
        Live Data
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-title">Total Parked</span>
          <div class="icon-wrapper bg-blue">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
          </div>
        </div>
        <div class="metric-value">{{ metrics.totalParked }}</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-title">Total Returned</span>
          <div class="icon-wrapper bg-green">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          </div>
        </div>
        <div class="metric-value">{{ metrics.totalReturned }}</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-title">Currently Active</span>
          <div class="icon-wrapper bg-orange">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
        </div>
        <div class="metric-value">{{ metrics.activeInSystem }}</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-title">Avg. Wait Time</span>
          <div class="icon-wrapper bg-purple">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
        </div>
        <div class="metric-value">{{ metrics.avgWaitTimeMinutes }} <span class="text-xs text-muted">min</span></div>
      </div>
    </div>

    <!-- Visuals -->
    <div class="charts-container">
      <div class="chart-card">
        <h3>Peak Hours (Arrivals)</h3>
        <div class="bar-chart" v-if="Object.keys(peakHours).length">
          <div class="bar-wrapper" v-for="(count, hour) in peakHours" :key="hour">
            <div class="bar-value">{{ count }}</div>
            <div class="bar" :style="{ height: getBarHeight(count, peakHours) + '%' }"></div>
            <div class="bar-label">{{ hour }}</div>
          </div>
        </div>
        <div v-else class="empty-state-sm">No arrivals found.</div>
      </div>
      
      <div class="chart-card">
        <h3>Vehicle Categories</h3>
        <div class="stats-list" v-if="metrics.totalParked > 0">
          <div class="stat-item" v-for="(count, cat) in metrics.categories" :key="cat">
            <div class="stat-label">
              <span class="dot" :class="'cat-' + (cat || 'Unknown').toLowerCase()"></span>
              {{ cat || 'Uncategorized' }}
            </div>
            <div class="stat-value">{{ count }}</div>
          </div>
        </div>
        <div v-else class="empty-state-sm">No data available.</div>
      </div>
    </div>

    <!-- Driver Performance Table -->
    <div class="table-container mt-8" v-if="driverAnalytics.length > 0">
      <h3 class="section-title">Driver Performance</h3>
      <table class="driver-table">
        <thead>
          <tr>
            <th>Driver Name</th>
            <th style="width: 200px">Cars Returned</th>
            <th style="width: 200px">Avg. Turnaround Time</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="driver in driverAnalytics" :key="driver.id">
            <td class="driver-name-cell">
              <div class="avatar-sm">{{ driver.name.charAt(0).toUpperCase() }}</div>
              <span>{{ driver.name }}</span>
            </td>
            <td><span class="highlight-val">{{ driver.totalReturned }}</span></td>
            <td>
              <span class="highlight-val">{{ driver.avgWaitMins }}</span> min
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';

const props = defineProps({
  locationId: {
    type: [String, Number],
    required: true
  },
  locationName: {
    type: String,
    default: ''
  },
  showHeader: {
    type: Boolean,
    default: false
  }
});

const authStore = useAuthStore();
const transactions = ref([]);
const loading = ref(false);
const error = ref(null);

const currentFilter = ref('today');
const customStart = ref('');
const customEnd = ref('');

const filters = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Year to Date', value: 'year' },
  { label: 'Custom', value: 'custom' }
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const peakHours = computed(() => {
  const hours = {};
  transactions.value.forEach(t => {
    if (!t.created_at) return;
    const date = new Date(t.created_at);
    let h = date.getHours();
    let label = `${h.toString().padStart(2, '0')}:00`;
    hours[label] = (hours[label] || 0) + 1;
  });
  return Object.keys(hours)
    .sort()
    .reduce((acc, key) => { acc[key] = hours[key]; return acc; }, {});
});

const getBarHeight = (count, hoursObj) => {
  const max = Math.max(...Object.values(hoursObj), 1);
  return (count / max) * 100;
};

const metrics = computed(() => {
  const list = transactions.value;
  const returnedList = list.filter(t => t.status === 'RETURNED');
  
  let totalWaitMs = 0;
  let validWaits = 0;
  returnedList.forEach(t => {
    if (t.return_requested_time && t.returned_time) {
      const wait = new Date(t.returned_time) - new Date(t.return_requested_time);
      if (wait > 0) {
        totalWaitMs += wait;
        validWaits++;
      }
    }
  });
  const avgWaitTimeMinutes = validWaits > 0 ? Math.round((totalWaitMs / validWaits) / 60000) : 0;

  const categories = {};
  list.forEach(t => {
    const cat = t.car_category || 'Unknown';
    categories[cat] = (categories[cat] || 0) + 1;
  });

  return {
    totalParked: list.length,
    totalReturned: returnedList.length,
    activeInSystem: list.filter(t => ['PARKED', 'RETURN_REQUESTED', 'ON_THE_WAY', 'READY'].includes(t.status)).length,
    avgWaitTimeMinutes,
    categories
  };
});

const driverAnalytics = computed(() => {
  const drivers = {};
  transactions.value.forEach(t => {
    if (t.returned_driver_id) {
      const dId = t.returned_driver_id;
      if (!drivers[dId]) {
        drivers[dId] = {
          id: dId,
          name: t.returned_driver_name || 'Unknown Driver',
          totalReturned: 0,
          totalWaitMs: 0,
          validWaits: 0
        };
      }
      
      if (t.status === 'RETURNED') {
        drivers[dId].totalReturned++;
        if (t.return_requested_time && t.returned_time) {
          const wait = new Date(t.returned_time) - new Date(t.return_requested_time);
          if (wait > 0) {
            drivers[dId].totalWaitMs += wait;
            drivers[dId].validWaits++;
          }
        }
      }
    }
  });
  
  return Object.values(drivers).map(d => ({
    ...d,
    avgWaitMins: d.validWaits > 0 ? Math.round((d.totalWaitMs / d.validWaits) / 60000) : 0
  })).sort((a, b) => b.totalReturned - a.totalReturned);
});

const setFilter = (filter) => {
  currentFilter.value = filter;
  if (filter !== 'custom') {
    fetchData();
  }
};

const fetchData = async (showLoading = true) => {
  if (!props.locationId) return;
  if (showLoading && transactions.value.length === 0) loading.value = true;
  error.value = null;

  try {
    const params = { location_id: props.locationId, filter: currentFilter.value };
    if (currentFilter.value === 'custom') {
      if (!customStart.value || !customEnd.value) {
        loading.value = false;
        return;
      }
      params.startDate = customStart.value;
      params.endDate = customEnd.value;
    }

    const response = await axios.get(`${API_URL}/valet/history`, {
      params,
      headers: { Authorization: `Bearer ${authStore.token}` }
    });

    if (response.data.success) {
      transactions.value = response.data.data;
    } else {
      error.value = response.data.message;
    }
  } catch (err) {
    console.error('Fetch error:', err);
    error.value = 'Failed to load report data.';
  } finally {
    loading.value = false;
  }
};

watch(() => props.locationId, () => {
  fetchData();
});

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
.reports-page {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.reports-tab-content {
  padding: 16px 0;
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

.ml-auto {
  margin-left: auto;
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
  background: var(--bg-main);
}

/* Cards */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.metric-card {
  background: var(--bg-card);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.metric-title {
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 600;
}

.icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-wrapper svg {
  width: 20px;
  height: 20px;
  color: white;
}

.bg-blue { background: var(--info); }
.bg-green { background: var(--success); }
.bg-orange { background: var(--warning); }
.bg-purple { background: #8b5cf6; }

.metric-value {
  font-size: 32px;
  font-weight: 800;
  font-family: 'Outfit', sans-serif;
  color: var(--text-main);
}

/* Visuals */
.charts-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.chart-card {
  background: var(--bg-card);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid var(--border-subtle);
  min-height: 250px;
}

.chart-card h3 {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 24px;
  color: var(--text-main);
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  height: 200px;
  gap: 12px;
  padding-bottom: 30px;
  position: relative;
  overflow-x: auto;
}

.bar-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
  flex: 1;
  min-width: 40px;
  position: relative;
}

.bar {
  width: 100%;
  max-width: 40px;
  background: var(--primary);
  border-radius: 6px 6px 0 0;
  transition: height 0.5s var(--ease-out);
}

.bar-value {
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-main);
}

.bar-label {
  position: absolute;
  bottom: -24px;
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
}

/* Stat List */
.stats-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--bg-main);
  border-radius: 12px;
}

.stat-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}

.stat-value {
  font-weight: 800;
  font-size: 16px;
  font-family: 'Outfit', sans-serif;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.cat-high { background: var(--danger); }
.cat-medium { background: var(--warning); }
.cat-low { background: var(--info); }
.cat-unknown { background: var(--text-muted); }

/* Driver Table */
.mt-8 { margin-top: 32px; }
.section-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--text-main); }
.driver-table { width: 100%; border-collapse: collapse; background: var(--bg-card); border-radius: 12px; overflow: hidden; border: 1px solid var(--border-subtle); display: table; }
.driver-table th { text-align: left; padding: 16px 24px; background: var(--bg-main); color: var(--text-muted); font-size: 12px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid var(--border-subtle); }
.driver-table td { padding: 16px 24px; border-bottom: 1px solid var(--border-subtle); vertical-align: middle; color: var(--text-main); }
.driver-table tr:hover { background-color: var(--bg-main); }
.driver-table tr:last-child td { border-bottom: none; }
.driver-name-cell { display: flex; align-items: center; gap: 12px; font-weight: 600; color: var(--text-main); }
.avatar-sm { width: 32px; height: 32px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
.highlight-val { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 15px; }

.empty-state-sm {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;
  color: var(--text-muted);
  font-style: italic;
}
</style>
