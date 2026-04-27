<template>
  <div class="dashboard-page animate-fade-in">
    <!-- Unifying Header and Container in a single Responsive Wrapper -->
    <div class="dashboard-wrapper">
      <div class="dashboard-header">
        <div class="header-main-info">
          <h1>My Subscription</h1>
          <div v-if="locations.length > 1" class="header-filters ml-4">
            <div class="filter-box">
              <select 
                v-model="selectedLocationId" 
                @change="fetchPlanDetails"
                class="filter-select"
              >
                <option v-for="loc in locations" :key="loc.location_id" :value="loc.location_id">
                  {{ loc.location_name }}
                </option>
              </select>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline-small" @click="fetchPlanDetails">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            Refresh Analytics
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-32 space-y-4">
        <div class="spinner-sm-large"></div>
        <p class="text-muted font-bold uppercase tracking-widest text-[10px]">Syncing Analytics...</p>
      </div>

      <template v-else>
        <!-- Balanced Content Layout -->
        <div v-if="currentPlan" class="content-grid">
          <!-- Card 1: Subscription Overview -->
          <div class="card-section">
            <div class="section-header">
              <div class="header-indicator primary"></div>
              <h2>Subscription Architecture</h2>
            </div>
            <div class="card-body">
              <div class="plan-hero-compact">
                <div class="plan-info">
                  <p class="label-tiny">Service Tier</p>
                  <h3 class="plan-title-main">{{ currentPlan.plan_name }}</h3>
                </div>
                <div class="plan-status-row">
                  <div class="status-chip-compact" :class="currentPlan.status.toLowerCase()">
                    <span class="dot"></span>
                    {{ currentPlan.status }}
                  </div>
                  <div class="validity-text">
                    Valid till {{ formatDate(currentPlan.end_date) }}
                  </div>
                </div>
              </div>

              <!-- 3-Column Metrics Grid -->
              <div class="metrics-grid-compact">
                <div class="metric-item">
                  <span class="metric-label-small">Total Capacity</span>
                  <div class="metric-value-group">
                    <span class="metric-val">{{ formatNumber(currentPlan.plan_limit) }}</span>
                    <span class="metric-unit-small">TXN</span>
                  </div>
                </div>
                <div class="metric-item">
                  <span class="metric-label-small">Consumption</span>
                  <div class="metric-value-group">
                    <span class="metric-val warning">{{ formatNumber(currentPlan.used_transactions) }}</span>
                    <span class="metric-unit-small">TXN</span>
                  </div>
                </div>
                <div class="metric-item">
                  <span class="metric-label-small">Availability</span>
                  <div class="metric-value-group">
                    <span class="metric-val success">{{ formatNumber(currentPlan.calculated_remaining) }}</span>
                    <span class="metric-unit-small">TXN</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Card 2: Usage Intelligence -->
          <div class="card-section">
            <div class="section-header">
              <div class="header-indicator success"></div>
              <h2>Usage Intelligence</h2>
            </div>
            <div class="card-body">
              <div class="usage-header-row">
                <div class="usage-titles">
                  <span class="usage-label-main">Resource Allocation Status</span>
                  <p class="usage-description-small">Current deployment utilization across site architecture.</p>
                </div>
                <div class="usage-percent-badge">
                  {{ usagePercentage }}%
                </div>
              </div>
              
              <div class="progress-bar-thin-wrapper">
                <div class="progress-bar-thin-fill" :style="{ width: usagePercentage + '%' }"></div>
              </div>

              <div class="usage-meta-grid">
                <div class="usage-meta-item">
                  <span class="meta-label">Deployment Site</span>
                  <span class="meta-value">{{ currentPlan.location_name }}</span>
                </div>
                <div class="usage-meta-item">
                  <span class="meta-label">Payment Status</span>
                  <span class="meta-value text-success">Verified</span>
                </div>
                <div class="usage-meta-item full-width">
                  <span class="meta-label">Protocol Note</span>
                  <p class="meta-note">Transactions restricted automatically upon breach or expiration.</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Card 3: Deployment Ledger -->
          <div v-if="history.length > 0" class="card-section">
            <div class="section-header">
              <div class="header-indicator info"></div>
              <h2>Deployment Ledger</h2>
            </div>
            <div class="table-container-compact">
              <table class="ledger-table">
                <thead>
                  <tr>
                    <th class="text-left">Service Tier</th>
                    <th class="text-center">Activation</th>
                    <th class="text-center">Termination</th>
                    <th class="text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in history" :key="item.subscription_id">
                    <td class="text-left font-bold">{{ item.plan_name }}</td>
                    <td class="text-center text-muted">{{ formatDate(item.start_date) }}</td>
                    <td class="text-center text-muted">{{ formatDate(item.end_date) }}</td>
                    <td class="text-right">
                      <span class="ledger-status" :class="item.status.toLowerCase()">
                        {{ item.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- No Plan State -->
        <div v-else class="empty-deployment-state">
          <div class="empty-card">
            <div class="empty-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <h3 class="empty-title">Deployment Pending</h3>
            <p class="empty-text">
              No active service tier has been assigned to this location yet. Please coordinate with Administration for deployment.
            </p>
            <button class="request-btn">
              Request Activation
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { SubscriptionService } from '../services/SubscriptionService';

const authStore = useAuthStore();
const currentPlan = ref(null);
const history = ref([]);
const loading = ref(true);

const locations = computed(() => authStore.userLocations);
const selectedLocationId = ref(authStore.selectedLocationId);

const fetchPlanDetails = async () => {
  if (!selectedLocationId.value) {
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    const [planRes, historyRes] = await Promise.all([
      SubscriptionService.getMyPlan(selectedLocationId.value),
      SubscriptionService.getMySubscriptions(selectedLocationId.value)
    ]);
    
    currentPlan.value = planRes.data;
    history.value = historyRes.data;
  } catch (error) {
    console.error('Fetch Error:', error);
  } finally {
    loading.value = false;
  }
};

const usagePercentage = computed(() => {
  if (!currentPlan.value || !currentPlan.value.plan_limit) return 0;
  return Math.min(100, Math.round((currentPlan.value.used_transactions / currentPlan.value.plan_limit) * 100));
});

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

onMounted(fetchPlanDetails);
</script>

<style scoped>
.dashboard-wrapper {
  width: 100%;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
}

.dashboard-header h1 {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
  margin: 0;
}

.header-main-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-outline-small {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: var(--text-main);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
}

.content-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Card Section Styles */
.card-section {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.02);
}

.header-indicator {
  width: 3px;
  height: 16px;
  border-radius: 100px;
}
.header-indicator.primary { background: var(--primary); }
.header-indicator.success { background: var(--success); }
.header-indicator.info { background: var(--info); }

.section-header h2 {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.card-body {
  padding: 20px;
}

/* Subscription Overview Styles */
.plan-hero-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.label-tiny {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.plan-title-main {
  font-size: 22px;
  font-weight: 800;
  margin: 0;
}

.plan-status-row {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.status-chip-compact {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: var(--bg-main);
  border: 1px solid var(--border-subtle);
  border-radius: 100px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}
.status-chip-compact.active { color: var(--success); border-color: rgba(34, 197, 94, 0.2); }
.status-chip-compact.active .dot { background: var(--success); }

.status-chip-compact .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.validity-text {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
}

/* Metrics Grid */
.metrics-grid-compact {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.metric-label-small {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.metric-value-group {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.metric-val {
  font-size: 20px;
  font-weight: 800;
  font-family: 'Outfit', sans-serif;
}
.metric-val.warning { color: var(--warning); }
.metric-val.success { color: var(--success); }

.metric-unit-small {
  font-size: 10px;
  font-weight: 800;
  color: var(--text-muted);
}

/* Usage Intelligence Styles */
.usage-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.usage-label-main {
  font-size: 15px;
  font-weight: 700;
  display: block;
}

.usage-description-small {
  font-size: 12px;
  color: var(--text-muted);
  margin: 4px 0 0 0;
}

.usage-percent-badge {
  font-size: 18px;
  font-weight: 800;
  color: var(--primary);
}

.progress-bar-thin-wrapper {
  width: 100%;
  height: 6px;
  background: var(--bg-main);
  border-radius: 100px;
  margin-bottom: 24px;
  overflow: hidden;
}

.progress-bar-thin-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 100px;
  transition: width 1s ease-out;
}

.usage-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid var(--border-subtle);
}

.usage-meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.usage-meta-item.full-width { grid-column: 1 / -1; }

.meta-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
}

.meta-value {
  font-size: 13px;
  font-weight: 700;
}

.meta-note {
  font-size: 11px;
  color: var(--text-muted);
  margin: 0;
  font-weight: 500;
}

/* Ledger Table Styles */
.table-container-compact {
  padding: 0;
}

.ledger-table {
  width: 100%;
  border-collapse: collapse;
}

.ledger-table th {
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.01);
  font-size: 11px;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
  border-bottom: 1px solid var(--border-subtle);
}

.ledger-table td {
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 13px;
}

.ledger-table tr:hover td {
  background: rgba(var(--primary-rgb), 0.02);
}

.ledger-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}
.ledger-status.active { background: var(--success-light); color: var(--success); }
.ledger-status.expired { background: var(--danger-light); color: var(--danger); }

/* No Plan State */
.empty-deployment-state {
  max-width: 600px;
  margin: 48px auto;
}

.empty-card {
  background: rgba(var(--primary-rgb), 0.02);
  border: 2px dashed var(--border-subtle);
  border-radius: 32px;
  padding: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empty-icon-box {
  width: 80px;
  height: 80px;
  background: var(--primary-light);
  color: var(--primary);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.empty-title {
  font-size: 28px;
  font-weight: 900;
  color: var(--text-main);
  margin-bottom: 12px;
  letter-spacing: -0.02em;
}

.empty-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  line-height: 1.6;
  max-width: 320px;
  margin-bottom: 32px;
}

.request-btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 16px 48px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(var(--primary-rgb), 0.3);
  transition: all 0.2s;
}

.request-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px rgba(var(--primary-rgb), 0.4);
}

.spinner-sm-large {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-subtle);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.font-bold { font-weight: 700; }
.text-muted { color: var(--text-muted); }
.text-success { color: var(--success); }

@media (max-width: 768px) {
  .metrics-grid-compact { grid-template-columns: 1fr; }
  .usage-meta-grid { grid-template-columns: 1fr; }
  .ledger-table th:nth-child(2), .ledger-table td:nth-child(2) { display: none; }
}
</style>
