<script setup>
import { computed, onMounted, ref } from 'vue'

import ExecutiveDashboard from '@/components/dashboard/ExecutiveDashboard.vue'
import MachineDashboard from '@/components/dashboard/MachineDashboard.vue'

const {
  systemSetting,
  fetchSystemSetting,
} = useManageSystemSetting()


const loading = ref(true)

const dashboardMode = computed(() => {
  return systemSetting.value?.entry?.value?.showing ?? null
})


onMounted(async () => {
  loading.value = true
  await fetchSystemSetting({ isMinimal: true, key: "DASHBOARD_SETTINGS" })
  loading.value = false
  console.log(systemSetting)
})
</script>

<template>
  <VRow
    v-if="loading"
    class="justify-center py-16"
  >
    <VProgressCircular indeterminate />
  </VRow>

  <MachineDashboard v-else-if="dashboardMode === 'Machine'" :system-setting="systemSetting"/>

  <ExecutiveDashboard v-else-if="dashboardMode === 'Executive'" />

  <VAlert
    v-else
    type="warning"
  >
    Invalid dashboard mode
  </VAlert>
</template>
