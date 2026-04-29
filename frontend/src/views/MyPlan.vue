<template>
  <div class="dashboard-page animate-fade-in">
    <!-- Unifying Header and Container in a single Responsive Wrapper -->
    <div class="dashboard-wrapper">
      <div class="dashboard-header" style="margin-bottom: 20px;">
        <div class="header-main-info" style="gap: 16px;">
          <h1 style="font-size: 24px; font-weight: 800; color: var(--text-main); margin: 0; letter-spacing: -0.03em;">My Subscription</h1>
          
          <!-- Refined Site Switcher -->
          <div v-if="locations.length > 1" class="site-switcher-inline" style="height: 34px;" v-click-outside="() => showLocationDropdown = false">
            <div class="switcher-trigger-inline" style="padding: 0 12px; height: 100%; border-radius: 8px;" @click="showLocationDropdown = !showLocationDropdown" :class="{ 'active': showLocationDropdown }">
              <div class="trigger-meta">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="loc-icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span class="current-site-name" style="font-size: 12px;">{{ selectedLocationName }}</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="chevron-icon" :class="{ 'rotated': showLocationDropdown }"><path d="m6 9 6 6 6-6"/></svg>
            </div>

            <transition name="pop-in">
              <div v-if="showLocationDropdown" class="switcher-dropdown-menu">
                <div class="menu-search-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                  <input type="text" placeholder="Search sites..." @click.stop v-model="siteFilter" />
                </div>
                <div class="menu-items-list">
                  <div 
                    v-for="loc in filteredLocations" 
                    :key="loc.location_id" 
                    class="site-item"
                    :class="{ 'active': loc.location_id === selectedLocationId }"
                    @click="selectLocation(loc)"
                  >
                    <div class="site-item-info">
                      <span class="site-item-name">{{ loc.location_name }}</span>
                      <span class="site-item-sub">Deployment Active</span>
                    </div>
                    <div v-if="loc.location_id === selectedLocationId" class="site-active-check">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>
        <div class="header-actions">
          <button v-if="!showPlans" class="btn btn-primary" style="padding: 6px 12px; font-size: 12px; border-radius: 8px;" @click="togglePlanSelection(currentPlan && currentPlan.status === 'ACTIVE' ? 'change' : 'upgrade')">
            {{ currentPlan && currentPlan.status === 'ACTIVE' ? 'Change Plan' : 'Upgrade Plan' }}
          </button>
        </div>
      </div>


      <!-- Payment Status Alert -->
      <div v-if="paymentStatus" class="payment-alert" :class="paymentStatus.type">
        <div class="alert-content">
          <span class="alert-icon">{{ paymentStatus.type === 'success' ? '✅' : '❌' }}</span>
          <p>{{ paymentStatus.message }}</p>
        </div>
        <button class="alert-close" @click="paymentStatus = null">×</button>
      </div>

      <!-- Limit Exhausted Alert -->
      <div v-if="currentPlan && currentPlan.calculated_remaining <= 0" class="limit-exhausted-banner-v2 animate-pop-in">
        <div class="banner-v2-main">
          <div class="banner-v2-icon-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div class="banner-v2-info">
            <h3>TRANSACTION LIMIT REACHED</h3>
            <p>Operations are paused. Please upgrade to continue.</p>
          </div>
        </div>
        <button class="btn-upgrade-v2" @click="togglePlanSelection('upgrade')">
          <span>Upgrade Tier</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
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

        <!-- Plan Selection Flow -->
        <div v-if="showPlans" class="plan-selection-overlay">
          <div class="selection-container">
            <div class="selection-header">
              <h2>Select Service Architecture</h2>
              <button class="btn-close" @click="showPlans = false">×</button>
            </div>
            <div class="tier-grid">
              <TierCard 
                v-for="plan in displayedPlans" 
                :key="plan.plan_id" 
                :plan="plan" 
                :is-current="currentPlan?.plan_id === plan.plan_id && currentPlan?.status === 'ACTIVE'"
                :loading="submitting === plan.plan_id"
                @subscribe="handleSubscribe"
              />
            </div>
          </div>
        </div>

        <!-- No Plan State -->
        <div v-if="!currentPlan && !showPlans" class="empty-deployment-state">
          <div class="empty-card">
            <div class="empty-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <h3 class="empty-title">Deployment Pending</h3>
            <p class="empty-text">
              No active service tier has been assigned to this location yet. Subscribe to continue valet operations.
            </p>
            <button class="request-btn" @click="togglePlanSelection('upgrade')">
              View Plans
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
import TierCard from '../components/subscriptions/TierCard.vue';

const authStore = useAuthStore();
const currentPlan = ref(null);
const history = ref([]);
const availablePlans = ref([]);
const loading = ref(true);
const showPlans = ref(false);
const submitting = ref(null);
const paymentStatus = ref(null);
const planSelectionMode = ref('upgrade'); // 'upgrade' or 'change'

const togglePlanSelection = (mode) => {
  planSelectionMode.value = mode;
  showPlans.value = true;
};

const locations = computed(() => authStore.userLocations);
const selectedLocationId = ref(authStore.selectedLocationId);
const showLocationDropdown = ref(false);
const siteFilter = ref('');

const filteredLocations = computed(() => {
  if (!siteFilter.value) return locations.value;
  const q = siteFilter.value.toLowerCase();
  return locations.value.filter(l => l.location_name.toLowerCase().includes(q));
});

const selectedLocationName = computed(() => {
  const loc = locations.value.find(l => l.location_id === selectedLocationId.value);
  return loc ? loc.location_name : 'Select Location';
});

const selectLocation = (loc) => {
  selectedLocationId.value = loc.location_id;
  showLocationDropdown.value = false;
  fetchPlanDetails();
};

// Simple click outside directive logic
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    document.addEventListener("click", el.clickOutsideEvent);
  },
  unmounted(el) {
    document.removeEventListener("click", el.clickOutsideEvent);
  },
};

const fetchPlanDetails = async () => {
  if (!selectedLocationId.value) {
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    const [planRes, historyRes, plansRes] = await Promise.all([
      SubscriptionService.getMyPlan(selectedLocationId.value),
      SubscriptionService.getMySubscriptions(selectedLocationId.value),
      SubscriptionService.getPlans()
    ]);
    
    currentPlan.value = planRes.data;
    history.value = historyRes.data;
    availablePlans.value = plansRes.data;
  } catch (error) {
    console.error('Fetch Error:', error);
  } finally {
    loading.value = false;
  }
};

const handleSubscribe = async (plan) => {
  if (!selectedLocationId.value) return;
  
  submitting.value = plan.plan_id;
  try {
    // 1. Initiate Payment
    const initRes = await SubscriptionService.initiatePayment(selectedLocationId.value, plan.plan_id);
    const paymentId = initRes.data.payment_id;

    // 2. Simulate Payment (Since this is a demo/dev mode)
    // In a real app, this would redirect to a payment gateway
    setTimeout(async () => {
      try {
        const result = await SubscriptionService.updatePaymentStatus(paymentId, 'SUCCESS');
        paymentStatus.value = {
          type: 'success',
          message: '✅ Payment Successful. Plan Activated.'
        };
        showPlans.value = false;
        fetchPlanDetails();
      } catch (err) {
        paymentStatus.value = {
          type: 'error',
          message: '❌ Payment Failed. Please try again.'
        };
      } finally {
        submitting.value = null;
      }
    }, 2000);

  } catch (error) {
    console.error('Subscription Error:', error);
    paymentStatus.value = {
      type: 'error',
      message: error.response?.data?.message || 'Failed to initiate payment.'
    };
    submitting.value = null;
  }
};

const displayedPlans = computed(() => {
  if (currentPlan.value) {
    // Only show plans that can accommodate the transactions already processed
    return availablePlans.value.filter(p => p.total_transactions > (currentPlan.value.used_transactions || 0));
  }
  return availablePlans.value;
});

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

<style>
/* Global Theme Bridge for Site Switcher */
:root .light-theme .dashboard-wrapper,
:root .light .dashboard-wrapper,
body.light-theme .dashboard-wrapper,
body.light .dashboard-wrapper,
.dashboard-wrapper:not(.dark):not(.dark-theme) {
  --dropdown-bg: #ffffff !important;
  --dropdown-border: #d1d5db !important;
  --dropdown-text: #111827 !important;
  --dropdown-hover: #f3f4f6 !important;
  --dropdown-active-bg: #f0f7ff !important;
  --dropdown-shadow: 0 20px 50px rgba(0, 0, 0, 0.15) !important;
  --search-bg: #f9fafb !important;
}

:root .dark-theme .dashboard-wrapper,
:root .dark .dashboard-wrapper,
body.dark-theme .dashboard-wrapper,
body.dark .dashboard-wrapper {
  --dropdown-bg: #111827 !important;
  --dropdown-border: #374151 !important;
  --dropdown-text: #f9fafb !important;
  --dropdown-hover: #1f2937 !important;
  --dropdown-active-bg: rgba(59, 130, 246, 0.2) !important;
  --dropdown-shadow: 0 20px 50px rgba(0, 0, 0, 0.5) !important;
  --search-bg: #1f2937 !important;
}
</style>

<style scoped>
/* 1. Base Defaults (Light Theme) */
.dashboard-wrapper {
  --dropdown-bg: #ffffff;
  --dropdown-border: #e2e8f0;
  --dropdown-text: #1e293b;
  --dropdown-hover: #f1f5f9;
  --dropdown-active-bg: #eff6ff;
  --dropdown-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

/* 2. System Dark Mode Override */
@media (prefers-color-scheme: dark) {
  .dashboard-wrapper {
    --dropdown-bg: #1a1b1e;
    --dropdown-border: #2c2e33;
    --dropdown-text: #ffffff;
    --dropdown-hover: #25262b;
    --dropdown-active-bg: rgba(66, 153, 225, 0.15);
    --dropdown-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  }
}

.dashboard-wrapper {
  width: 100%;
  padding: 0;
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
  flex-wrap: nowrap;
}

.header-main-info h1 {
  flex-shrink: 0;
  margin: 0;
}

/* Professional Inline Site Switcher */
.site-switcher-inline {
  position: relative;
  z-index: 1000;
}

.switcher-trigger-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  background: var(--dropdown-bg);
  border: 1px solid var(--dropdown-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 220px;
  box-shadow: var(--shadow-sm);
  color: var(--dropdown-text);
}

.switcher-trigger-inline:hover {
  border-color: var(--primary);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.switcher-trigger-inline.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.1);
}

.trigger-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}

.loc-icon {
  color: var(--primary);
  flex-shrink: 0;
}

.current-site-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chevron-icon {
  color: var(--text-muted);
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}

/* Professional Dropdown Menu */
.switcher-dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 340px;
  background: var(--dropdown-bg) !important;
  border: 1px solid var(--dropdown-border);
  border-radius: 20px;
  box-shadow: var(--dropdown-shadow);
  padding: 12px;
  z-index: 1000;
}

.menu-search-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  background: var(--search-bg);
  border: 1px solid var(--dropdown-border);
  border-radius: 10px;
  height: 36px;
  margin-bottom: 12px;
}

.menu-search-wrapper svg {
  color: var(--text-muted);
}

.menu-search-wrapper input {
  background: transparent;
  border: none;
  width: 100%;
  color: var(--dropdown-text);
  font-size: 13px;
  font-weight: 600;
  outline: none;
}

.menu-items-list {
  max-height: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.site-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--dropdown-bg);
  color: var(--dropdown-text);
}

.site-item:hover {
  background: var(--dropdown-hover);
}

.site-item.active {
  background: var(--dropdown-active-bg);
}

.site-item-info {
  display: flex;
  flex-direction: column;
}

.site-item-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--dropdown-text);
}

.site-item-sub {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  opacity: 0.8;
}

.site-active-check {
  color: var(--primary);
}

/* Limit Exhausted Banner V2 */
.limit-exhausted-banner-v2 {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-radius: 20px;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  box-shadow: 0 12px 24px rgba(239, 68, 68, 0.2);
}

.banner-v2-main {
  display: flex;
  align-items: center;
  gap: 16px;
}

.banner-v2-icon-box {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.banner-v2-info h3 {
  font-size: 13px;
  font-weight: 900;
  color: white;
  margin: 0;
  letter-spacing: 0.05em;
}

.banner-v2-info p {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 2px 0 0 0;
}

.btn-upgrade-v2 {
  background: white;
  color: #ef4444;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
}

.btn-upgrade-v2:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@keyframes dropdownFade {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s;
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.btn-primary-small {
  background: var(--primary);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.2);
  transition: all 0.2s;
}

.btn-primary-small:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(var(--primary-rgb), 0.3);
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

/* Payment Alert */
.payment-alert {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  animation: slideDown 0.3s ease-out;
}
.payment-alert.success { background: var(--success-light); color: var(--success); border: 1px solid rgba(34, 197, 94, 0.2); }
.payment-alert.error { background: var(--danger-light); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2); }

.alert-content { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 13px; }
.alert-close { background: none; border: none; font-size: 20px; color: inherit; cursor: pointer; opacity: 0.5; }

/* Limit Exhausted Banner */
.limit-exhausted-banner {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  padding: 20px 24px;
  border-radius: 20px;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 15px 35px rgba(239, 68, 68, 0.3);
  animation: slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.banner-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-text h3 {
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0.1em;
  margin: 0 0 4px 0;
}

.banner-text p {
  font-size: 13px;
  font-weight: 600;
  opacity: 0.9;
  margin: 0;
}

.btn-upgrade-now {
  background: white;
  color: #ef4444;
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-upgrade-now:hover {
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

/* Plan Selection Overlay */
.plan-selection-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.selection-container {
  background: var(--bg-main);
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  border-radius: 32px;
  padding: 40px;
  overflow-y: auto;
  border: 1px solid var(--border-subtle);
  position: relative;
}

.selection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.selection-header h2 {
  font-size: 32px;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.btn-close {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  width: 44px;
  height: 44px;
  border-radius: 12px;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.tier-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px;
  padding: 10px;
}

@keyframes slideDown {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

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
