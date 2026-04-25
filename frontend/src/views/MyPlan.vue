<template>
  <div class="dashboard-page animate-fade-in">
    <div class="dashboard-header">
      <div class="header-main-info">
        <h1>My Subscription</h1>
        <div v-if="locations.length > 1" class="header-filters">
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
        <button class="btn btn-outline" @click="fetchPlanDetails">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          Refresh Analytics
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards" v-if="currentPlan">
      <div class="summary-card locations-card">
        <div class="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
        </div>
        <div class="card-content">
          <div class="card-label">Active Tier</div>
          <div class="card-value">{{ currentPlan.plan_name }}</div>
        </div>
      </div>

      <div class="summary-card managers-card">
        <div class="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
        </div>
        <div class="card-content">
          <div class="card-label">Used Capacity</div>
          <div class="card-value">{{ currentPlan.used_transactions }} <small class="text-xs text-muted font-normal">txn</small></div>
        </div>
      </div>

      <div class="summary-card owners-card">
        <div class="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </div>
        <div class="card-content">
          <div class="card-label">Validity End</div>
          <div class="card-value">{{ formatShortDate(currentPlan.end_date) }}</div>
        </div>
      </div>

      <div class="summary-card drivers-card">
        <div class="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <div class="card-content">
          <div class="card-label">Tier Status</div>
          <div class="card-value text-success">{{ currentPlan.status }}</div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-32 space-y-4">
      <div class="spinner-sm-large"></div>
      <p class="text-muted font-bold uppercase tracking-widest text-xs">Syncing Analytics...</p>
    </div>

    <template v-else>
      <div class="space-y-8" v-if="currentPlan">
        <!-- Main Content Area (Matches Home Page Structure) -->
        <div class="locations-section">
          <div class="section-header">
            <div class="header-main-info">
              <h2>Architecture Performance</h2>
            </div>
          </div>
          <div class="p-8">
            <div class="max-w-4xl mx-auto transform transition-all duration-500 hover:translate-y-[-4px]">
              <PlanCard :plan="currentPlan" />
            </div>
          </div>
        </div>
        
        <!-- Deployment History -->
        <div v-if="history.length > 0" class="locations-section">
          <div class="section-header">
            <div class="header-main-info">
              <h2>Deployment Ledger</h2>
            </div>
          </div>
          <div class="table-container border-none rounded-none">
            <table class="table">
              <thead>
                <tr>
                  <th>Service Tier</th>
                  <th>Activation</th>
                  <th>Termination</th>
                  <th class="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in history" :key="item.subscription_id">
                  <td class="font-bold">{{ item.plan_name }}</td>
                  <td class="text-muted">{{ formatDate(item.start_date) }}</td>
                  <td class="text-muted">{{ formatDate(item.end_date) }}</td>
                  <td class="text-center">
                    <span 
                      class="badge uppercase text-[10px]"
                      :class="item.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'"
                    >
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
      <div v-else class="max-w-xl mx-auto mt-20">
        <div class="card p-12 text-center flex flex-col items-center">
          <div class="w-24 h-24 bg-primary-light rounded-3xl flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 class="text-2xl font-bold mb-4">Deployment Pending</h3>
          <p class="text-muted font-medium mb-8">No active service tier has been assigned to this location yet. Please coordinate with Administration for deployment.</p>
          <button class="btn btn-primary px-10 py-4 shadow-lg shadow-primary-shadow">
            Request Activation
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { SubscriptionService } from '../services/SubscriptionService';
import PlanCard from '../components/subscriptions/PlanCard.vue';

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

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const formatShortDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short'
  });
};

onMounted(fetchPlanDetails);
</script>

<style scoped>
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

.bg-main {
  background-color: var(--bg-main);
}

.border-subtle {
  border-color: var(--border-subtle);
}

/* Ensure locations-section has proper padding/margin matching Home */
.locations-section {
  background: var(--bg-card);
  border-radius: 24px;
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  margin-bottom: 24px;
}

/* Summary Cards (from Home Page) */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.summary-card {
  padding: 16px 20px;
  border-radius: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-sm);
  transition: var(--ts-base);
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary);
  background: linear-gradient(to bottom right, var(--bg-card), var(--bg-main));
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.locations-card .card-icon { background: var(--primary-light); color: var(--primary); }
.owners-card .card-icon { background: var(--success-light); color: var(--success); }
.managers-card .card-icon { background: var(--warning-light); color: var(--warning); }
.drivers-card .card-icon { background: var(--info-light); color: var(--info); }

.card-content { flex: 1; }
.card-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 2px; }
.card-value { font-size: 24px; font-weight: 800; color: var(--text-main); line-height: 1; font-family: 'Outfit', sans-serif; }
</style>
