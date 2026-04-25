<template>
  <div class="card p-0 overflow-hidden h-full flex flex-col">
    <div class="px-6 py-5 border-b border-subtle flex justify-between items-center bg-main">
      <div class="flex items-center space-x-3">
        <h3 class="text-lg font-bold text-main">Revenue Ledger</h3>
      </div>
    </div>
    <div class="table-container border-none rounded-none flex-grow">
      <table class="table">
        <thead>
          <tr>
            <th>Beneficiary</th>
            <th>Valuation</th>
            <th>Timestamp</th>
            <th>State</th>
            <th>Mechanism</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payment in payments" :key="payment.payment_id">
            <td>
              <span class="font-bold text-main text-sm">{{ payment.location_name }}</span>
            </td>
            <td>
              <span class="font-bold text-success tabular-nums text-base">₹{{ payment.amount }}</span>
            </td>
            <td>
              <div class="flex flex-col">
                <span class="text-muted font-bold text-xs">{{ formatDateTime(payment.created_at).split(',')[0] }}</span>
                <span class="text-muted font-normal text-[10px] uppercase tracking-tighter">{{ formatDateTime(payment.created_at).split(',')[1] }}</span>
              </div>
            </td>
            <td>
              <span class="badge uppercase text-[10px]" :class="payment.status === 'SUCCESS' || payment.status === 'COMPLETED' ? 'badge-success' : 'badge-danger'">
                {{ payment.status }}
              </span>
            </td>
            <td>
              <span class="badge badge-info uppercase text-[10px]">
                {{ payment.payment_method }}
              </span>
            </td>
          </tr>
          <tr v-if="payments.length === 0">
            <td colspan="5" class="p-12 text-center">
              <div class="flex flex-col items-center space-y-3">
                <div class="p-4 bg-main rounded-full text-muted border border-subtle">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <p class="text-muted font-bold uppercase tracking-widest text-xs">No financial logs available.</p>
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
  payments: {
    type: Array,
    default: () => []
  }
});

const formatDateTime = (dateStr) => {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
.bg-main { background-color: var(--bg-main); }
.border-subtle { border-color: var(--border-subtle); }
.text-main { color: var(--text-main); }
.text-muted { color: var(--text-muted); }
.text-success { color: var(--success); }
</style>
