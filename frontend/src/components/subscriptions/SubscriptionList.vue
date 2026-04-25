<template>
  <div class="card p-0 overflow-hidden h-full flex flex-col">
    <div class="px-6 py-5 border-b border-subtle flex justify-between items-center bg-main">
      <div class="flex items-center space-x-3">
        <h3 class="text-lg font-bold text-main">Live Subscriptions</h3>
      </div>
    </div>
    <div class="table-container border-none rounded-none flex-grow">
      <table class="table">
        <thead>
          <tr>
            <th>Location Module</th>
            <th>Tier</th>
            <th>Term (End)</th>
            <th>Usage</th>
            <th class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sub in subscriptions" :key="sub.subscription_id">
            <td>
              <span class="font-bold text-main text-sm">{{ sub.location_name }}</span>
            </td>
            <td>
              <span class="badge badge-info uppercase text-[10px]">
                {{ sub.plan_name }}
              </span>
            </td>
            <td>
              <span class="text-muted font-bold text-xs" :class="isExpiringSoon(sub.end_date) ? 'text-danger underline decoration-2 underline-offset-4' : ''">
                {{ formatDate(sub.end_date) }}
              </span>
            </td>
            <td>
              <div class="flex flex-col space-y-1.5 w-32">
                <div class="flex justify-between items-end">
                  <span class="text-[10px] font-bold text-muted uppercase tabular-nums">{{ sub.remaining_transactions }} left</span>
                </div>
                <div class="w-full h-1.5 bg-card rounded-full overflow-hidden shadow-inner border border-subtle">
                  <div 
                    class="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
                    :style="{ width: Math.min(100, (sub.remaining_transactions / 500) * 100) + '%' }"
                  ></div>
                </div>
              </div>
            </td>
            <td class="text-center">
              <span 
                class="badge uppercase text-[10px]"
                :class="{
                  'badge-success': sub.status === 'ACTIVE',
                  'badge-danger': sub.status === 'EXPIRED',
                  'bg-slate-100 text-slate-600 border-slate-200': sub.status === 'BLOCKED'
                }"
              >
                {{ sub.status }}
              </span>
            </td>
          </tr>
          <tr v-if="subscriptions.length === 0">
            <td colspan="5" class="p-12 text-center">
              <div class="flex flex-col items-center space-y-3">
                <div class="p-4 bg-main rounded-full text-muted border border-subtle">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p class="text-muted font-bold uppercase tracking-widest text-xs">No active deployments found.</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  subscriptions: {
    type: Array,
    default: () => []
  }
});

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const isExpiringSoon = (dateStr) => {
  const expiry = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  return diffDays <= 7 && diffDays > 0;
};
</script>

<style scoped>
.bg-main { background-color: var(--bg-main); }
.border-subtle { border-color: var(--border-subtle); }
.text-main { color: var(--text-main); }
.text-muted { color: var(--text-muted); }
.text-primary { color: var(--primary); }
.text-danger { color: var(--danger); }
.bg-primary { background-color: var(--primary); }
.bg-card { background-color: var(--bg-card); }
</style>
