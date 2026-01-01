<script setup>
import EnergyLineChart from '@/components/dashboard/operation/EnergyLineChart.vue'
import GaugeChartWidget from '@/components/dashboard/operation/GaugeChartWidget.vue'
import RealtimeTable from '@/components/dashboard/operation/RealtimeTable.vue'
import StatsCard from '@/components/dashboard/operation/StatsCard.vue'
import { useManageDashboardWidget } from '@/composables/useManageDashboardWidget'
import { GridItem, GridLayout } from 'grid-layout-plus'
import { computed, onMounted } from 'vue'

const {
  saveDashboardWidget,
} = useManageDashboardWidget()


const chartComponentMap = {
  gauge: GaugeChartWidget,
  line: EnergyLineChart,
  metric: StatsCard,
}


const route = useRoute()
const router = useRouter()
const id = route.params.id

const {
  machine,
  fetchMachine,
} = useManageMachine()

const {
  mqttData,
  mqttStatus,
  isConnected,
  connectMQTT,
  disconnectMQTT,
  getValue,
  getFormattedValue,
  filterParametersByKeys,
  calculateDelta,
} = useMqttConnection()

onMounted(async () => {
  await fetchMachine(1)

  if (processedMachine.value) {
    connectMQTT(processedMachine.value)
  }
})

// Disconnect on unmount
onUnmounted(() => {
  disconnectMQTT()
})

// Filter running times
const runningTimes = computed(() => {
  return filterParametersByKeys([
    '1_Comp1RunningTime',
    '1_Comp2RunningTime',
  ])
})

const processedMachine = computed(() => {
  if(!machine?.value?.entry) return null 
  console.log(machine.value)
  
  return machine.value.entry
})



const parameters = computed(() => {
  if(processedMachine.value == null) return []
  console.log(processedMachine.value)
  
  return processedMachine.value['mqtt_topic'].parameters
})



const getParameterById = id => {
  return availableParameters.value?.find(p => p.id === id)
}

const layout = computed(() => {
  const data = processedMachine.value?.widgets?.map(row => ({
    i: row.code,
    x: row.layout.x,
    y: row.layout.y,
    w: row.layout.w,
    h: row.layout.h,
    ...row.config,
    dataSourceIds: Array.isArray(row.config.dataSourceIds)
      ? row.config.dataSourceIds
      : [row.config.dataSourceIds],
  })) || []

  console.log(data)
  
  return data
})


// Computed
const availableParameters = computed(() => parameters.value || [])


const machineState = computed(() => {
  if (!machine?.value?.entry) return null
 
  return {
    id: processedMachine.value.id, 
    name: processedMachine.value.name, 
    status: 'on',
    totalRuntime: '1,245h 30m',
  }
})

const modelConfigurationReady = computed(() => {
  return Boolean(processedMachine.value) 
})

const isDataReady = computed(() => {
  return (
    processedMachine.value !== null &&
    availableParameters.value.length > 0
  )
})



// Chart types (simplified to 4 types only)
const chartTypes = [
  { 
    value: 'line', 
    label: 'Line Chart', 
    icon: 'tabler-chart-line',
    color: 'success',
    description: 'Show trends over time',
  },
  { 
    value: 'bar', 
    label: 'Bar Chart', 
    icon: 'tabler-chart-bar',
    color: 'info',
    description: 'Compare discrete values',
  },
  { 
    value: 'gauge', 
    label: 'Gauge Chart', 
    icon: 'tabler-gauge',
    color: 'warning',
    description: 'Show current value',
  },
  { 
    value: 'metric', 
    label: 'Metric Card', 
    icon: 'tabler-numbers',
    color: 'primary',
    description: 'Display key numbers',
  },
]


onMounted(async () => {
  let actionResult = await fetchMachine(id)
  await nextTick()
  console.log(actionResult)
  if (actionResult.success) {
    
  }
})

const chartPropsMap = {
  line: widget => ({
    title: widget.title,
    series: widget.series,
    'realtime-data': widget.dataSourceIds.map(dataSourceId => {
      let parameterVal = getParameterById(dataSourceId)
      
      return {
        name: parameterVal?.name,
        data: [],
      }
    }),
  }),
  metric: widget => ({
    title: widget.title,
    subtitle: widget.subtitle,
    badge: "",
    value: "100",
    icon: "tabler-snowflake",
    percentage: "10",
    unit: "N/A",
  }),
  
}

const gridMinHeight = computed(() => {
  if (!layout.value || layout.value.length === 0) return 'auto'
  
  // Cari posisi row terbawah (y + h maksimal)
  const maxRow = Math.max(
    ...layout.value.map(item => item.y + item.h),
  )
  
  const rowHeight = 30  // dari :row-height="30"
  const marginY = 16    // dari :margin="[16, 16]"
  
  // Total height = (jumlah row * (row height + margin)) + extra padding
  const totalHeight = (maxRow * (rowHeight + marginY)) + 32
  
  console.log('Grid height calculation:', { maxRow, totalHeight })
  
  return `${totalHeight}px`
})
</script>

<template>
  <div>
    <VRow>
      <VCol
        cols="12"
        md="12"
        sm="12"
      >
        <VCard class="mb-6">
          <VCardText>
            <div class="d-flex align-center justify-space-between flex-wrap gap-4">
              <div>
                <h2 class="text-h4 font-weight-bold text-white mb-1">
                  Dashboard Manager
                </h2>
                <p class="text-body-2 text-grey-lighten-1">
                  <VIcon
                    icon="tabler-device-analytics"
                    size="20"
                    class="me-1"
                  />
                  Machine {{ processedMachine?.name }} • Configure your monitoring charts
                </p>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
    <VRow
      style="min-height: 520px"
      class="match-height"
    >
      <!-- LEFT -->
      <VCol
        cols="12"
        lg="6"
        md="6"
        class="d-flex flex-column"
      >
        <ThreeModelViewer
          v-if="modelConfigurationReady"
          class="flex-grow-1"
          :model-path="processedMachine?.model_path"
        />
      </VCol>
      <!-- RIGHT -->
      <VCol
        cols="6"
        md="6"
        sm="6"
        class="d-flex flex-column"
      >
        <VRow class="match-height flex-grow-1">
          <VCol
            cols="12"
            class="py-3"
          >
            <StateCards
              v-if="machineState !== null"
              :machine="machineState"
              :running-times="runningTimes"
            />
          </VCol>

          <VCol
            cols="12"
            class="py-3"
          >
            <VRow>
              <VCol cols="12">
                <RealtimeTable />
              </VCol>
            </VRow>
          </VCol>
        </VRow>
      </VCol>
    </VRow>
  
    <VRow>
      <VCol
        cols="12"
        md="12"
        sm="12"
        class="pa-0"
      >
        <div
          v-if="layout.length > 0"
          :style="{ minHeight: gridMinHeight + 'px' }"
        >
          <GridLayout
            v-model:layout="layout"
            :col-num="12"
            :row-height="30"
            :is-resizable="true"
            :is-draggable="true"
            vertical-compact
            use-css-transforms
            :margin="[16, 16]"  
            :container-padding="[0, 0]"
            @layout-updated="(newLayout) => {
              console.log(newLayout)
            }"
          >
            <GridItem
              v-for="widget in layout"
              :key="widget.i"
              :x="widget.x"
              :y="widget.y"
              :w="widget.w"
              :h="widget.h"
              :i="widget.i"
              class="grid-item-wrapper"
            >
              <div class="preview-content text-center">
                <component
                  :is="chartComponentMap[widget.type]"
                  v-if="isDataReady"
                  v-bind="chartPropsMap[widget.type](widget)"
                />

                <div
                  v-else
                  class="text-caption text-grey"
                >
                  Loading data...
                </div>
              </div>
            </GridItem>
          </GridLayout>
        </div>
        <VCard
          v-else
          class="empty-state-card text-center py-16 mt-5"
        >
          <VCardText>
            <div class="mb-4">
              <VAvatar
                color="success"
                variant="tonal"
                size="120"
              >
                <VIcon
                  icon="tabler-chart-dots"
                  size="64"
                />
              </VAvatar>
            </div>
            <h3 class="text-h4 font-weight-bold mb-2">
              No Charts Configured
            </h3>
            <p class="text-body-1 text-grey mb-6">
              No dashboard widget for this machine
            </p>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
.chart-type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.chart-type-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.chart-type-card.active {
  border: 2px solid rgb(var(--v-theme-success));
}

.grid-item-wrapper {
  height: 100%;
}

.chart-container {
  height: 100%;
  width: 100%;
}
</style>
