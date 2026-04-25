<template>
  <div class="card p-0 overflow-hidden relative group border-none shadow-lg">
    <!-- Status Badge -->
    <div class="absolute top-8 right-8 z-10">
      <div 
        class="badge shadow-lg flex items-center space-x-2 py-2 px-5 border-none"
        :class="statusBadgeClass"
      >
        <span class="w-1.5 h-1.5 rounded-full animate-pulse" :class="dotClass"></span>
        <span class="text-[10px] font-bold uppercase tracking-widest">{{ plan.status }}</span>
      </div>
    </div>

    <!-- Header Section -->
    <div class="p-10 bg-slate-900 relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-primary/20 to-violet-600/20 mix-blend-overlay"></div>
      <div class="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
      
      <div class="relative z-10 space-y-2">
        <p class="text-primary-accent font-black tracking-[0.3em] uppercase text-[10px]">Active Service Architecture</p>
        <h2 class="text-5xl font-black text-white tracking-tighter">{{ plan.plan_name }}</h2>
        <div class="flex items-center space-x-2 text-slate-400 text-sm font-bold">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>Validity until {{ formatDate(plan.end_date) }}</span>
        </div>
      </div>
    </div>

    <!-- Performance Metrics Grid -->
    <div class="p-10 grid grid-cols-1 md:grid-cols-3 gap-12 bg-card relative">
      <div class="space-y-1">
        <p class="text-muted text-[10px] font-black uppercase tracking-widest px-1">Total Capacity</p>
        <div class="flex items-baseline space-x-1">
          <span class="text-5xl font-black text-main tracking-tighter tabular-nums">{{ plan.plan_limit }}</span>
          <span class="text-xs font-black text-muted uppercase">txn</span>
        </div>
      </div>
      
      <div class="space-y-1">
        <p class="text-muted text-[10px] font-black uppercase tracking-widest px-1">Consumption</p>
        <div class="flex items-baseline space-x-1">
          <span class="text-5xl font-black text-warning tracking-tighter tabular-nums">{{ plan.used_transactions }}</span>
          <span class="text-xs font-black text-muted uppercase">txn</span>
        </div>
      </div>

      <div class="space-y-1">
        <p class="text-muted text-[10px] font-black uppercase tracking-widest px-1">Availability</p>
        <div class="flex items-baseline space-x-1">
          <span class="text-5xl font-black text-success tracking-tighter tabular-nums">{{ plan.calculated_remaining }}</span>
          <span class="text-xs font-black text-muted uppercase">txn</span>
        </div>
      </div>
    </div>

    <!-- Analytic Progress Section -->
    <div class="px-10 pb-12 bg-card">
      <div class="bg-main p-8 rounded-3xl border border-subtle">
        <div class="flex justify-between items-end mb-4">
          <div class="space-y-1">
            <span class="text-[10px] font-black text-muted uppercase tracking-widest block">Usage Intelligence</span>
            <span class="text-sm font-bold text-main">Resource Allocation Status</span>
          </div>
          <div class="text-right">
            <span class="text-3xl font-black text-primary tracking-tighter tabular-nums">{{ usagePercentage }}%</span>
          </div>
        </div>
        
        <div class="w-full h-4 bg-card rounded-full p-1 shadow-inner border border-subtle overflow-hidden">
          <div 
            class="h-full bg-primary rounded-full transition-all duration-[1500ms] ease-out shadow-lg"
            :style="{ width: usagePercentage + '%' }"
          ></div>
        </div>
        
        <div class="mt-6 flex items-start space-x-3 p-4 bg-card rounded-2xl border border-subtle shadow-sm">
          <div class="p-2 bg-primary-light rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </div>
          <p class="text-[11px] text-muted font-medium leading-relaxed">
            Deployment protocol: Transactions will be restricted automatically upon breach of capacity or expiration of validity term. 
            Coordinate with administration for tier upgrades.
          </p>
        </div>
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

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};
</script>

<style scoped>
.bg-card { background-color: var(--bg-card); }
.bg-main { background-color: var(--bg-main); }
.text-main { color: var(--text-main); }
.text-muted { color: var(--text-muted); }
.border-subtle { border-color: var(--border-subtle); }
.text-primary { color: var(--primary); }
.text-success { color: var(--success); }
.text-warning { color: var(--warning); }
.text-primary-accent { color: var(--primary-accent); }
</style>
