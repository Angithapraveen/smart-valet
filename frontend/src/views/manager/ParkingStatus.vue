<template>
  <div class="parking-status animate-fade-in">
    <header class="page-header">
      <div>
        <h1 class="page-title">Parking Status</h1>
        <p class="subtitle" v-if="locationName">{{ locationName }}</p>
      </div>
      <div class="header-actions">
        <button @click="fetchData" class="btn btn-outline" :disabled="loading">
          <svg class="refresh-icon" :class="{ 'spinning': loading }" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Status
        </button>
      </div>
    </header>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="loading && !blocks.length" class="loading-state">
      <div class="spinner"></div>
      <span>Loading parking status...</span>
    </div>

    <div v-else-if="!blocks.length" class="empty-state">
      <div class="empty-icon-container">
        <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3>No blocks found</h3>
      <p>There are no parking blocks configured for this location.</p>
    </div>

    <div v-else class="blocks-grid">
      <div v-for="block in blocks" :key="block.block_id" class="block-card">
        <div class="block-header">
          <div class="block-info">
            <h3>{{ block.block_name }}</h3>
            <span class="block-stats">
              <span class="badge badge-info">{{ getOccupiedCount(block) }} / {{ block.capacity }}</span>
              Occupied Slots
            </span>
          </div>
          <div class="occupancy-info">
            <div class="progress-bar-container">
              <div 
                class="progress-bar" 
                :style="{ width: getOccupancyPercentage(block) + '%' }"
                :class="getOccupancyClass(block)"
              ></div>
            </div>
          </div>
        </div>

        <div class="entries-grid">
          <div 
            v-for="entry in block.entries || []" 
            :key="entry.block_entry_id" 
            class="entry-slot"
            :class="entry.status ? entry.status.toLowerCase() : 'unknown'"
          >
            <div class="slot-number">{{ entry.block_entry_id ? entry.block_entry_id.split('-').pop() : '?' }}</div>
            <div class="slot-status">{{ entry.status || 'UNKNOWN' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios';

const authStore = useAuthStore();
const blocks = ref([]);
const loading = ref(false);
const error = ref(null);
const locationName = ref('');

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getOccupiedCount = (block) => {
  if (!block || !block.entries) return 0;
  return block.entries.filter(e => e.status === 'OCCUPIED').length;
};

const getOccupancyPercentage = (block) => {
  if (!block || !block.capacity) return 0;
  return Math.round((getOccupiedCount(block) / block.capacity) * 100);
};

const getOccupancyClass = (block) => {
  const percentage = getOccupancyPercentage(block);
  if (percentage >= 90) return 'critical';
  if (percentage >= 70) return 'warning';
  return 'normal';
};

const fetchData = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Get location ID from the first accessible location for manager
    if (!authStore.accessibleLocations || authStore.accessibleLocations.length === 0) {
      error.value = 'No accessible location found.';
      loading.value = false;
      return;
    }

    const locationId = authStore.accessibleLocations[0].location_id;
    locationName.value = authStore.accessibleLocations[0].location_name;

    const response = await axios.get(`${API_URL}/owner/locations/${locationId}/blocks`, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    });

    if (response.data.success) {
      blocks.value = response.data.data;
    } else {
      error.value = response.data.message || 'Failed to fetch parking status.';
    }
  } catch (err) {
    console.error('Fetch parking status error:', err);
    // Be more descriptive about the failure
    error.value = err.response?.data?.message || err.message || 'Failed to load parking status. Please try again later.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.parking-status {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.subtitle {
  color: var(--text-muted);
  font-size: 16px;
  margin-top: 4px;
}

.blocks-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.block-card {
  background: var(--bg-card);
  border-radius: 24px;
  padding: 32px;
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
  transition: var(--ts-base);
}

.block-card:hover {
  border-color: var(--primary-border);
  box-shadow: var(--shadow-md);
}

.block-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-subtle);
}

.block-info h3 {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: var(--text-main);
}

.block-stats {
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.occupancy-info {
  width: 240px;
}

.progress-bar-container {
  height: 10px;
  background: var(--bg-main);
  border-radius: 5px;
  overflow: hidden;
  border: 4px solid var(--bg-main);
}

.progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s var(--ease-out);
}

.progress-bar.normal { background: var(--success); }
.progress-bar.warning { background: var(--warning); }
.progress-bar.critical { background: var(--danger); }

.entries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 16px;
}

.entry-slot {
  aspect-ratio: 1.1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  padding: 12px;
  transition: var(--ts-base);
  position: relative;
  overflow: hidden;
}

.entry-slot:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.entry-slot.available {
  background: var(--success-light);
  border: 1px solid var(--success-border);
  color: var(--success);
}

.entry-slot.occupied {
  background: var(--danger-light);
  border: 1px solid var(--danger-border);
  color: var(--danger);
}

.slot-number {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 4px;
  font-family: 'Outfit', sans-serif;
}

.slot-status {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: var(--text-muted);
}

.spinner {
  width: 44px;
  height: 44px;
  border: 3px solid var(--border-subtle);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin { to { transform: rotate(360deg); } }

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
  color: var(--text-muted);
}

.error-message {
  padding: 12px 20px;
  background: var(--danger-light);
  border: 1px solid var(--danger);
  color: var(--danger);
  border-radius: 12px;
  margin-bottom: 24px;
  font-weight: 600;
}
</style>
