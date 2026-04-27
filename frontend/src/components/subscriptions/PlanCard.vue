<template>
  <div class="subscription-content">
    <!-- Plan Hero Section -->
    <div class="plan-hero">
      <div class="plan-main-info">
        <p class="label-tiny">Active Service Architecture</p>
        <h2 class="plan-title">{{ plan.plan_name }}</h2>
        <div class="validity-row">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>Validity: {{ formatDate(plan.end_date) }}</span>
        </div>
      </div>
      <div class="plan-status-col">
        <div class="status-chip" :class="plan.status.toLowerCase()">
          <span class="status-dot"></span>
          {{ plan.status }}
        </div>
      </div>
    </div>

    <!-- Performance Metrics Grid -->
    <div class="metrics-grid">
      <div class="metric-card">
        <p class="metric-label">Total Capacity</p>
        <div class="metric-value-row">
          <span class="metric-value">{{ formatNumber(plan.plan_limit) }}</span>
          <span class="metric-unit">txn</span>
        </div>
      </div>
      
      <div class="metric-card">
        <p class="metric-label">Consumption</p>
        <div class="metric-value-row">
          <span class="metric-value warning">{{ formatNumber(plan.used_transactions) }}</span>
          <span class="metric-unit">txn</span>
        </div>
      </div>

      <div class="metric-card">
        <p class="metric-label">Availability</p>
        <div class="metric-value-row">
          <span class="metric-value success">{{ formatNumber(plan.calculated_remaining) }}</span>
          <span class="metric-unit">txn</span>
        </div>
      </div>
    </div>

    <!-- Analytic Progress Section -->
    <div class="intelligence-card">
      <div class="intelligence-header">
        <div class="intelligence-titles">
          <span class="label-tiny">Usage Intelligence</span>
          <span class="section-title-small">Resource Allocation Status</span>
        </div>
        <div class="percentage-label">
          {{ usagePercentage }}%
        </div>
      </div>
      
      <div class="progress-track-thin">
        <div 
          class="progress-fill-thin"
          :style="{ width: usagePercentage + '%' }"
        ></div>
      </div>
      
      <div class="details-row">
        <div class="detail-item">
          <div class="detail-icon-small success">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
          <div class="detail-texts">
            <span class="detail-label-tiny">Deployment Site</span>
            <span class="detail-value-small">{{ plan.location_name }}</span>
          </div>
        </div>
        
        <div class="detail-item">
          <div class="detail-icon-small info">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
          </div>
          <div class="detail-texts">
            <span class="detail-label-tiny">Payment Status</span>
            <span class="detail-value-small text-success">Completed</span>
          </div>
        </div>
      </div>

      <div class="protocol-box-small">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        <p class="tiny-text">Restricted automatically upon capacity breach or expiration. Contact admin for upgrades.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  plan: {
    type: Object,
    required: true
  }
});

const usagePercentage = computed(() => {
  if (!props.plan.plan_limit) return 0;
  return Math.min(100, Math.round((props.plan.used_transactions / props.plan.plan_limit) * 100));
});

const statusBadgeClass = computed(() => {
  switch (props.plan.status) {
    case 'ACTIVE': return 'badge-success';
    case 'EXPIRED': return 'badge-danger';
    default: return 'badge-info';
  }
});

const dotClass = computed(() => {
  switch (props.plan.status) {
    case 'ACTIVE': return 'bg-success';
    case 'EXPIRED': return 'bg-danger';
    default: return 'bg-info';
  }
});

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};
</script>

<style scoped>
.subscription-content {
  color: var(--text-main);
  font-family: 'Inter', sans-serif;
}

/* Hero Section */
.plan-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
  padding: 0 4px;
}

.label-tiny {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: 2px;
}

.plan-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
  margin: 0 0 2px 0;
}

.validity-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}

.status-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 10px;
  font-weight: 800;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-chip.active { color: var(--success); border-color: rgba(34, 197, 94, 0.2); }
.status-chip.expired { color: var(--danger); border-color: rgba(239, 68, 68, 0.2); }

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.active .status-dot { animation: pulse 2s infinite; }

/* Metrics Grid - 3 Columns */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.metric-card {
  background: var(--bg-card);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  transition: border-color 0.2s;
}

.metric-card:hover {
  border-color: var(--primary-border);
}

.metric-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.metric-value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.metric-value {
  font-size: 22px;
  font-weight: 800;
  font-family: 'Outfit', sans-serif;
  color: var(--text-main);
  line-height: 1;
}

.metric-value.warning { color: var(--warning); }
.metric-value.success { color: var(--success); }

.metric-unit {
  font-size: 10px;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
}

/* Intelligence Section */
.intelligence-card {
  background: var(--bg-card);
  padding: 20px;
  border-radius: 16px;
  border: 1px solid var(--border-subtle);
}

.intelligence-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title-small {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
}

.percentage-label {
  font-size: 18px;
  font-weight: 800;
  color: var(--primary);
}

.progress-track-thin {
  width: 100%;
  height: 6px;
  background: var(--bg-main);
  border-radius: 100px;
  margin-bottom: 20px;
  overflow: hidden;
}

.progress-fill-thin {
  height: 100%;
  background: var(--primary);
  border-radius: 100px;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.details-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-icon-small {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.detail-icon-small.success { background: var(--success-light); color: var(--success); }
.detail-icon-small.info { background: var(--info-light); color: var(--info); }

.detail-label-tiny {
  display: block;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--text-muted);
}

.detail-value-small {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-main);
}

.protocol-box-small {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  background: var(--bg-main);
  border-radius: 8px;
}

.tiny-text {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-muted);
  margin: 0;
}

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.15); }
  100% { opacity: 1; transform: scale(1); }
}

@media (max-width: 640px) {
  .metrics-grid { grid-template-columns: 1fr; }
  .details-row { grid-template-columns: 1fr; }
}
</style>
