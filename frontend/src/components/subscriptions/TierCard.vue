<template>
  <div class="tier-card" :class="{ 'featured': plan.plan_name.includes('Standard'), 'current-plan-card': isCurrent }">
    <div class="tier-badge" v-if="plan.plan_name.includes('Standard') && !isCurrent">Most Popular</div>
    <div class="tier-badge current-badge" v-if="isCurrent">Current Plan</div>
    
    <div class="tier-header">
      <h3 class="tier-name">{{ plan.plan_name }}</h3>
      <div class="tier-price">
        <span class="currency">₹</span>
        <span class="amount">{{ plan.price }}</span>
        <span class="period">/ {{ plan.duration_months }}m</span>
      </div>
    </div>

    <div class="tier-features">
      <div class="feature-item">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-success"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>{{ plan.total_transactions }} Transactions</span>
      </div>
      <div class="feature-item">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-success"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>{{ plan.duration_months }} Months Validity</span>
      </div>
      <div class="feature-item">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-success"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>Full Access Control</span>
      </div>
      <div v-if="isCurrent" class="current-label-inline">
        <span class="pulse-dot"></span>
        Active Subscription
      </div>
    </div>

    <button 
      class="btn-subscribe" 
      :class="{ 'current-btn': isCurrent }"
      @click="$emit('subscribe', plan)"
      :disabled="loading || isCurrent"
    >
      <span v-if="loading">Processing...</span>
      <span v-else-if="isCurrent">Current Plan</span>
      <span v-else>Subscribe Now</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  plan: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  isCurrent: {
    type: Boolean,
    default: false
  }
});

defineEmits(['subscribe']);
</script>

<style scoped>
.tier-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
}

.tier-card:hover {
  transform: translateY(-8px);
  border-color: var(--primary);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.tier-card.featured {
  border: 2px solid var(--primary);
  transform: scale(1.05);
}

.tier-card.featured:hover {
  transform: scale(1.05) translateY(-8px);
}

.tier-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--primary);
  color: white;
  padding: 4px 16px;
  border-radius: 100px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.tier-header {
  margin-bottom: 24px;
}

.tier-name {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 12px;
}

.tier-price {
  display: flex;
  align-items: baseline;
  color: var(--text-main);
  margin-top: 4px;
}

.currency {
  font-size: 24px;
  font-weight: 700;
  margin-right: 4px;
  align-self: flex-start;
  margin-top: 8px;
}

.amount {
  font-size: 48px;
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
}

.period {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-muted);
  margin-left: 4px;
}

.tier-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 30px;
  flex-grow: 1;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
}

.text-success {
  color: var(--success);
}

.btn-subscribe {
  width: 100%;
  padding: 16px;
  border-radius: 14px;
  background: var(--primary);
  color: white;
  font-weight: 800;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  margin-top: auto;
}

.btn-subscribe:hover:not(:disabled) {
  filter: brightness(1.1);
  box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);
}

.btn-subscribe:disabled:not(.current-btn) {
  opacity: 0.6;
  cursor: not-allowed;
}

.current-plan-card {
  border: 2px solid var(--success) !important;
  background: rgba(34, 197, 94, 0.05);
  box-shadow: 0 0 30px rgba(34, 197, 94, 0.2);
  transform: scale(1.02) !important;
}

.current-badge {
  background: var(--success) !important;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

.current-label-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 800;
  color: var(--success);
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 8px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: var(--success);
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

.featured .btn-subscribe {
  background: var(--primary);
}
</style>
