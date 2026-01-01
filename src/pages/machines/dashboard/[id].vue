<script setup>
import UnmanageableAreaOverlay from '@/components/general/UnmanageableAreaOverlay.vue'
import { GridItem, GridLayout } from 'grid-layout-plus'
import { computed, onMounted, ref } from 'vue'

import EnergyLineChart from '@/components/dashboard/operation/EnergyLineChart.vue'
import GaugeChartWidget from '@/components/dashboard/operation/GaugeChartWidget.vue'
import RealtimeTable from '@/components/dashboard/operation/RealtimeTable.vue'
import StatsCard from '@/components/dashboard/operation/StatsCard.vue'
import { useManageDashboardWidget } from '@/composables/useManageDashboardWidget'

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

  // if (processedMachine.value) {
  //   connectMQTT(processedMachine.value)
  // }
})

// Disconnect on unmount
onUnmounted(() => {
  disconnectMQTT()
})

// Get values
const cop = computed(() => getValue('1_Chiller_COP'))

const deltaT = computed(() => 
  calculateDelta('1_Entering_Chilled_Water_Temp', '1_Leaving_Chilled_Water_Temp'),
)

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

// State
const showAddWidget = ref(false)
const showEditWidget = ref(false)
const selectedWidget = ref(null)

// Widget form
const widgetForm = ref({
  type: 'line',
  title: '',
  subtitle: '',
  dataSourceIds: [],
  w: 6,
  h: 5,
  color: '#10b981',
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

// Color presets
const colorPresets = [
  { value: '#10b981', label: 'Green' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#ef4444', label: 'Red' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#6366f1', label: 'Indigo' },
]

const getParameterById = id => {
  return availableParameters.value?.find(p => p.id === id)
}

// Layout - use localStorage for persistence
const STORAGE_KEY = `dashboard_layout_machine_${id}`
const layout = ref([])

// Load from localStorage on mount
const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      layout.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('Failed to load from storage:', error)
  }
}

// Save to localStorage
const saveIntoStorage = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout.value))
  } catch (error) {
    console.error('Failed to save to storage:', error)
  }
}

// Computed
const availableParameters = computed(() => parameters.value || [])
const isAddMode = computed(() => !selectedWidget.value)

// Initialize
onMounted(() => {
  loadFromStorage()
  
  // Load default layout if empty
  if (layout.value.length === 0) {
    loadDefaultLayout()
  }
})

// Load default layout
const loadDefaultLayout = () => {
  layout.value = []
  saveIntoStorage()
}

// Handle add/edit widget
const handleOpenDialog = (widget = null) => {
  console.log(widget)
  if (widget) {
    selectedWidget.value = widget
    widgetForm.value = { ...widget }
    showEditWidget.value = true
  } else {
    selectedWidget.value = null
    widgetForm.value = {
      type: 'line',
      title: '',
      subtitle: '',
      dataSourceIds: [],
      w: 6,
      h: 5,
      color: '#10b981',
    }
    showAddWidget.value = true
  }
}

const handleSaveWidget = () => {
  if (!widgetForm.value.title.trim()) {
    alert('Please enter widget title')
    
    return
  }

  if (widgetForm.value.dataSourceIds.length === 0) {
    alert('Please select at least one parameter')
    
    return
  }

  if (isAddMode.value) {
    const newWidget = {
      ...widgetForm.value,
      i: `widget_${Date.now()}`,
      x: (layout.value.length * 6) % 12,
      y: Math.floor(layout.value.length / 2) * 5,
    }

    console.log(newWidget)

    layout.value.push(newWidget)
  } else {
    const index = layout.value.findIndex(w => w.i === selectedWidget.value.i)
    if (index !== -1) {
      layout.value[index] = {
        ...layout.value[index],
        ...widgetForm.value,
      }
    }
  }

  saveIntoStorage()

 
  showAddWidget.value = false
  showEditWidget.value = false
  selectedWidget.value = null
}

// Handle remove widget
const handleRemoveWidget = widgetId => {
  if (confirm('Are you sure you want to remove this widget?')) {
    layout.value = layout.value.filter(w => w.i !== widgetId)
    saveIntoStorage()
  }
}


const handleStoreWidget = () => {
  const serializeDashboard = () => {
    return {
      machine_id: id,
      dashboard_widgets: layout.value.map(widget => ({
        code: widget.i,
        layout: {
          x: widget.x,
          y: widget.y,
          w: widget.w,
          h: widget.h,
        },
        config: {
          type: widget.type,
          title: widget.title,
          subtitle: widget.subtitle,
          dataSourceIds: widget.dataSourceIds,
          color: widget.color,
        },
      })),
    }
  }

  saveDashboardWidget(serializeDashboard())

}

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

// Handle reset
const handleReset = () => {
  if (confirm('Are you sure you want to reset the dashboard? This will load the default layout.')) {
    loadDefaultLayout()
  }
}

// Handle layout update
const handleLayoutUpdate = newLayout => {
  layout.value = newLayout
  saveIntoStorage()
}

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
      console.log(dataSourceId)
      let parameterVal = getParameterById(dataSourceId)
      console.log(parameterVal)
      
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

              <div class="d-flex align-center gap-3 flex-wrap">
                <VBtn
                  color="success"
                  @click="handleStoreWidget"
                >
                  <VIcon
                    icon="tabler-device-floppy"
                    start
                  />
                  Store Chart
                </VBtn>

                <VBtn
                  color="info"
                  @click="handleOpenDialog(null)"
                >
                  <VIcon
                    icon="tabler-plus"
                    start
                  />
                  Add Chart
                </VBtn>

           
         
                <VBtn
                  variant="tonal"
                  color="warning"
                  @click="handleReset"
                >
                  <VIcon
                    icon="tabler-refresh"
                    start
                  />
                  Reset
                </VBtn>
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
        <UnmanageableAreaOverlay message="3D Model Viewer">
          <ThreeModelViewer
            v-if="modelConfigurationReady"
            class="flex-grow-1"
            :model-path="processedMachine?.model_path"
          />
        </UnmanageableAreaOverlay>
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
                <UnmanageableAreaOverlay message="Realtime Data Table">
                  <RealtimeTable />
                </UnmanageableAreaOverlay>
              </VCol>
            </VRow>
          </VCol>
        </VRow>
      </VCol>
    </VRow>
  
    <VCol
      cols="12"
      md="12"
      sm="12"
      class="pa-0"
    >
      <div
        v-if="layout.length > 0"
        class="pa-0"
      >
        <GridLayout
          v-model:layout="layout"
          :col-num="12"
          :row-height="30"
          is-draggable
          is-resizable
          vertical-compact
          use-css-transforms
          :margin="[16, 16]"  
          :container-padding="[0, 0]"
          @layout-updated="handleLayoutUpdate"
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
            <VCard class="h-100 widget-preview-card">
              <VCardText class="pa-4">
                <div class="d-flex align-center justify-space-between mb-3">
                  <div class="d-flex  align-center gap-2">
                    <VIcon
                      :icon="chartTypes.find(t => t.value === widget.type)?.icon"
                      :color="chartTypes.find(t => t.value === widget.type)?.color"
                      size="25"
                    />
                    <div class="d-flex flex-row gap-3 align-center">
                      <div class="text-subtitle-2 font-weight-bold">
                        {{ widget.title }}
                      </div>
                     
                      <div class="text-body-2 text-grey">
                        {{ chartTypes.find(t => t.value === widget.type)?.label }}
                      </div>
                    </div>
                  </div>

                  <div class="d-flex gap-1">
                    <VBtn
                      icon
                      size="small"
                      variant="text"
                      @click="handleOpenDialog(widget)"
                    >
                      <VIcon
                        icon="tabler-edit"
                        size="18"
                      />
                    </VBtn>
                    <VBtn
                      icon
                      size="small"
                      variant="text"
                      color="error"
                      @click="handleRemoveWidget(widget.i)"
                    >
                      <VIcon
                        icon="tabler-trash"
                        size="18"
                      />
                    </VBtn>
                  </div>
                </div>

                <VDivider class="mb-3" />

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
              </VCardText>
            </VCard>
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
            Start building your dashboard by adding your first monitoring chart
          </p>
          <VBtn
            color="success"
            @click="handleOpenDialog(null)"
          >
            <VIcon
              icon="tabler-plus"
              start
            />
            Add First Chart
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
    <!-- Empty State -->
   
    <!-- Add/Edit Widget Dialog -->
    <VDialog
      v-model="showAddWidget"
      max-width="800"
      persistent
      scrollable
    >
      <VCard class="dialog-card">
        <VCardTitle class="dialog-header d-flex align-center justify-space-between pa-6">
          <div class="d-flex align-center gap-3">
            <VAvatar
              color="success"
              variant="tonal"
              size="40"
            >
              <VIcon icon="tabler-plus" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">
                Add New Chart
              </div>
              <div class="text-caption text-grey-lighten-1">
                Configure your monitoring chart
              </div>
            </div>
          </div>
          <VBtn
            icon
            variant="text"
            @click="showAddWidget = false"
          >
            <VIcon icon="tabler-x" />
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <VRow>
            <!-- Chart Type Selection -->
            <VCol cols="12">
              <div class="text-subtitle-1 font-weight-bold mb-3">
                <VIcon
                  icon="tabler-chart-dots"
                  size="18"
                  class="me-2"
                />
                Select Chart Type
              </div>
              <div class="chart-type-grid">
                <VCard
                  v-for="type in chartTypes"
                  :key="type.value"
                  class="chart-type-card"
                  :class="{ 'active': widgetForm.type === type.value }"
                  @click="() => {
                    widgetForm.type = type.value
                    widgetForm.dataSourceIds = []
                  }"
                >
                  <VCardText class="text-center pa-4">
                    <VAvatar
                      :color="type.color"
                      variant="tonal"
                      size="48"
                      class="mb-3"
                    >
                      <VIcon
                        :icon="type.icon"
                        size="28"
                      />
                    </VAvatar>
                    <div class="text-subtitle-2 font-weight-bold mb-1">
                      {{ type.label }}
                    </div>
                    <div class="text-caption text-grey">
                      {{ type.description }}
                    </div>
                  </VCardText>
                </VCard>
              </div>
            </VCol>

            <!-- Widget Info -->
            <VCol cols="12">
              <VTextField
                v-model="widgetForm.title"
                label="Chart Title"
                placeholder="e.g., Temperature Monitoring"
                prepend-inner-icon="tabler-text-size"
                variant="outlined"
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="widgetForm.subtitle"
                label="Chart Subtitle"
                placeholder="e.g., Real-time temperature data"
                prepend-inner-icon="tabler-text-caption"
                variant="outlined"
              />
            </VCol>

            <!-- Parameter Selection -->
            <VCol cols="12">
              <VSelect
                v-model="widgetForm.dataSourceIds"
                :items="availableParameters"
                item-title="name"
                item-value="id"
                label="Select Parameters"
                placeholder="Choose parameters to monitor"
                :multiple="widgetForm.type !== 'metric' && widgetForm.type !== 'gauge'"
                :chips="widgetForm.type !== 'metric' && widgetForm.type !== 'gauge'"
                :closable-chips="widgetForm.type !== 'metric' && widgetForm.type !== 'gauge'"
                
                prepend-inner-icon="tabler-binary-tree-2"
                variant="outlined"
              >
                <template #chip="{ item, props }">
                  <VChip
                    v-bind="props"
                    size="small"
                    color="success"
                  >
                    <VIcon
                      v-if="item.raw.is_watch"
                      icon="tabler-eye"
                      size="14"
                      start
                    />
                    {{ item.title }}
                  </VChip>
                </template>
                <template #item="{ item, props }">
                  <VListItem
                    v-bind="props"
                    :title="item.raw.name"
                  >
                    <template #prepend>
                      <VAvatar
                        :color="item.raw.is_watch ? 'success' : 'secondary'"
                        size="32"
                        variant="tonal"
                      >
                        <VIcon
                          :icon="item.raw.is_watch ? 'tabler-eye' : 'tabler-binary-tree-2'"
                          size="18"
                        />
                      </VAvatar>
                    </template>
                    <template #subtitle>
                      <span class="text-caption">
                        {{ item.raw.code }} • {{ item.raw.unit }}
                      </span>
                    </template>
                  </VListItem>
                </template>
              </VSelect>
            </VCol>

          
            <VCol
              cols="6"
              md="6"
            >
              <VTextField
                v-model.number="widgetForm.w"
                label="Width"
                suffix="columns"
                type="number"
                min="2"
                max="12"
                prepend-inner-icon="tabler-layout-columns"
                variant="outlined"
              />
            </VCol>

            <VCol
              cols="6"
              md="6"
            >
              <VTextField
                v-model.number="widgetForm.h"
                label="Height"
                suffix="rows"
                type="number"
                min="2"
                max="12"
                prepend-inner-icon="tabler-layout-rows"
                variant="outlined"
              />
            </VCol>
          </VRow>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-6 justify-end gap-2">
          <VBtn
            variant="tonal"
            color="error"
            @click="showAddWidget = false"
          >
            Cancel
          </VBtn>
          <VBtn
            variant="flat"
            color="success"
            @click="handleSaveWidget"
          >
            Add Chart
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Edit Widget Dialog (same structure) -->
    <VDialog
      v-model="showEditWidget"
      max-width="800"
      persistent
      scrollable
    >
      <VCard class="dialog-card">
        <VCardTitle class="dialog-header d-flex align-center justify-space-between pa-6">
          <div class="d-flex align-center gap-3">
            <VAvatar
              color="warning"
              variant="tonal"
              size="40"
            >
              <VIcon icon="tabler-edit" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">
                Edit Chart
              </div>
              <div class="text-caption text-grey-lighten-1">
                Modify chart configuration
              </div>
            </div>
          </div>
          <VBtn
            icon
            variant="text"
            @click="showEditWidget = false"
          >
            <VIcon icon="tabler-x" />
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <VRow>
            <VCol cols="12">
              <div class="text-subtitle-1 font-weight-bold mb-3">
                <VIcon
                  icon="tabler-chart-dots"
                  size="18"
                  class="me-2"
                />
                Chart Type
              </div>
              <div class="chart-type-grid">
                <VCard
                  v-for="type in chartTypes"
                  :key="type.value"
                  class="chart-type-card"
                  :class="{ 'active': widgetForm.type === type.value }"
                  @click="widgetForm.type = type.value"
                >
                  <VCardText class="text-center pa-4">
                    <VAvatar
                      :color="type.color"
                      variant="tonal"
                      size="48"
                      class="mb-3"
                    >
                      <VIcon
                        :icon="type.icon"
                        size="28"
                      />
                    </VAvatar>
                    <div class="text-subtitle-2 font-weight-bold mb-1">
                      {{ type.label }}
                    </div>
                    <div class="text-caption text-grey">
                      {{ type.description }}
                    </div>
                  </VCardText>
                </VCard>
              </div>
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="widgetForm.title"
                label="Chart Title"
                prepend-inner-icon="tabler-text"
                variant="outlined"
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="widgetForm.subtitle"
                label="Chart Subtitle"
                prepend-inner-icon="tabler-text-caption"
                variant="outlined"
              />
            </VCol>

            <VCol cols="12">
              <VSelect
                v-model="widgetForm.dataSourceIds"
                :items="availableParameters"
                item-title="name"
                item-value="id"
                label="Select Parameters"
                multiple
                chips
                closable-chips
                prepend-inner-icon="tabler-binary-tree-2"
                variant="outlined"
              />
            </VCol>

          

            <VCol
              cols="6"
              md="4"
            >
              <VTextField
                v-model.number="widgetForm.w"
                label="Width"
                type="number"
                min="2"
                max="12"
                prepend-inner-icon="tabler-layout-columns"
                variant="outlined"
              />
            </VCol>

            <VCol
              cols="6"
              md="4"
            >
              <VTextField
                v-model.number="widgetForm.h"
                label="Height"
                type="number"
                min="2"
                max="12"
                prepend-inner-icon="tabler-layout-rows"
                variant="outlined"
              />
            </VCol>
          </VRow>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-6 justify-end gap-2">
          <VBtn
            variant="outlined"
            color="error"
            @click="showEditWidget = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="warning"
            @click="handleSaveWidget"
          >
            <VIcon
              icon="tabler-check"
              start
            />
            Update Chart
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
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
