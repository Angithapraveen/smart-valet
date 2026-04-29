<template>
  <div class="card p-0 overflow-hidden h-full flex flex-col">
    <div class="px-6 py-4 border-b border-subtle flex justify-between items-center bg-main">
      <div class="flex items-center space-x-3">
        <h3 style="font-size: 16px; font-weight: 750; color: var(--text-main); margin: 0;">Service Tiers</h3>
        <span class="badge badge-info uppercase text-[9px]">
          {{ plans.length }} Loaded
        </span>
      </div>
    </div>
    
    <div class="table-container border-none rounded-none flex-grow">
      <table class="table">
        <thead>
          <tr>
            <th>Tier Identity</th>
            <th>Capacity</th>
            <th>Term</th>
            <th>Valuation</th>
            <th>Status</th>
            <th class="text-center">Operation</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="plan in plans" :key="plan.plan_id">
            <td>
              <div class="flex items-center space-x-3">
                <span class="font-bold text-main">{{ plan.plan_name }}</span>
              </div>
            </td>
            <td>
              <span class="text-muted tabular-nums">{{ plan.total_transactions }} txn</span>
            </td>
            <td>
              <span class="badge text-[10px] uppercase">
                {{ plan.duration_months }} Months
              </span>
            </td>
            <td class="font-bold text-primary tabular-nums">₹{{ plan.price }}</td>
            <td>
              <span class="badge badge-success uppercase text-[10px]">
                Active
              </span>
            </td>
            <td class="text-center">
              <button 
                @click="$emit('assign', plan)"
                class="btn btn-outline py-1.5 px-4 text-xs hover:bg-primary-light hover:text-primary hover:border-primary transition-all"
              >
                Assign
              </button>
            </td>
          </tr>
          <tr v-if="plans.length === 0">
            <td colspan="6" class="p-12 text-center">
              <div class="flex flex-col items-center space-y-3">
                <div class="p-4 bg-main rounded-full text-muted border border-subtle">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <p class="text-muted font-bold uppercase tracking-widest text-xs">Awaiting Tier Architectures</p>
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
  plans: {
    type: Array,
    default: () => []
  }
});

defineEmits(['assign']);

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};
</script>

<style scoped>
.bg-main { background-color: var(--bg-main); }
.border-subtle { border-color: var(--border-subtle); }
.text-main { color: var(--text-main); }
.text-muted { color: var(--text-muted); }
.text-primary { color: var(--primary); }
</style>
