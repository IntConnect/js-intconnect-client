<script setup>
import EnergyLineChart from '@/components/dashboard/EnergyLineChart.vue'
import { GridItem, GridLayout } from 'grid-layout-plus'
import { computed, onMounted, ref } from 'vue'

// Import chart components (assume these are the glass design components)
// import GaugeChartGlass from '@/components/charts/GaugeChartGlass.vue'
// import LineChartGlass from '@/components/charts/LineChartGlass.vue'
// import BarChartGlass from '@/components/charts/BarChartGlass.vue'
// import MetricCardGlass from '@/components/charts/MetricCardGlass.vue'

// Props
const props = defineProps({
  machineId: {
    type: [String, Number],
    default: 1,
  },
})

const route = useRoute()
const router = useRouter()
const id = route.params.id

const {
  machine,
  fetchMachine,
} = useManageMachine()

const processedMachine = computed(() => {
  if(!machine?.value?.entry) return null 
  console.log(machine.value)
  
  return machine.value.entry
})

// Parameters data
const parameters = ref([
  { id: 1, name: 'Temperature Inlet', unit: '°C', code: 'TEMP_IN', is_watch: true },
  { id: 2, name: 'Temperature Outlet', unit: '°C', code: 'TEMP_OUT', is_watch: true },
  { id: 3, name: 'Pressure', unit: 'Bar', code: 'PRESSURE', is_watch: true },
  { id: 4, name: 'Flow Rate', unit: 'L/min', code: 'FLOW', is_watch: true },
  { id: 5, name: 'Power Consumption', unit: 'kW', code: 'POWER', is_watch: true },
  { id: 6, name: 'Vibration', unit: 'mm/s', code: 'VIBRATION', is_watch: true },
  { id: 7, name: 'Humidity', unit: '%', code: 'HUMIDITY', is_watch: false },
  { id: 8, name: 'Speed', unit: 'RPM', code: 'SPEED', is_watch: false },
  { id: 9, name: 'Energy Cost', unit: 'IDR', code: 'COST', is_watch: true },
  { id: 10, name: 'Bearing Temperature', unit: '°C', code: 'BEARING_TEMP', is_watch: true },
])

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
  interval: 5,
  w: 6,
  h: 5,
  color: '#10b981',
  colors: [],
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

// Layout - use localStorage for persistence
const STORAGE_KEY = `dashboard_layout_machine_${props.machineId}`
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
const saveToStorage = () => {
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
  layout.value = [
    {
      i: 'widget_1',
      x: 0,
      y: 0,
      w: 6,
      h: 10,
      type: 'line',
      title: 'Temperature Monitoring',
      subtitle: 'Real-time temperature data',
      dataSourceIds: [1, 2],
      interval: 5,
      color: '#10b981',
      colors: ['#10b981', '#06b6d4'],
    },
  
  ]
  saveToStorage()
}

// Handle add/edit widget
const handleOpenDialog = (widget = null) => {
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
      interval: 5,
      w: 6,
      h: 5,
      color: '#10b981',
      colors: [],
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

  // Auto-generate colors based on selected parameters
  const autoColors = widgetForm.value.dataSourceIds.map((_, idx) => 
    colorPresets[idx % colorPresets.length].value,
  )

  if (isAddMode.value) {
    const newWidget = {
      ...widgetForm.value,
      i: `widget_${Date.now()}`,
      x: (layout.value.length * 6) % 12,
      y: Math.floor(layout.value.length / 2) * 5,
      colors: autoColors,
    }

    layout.value.push(newWidget)
  } else {
    const index = layout.value.findIndex(w => w.i === selectedWidget.value.i)
    if (index !== -1) {
      layout.value[index] = {
        ...layout.value[index],
        ...widgetForm.value,
        colors: autoColors,
      }
    }
  }

  saveToStorage()
  showAddWidget.value = false
  showEditWidget.value = false
  selectedWidget.value = null
}

// Handle remove widget
const handleRemoveWidget = widgetId => {
  if (confirm('Are you sure you want to remove this widget?')) {
    layout.value = layout.value.filter(w => w.i !== widgetId)
    saveToStorage()
  }
}



// Handle reset
const handleReset = () => {
  if (confirm('Are you sure you want to reset the dashboard? This will load the default layout.')) {
    loadDefaultLayout()
  }
}

// Handle layout update
const handleLayoutUpdate = newLayout => {
  layout.value = newLayout
  saveToStorage()
}

onMounted(async () => {
  let actionResult = await fetchMachine(id)
  await nextTick()
  console.log(actionResult)
  if (actionResult.success) {
    
  }
 
})
</script>

<template>
  <div>
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
                  size="16"
                  class="me-1"
                />
                Machine {{ processedMachine?.name }} • Configure your monitoring charts
              </p>
            </div>

            <div class="d-flex align-center gap-3 flex-wrap">
              <VBtn
                color="success"
                variant="elevated"
                @click="handleOpenDialog"
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
            <EnergyLineChart
              v-if="widget.type === 'line'"
              :title="widget.title"
              :subtitle="widget.subtitle"
              :realtime-data="chartData"
              :x-categories="xCategories"
              class="chart-container"
            />
          </GridItem>
        </GridLayout>
      </div>
      <VCard
        v-else
        class="empty-state-card text-center py-16"
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
            size="x-large"
            @click="handleOpenDialog"
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

            <!-- Widget Info -->
            <VCol cols="12">
              <VTextField
                v-model="widgetForm.title"
                label="Chart Title"
                placeholder="e.g., Temperature Monitoring"
                prepend-inner-icon="tabler-text"
                variant="outlined"
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="widgetForm.subtitle"
                label="Chart Subtitle"
                placeholder="e.g., Real-time temperature data"
                prepend-inner-icon="tabler-text-size"
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
                multiple
                chips
                closable-chips
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

            <!-- Chart Settings -->
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model.number="widgetForm.interval"
                label="Update Interval"
                suffix="minutes"
                type="number"
                min="1"
                prepend-inner-icon="tabler-clock"
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
              md="4"
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

            <!-- Color Selection -->
            <VCol cols="12">
              <div class="text-subtitle-2 font-weight-medium mb-3">
                Primary Color
              </div>
              <div class="d-flex flex-wrap gap-2">
                <div
                  v-for="color in colorPresets"
                  :key="color.value"
                  class="color-picker"
                  :class="{ 'active': widgetForm.color === color.value }"
                  :style="{ backgroundColor: color.value }"
                  @click="widgetForm.color = color.value"
                >
                  <VIcon
                    v-if="widgetForm.color === color.value"
                    icon="tabler-check"
                    color="white"
                    size="20"
                  />
                </div>
              </div>
            </VCol>
          </VRow>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-6 justify-end gap-2">
          <VBtn
            variant="outlined"
            @click="showAddWidget = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="success"
            @click="handleSaveWidget"
          >
            <VIcon
              icon="tabler-check"
              start
            />
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
                prepend-inner-icon="tabler-text-size"
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
              cols="12"
              md="4"
            >
              <VTextField
                v-model.number="widgetForm.interval"
                label="Update Interval"
                suffix="minutes"
                type="number"
                min="1"
                prepend-inner-icon="tabler-clock"
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

            <VCol cols="12">
              <div class="text-subtitle-2 font-weight-medium mb-3">
                Primary Color
              </div>
              <div class="d-flex flex-wrap gap-2">
                <div
                  v-for="color in colorPresets"
                  :key="color.value"
                  class="color-picker"
                  :class="{ 'active': widgetForm.color === color.value }"
                  :style="{ backgroundColor: color.value }"
                  @click="widgetForm.color = color.value"
                >
                  <VIcon
                    v-if="widgetForm.color === color.value"
                    icon="tabler-check"
                    color="white"
                    size="20"
                  />
                </div>
              </div>
            </VCol>
          </VRow>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-6 justify-end gap-2">
          <VBtn
            variant="outlined"
            size="large"
            @click="showEditWidget = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="warning"
            size="large"
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
