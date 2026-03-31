<template>
  <LocationReport 
    v-if="locationId" 
    :locationId="locationId" 
    :locationName="locationName" 
    :showHeader="true" 
  />
  <div v-else class="reports-loading">
    <div class="spinner"></div>
    <span>Loading Reports...</span>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth';
import LocationReport from '../../components/reports/LocationReport.vue';

const authStore = useAuthStore();
const locationId = ref(null);
const locationName = ref('');

onMounted(() => {
  if (authStore.accessibleLocations && authStore.accessibleLocations.length > 0) {
    locationId.value = authStore.accessibleLocations[0].location_id;
    locationName.value = authStore.accessibleLocations[0].location_name;
  }
});
</script>

<style scoped>
.reports-loading {
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
@keyframes spin { 
  to { transform: rotate(360deg); } 
}
</style>
