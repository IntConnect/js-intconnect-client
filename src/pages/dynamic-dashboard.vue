<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '@/stores/dashboard'
import { GridLayout, GridItem } from 'grid-layout-plus'

const dashboardStore = useDashboardStore()
const { widgets, isEditing, showAddWidget, dataSources } = storeToRefs(dashboardStore)

// Chart types dan data sources
const chartTypes = [
  { value: 'bar', label: 'Bar Chart', icon: '📊' },
  { value: 'line', label: 'Line Chart', icon: '📈' },
  { value: 'area', label: 'Area Chart', icon: '📉' },
  { value: 'pie', label: 'Pie Chart', icon: '🥧' },
  { value: 'donut', label: 'Donut Chart', icon: '🍩' },
  { value: 'metric', label: 'Metric Card', icon: '📋' },
]

const availableDataSources = [
  { value: 'sales', label: 'Sales Data', icon: '💰' },
  { value: 'revenue', label: 'Revenue Data', icon: '💵' },
  { value: 'market', label: 'Market Share', icon: '📊' },
  { value: 'users', label: 'User Analytics', icon: '👥' },
  { value: 'metrics', label: 'Key Metrics', icon: '📈' },
]

// Form untuk widget baru
const newWidget = ref({
  type: 'bar',
  title: '',
  dataSource: 'sales',
  w: 6,
  h: 4,
})

// Import file reference
const fileInput = ref(null)

// Dialog visibility
const isAddWidgetDialogVisible = computed({
  get: () => showAddWidget.value,
  set: (val) => showAddWidget.value = val,
})

// Initialize dashboard
onMounted(() => {
  dashboardStore.initializeDashboard()
})

// Get chart options untuk ApexCharts
const getChartOptions = (widget) => {
  const data = dashboardStore.getDataSource(widget.dataSource)

  const baseOptions = {
    chart: {
      toolbar: { show: false },
      animations: { enabled: true },
    },
    theme: {
      mode: 'light',
      palette: 'palette1',
    },
    dataLabels: { enabled: false },
  }

  switch (widget.type) {
  case 'bar':
    return {
      ...baseOptions,
      chart: { ...baseOptions.chart, type: 'bar' },
      plotOptions: {
        bar: {
          borderRadius: 8,
          columnWidth: '60%',
          distributed: false,
        },
      },
      xaxis: { categories: data.categories },
      colors: ['#3b82f6'],
    }

  case 'line':
    return {
      ...baseOptions,
      chart: { ...baseOptions.chart, type: 'line' },
      stroke: { curve: 'smooth', width: 3 },
      xaxis: { categories: data.categories },
      colors: ['#10b981'],
      markers: { size: 5 },
    }

  case 'area':
    return {
      ...baseOptions,
      chart: { ...baseOptions.chart, type: 'area' },
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
        },
      },
      xaxis: { categories: data.categories },
      colors: ['#8b5cf6'],
    }

  case 'pie':
  case 'donut':
    return {
      ...baseOptions,
      chart: { ...baseOptions.chart, type: widget.type },
      labels: data.labels,
      legend: { position: 'bottom' },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    }

  default:
    return baseOptions
  }
}

// Get series data
const getChartSeries = (widget) => {
  const data = dashboardStore.getDataSource(widget.dataSource)

  if (widget.type === 'pie' || widget.type === 'donut') {
    return data.series
  }

  return data.series || []
}

// Handle add widget
const handleAddWidget = () => {
  if (!newWidget.value.title.trim()) {
    alert('Please enter widget title')
    return
  }

  dashboardStore.addWidget(newWidget.value)

  // Reset form
  newWidget.value = {
    type: 'bar',
    title: '',
    dataSource: 'sales',
    w: 6,
    h: 4,
  }
}

// Handle export
const handleExport = () => {
  dashboardStore.exportDashboard()
}

// Handle import
const handleImportClick = () => {
  fileInput.value?.click()
}

const handleImport = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const success = dashboardStore.importDashboard(e.target?.result)
    if (success) {
      alert('Dashboard imported successfully!')
    } else {
      alert('Failed to import dashboard')
    }
  }
  reader.readAsText(file)

  // Reset input
  event.target.value = ''
}

// Handle layout change
const handleLayoutUpdate = (newLayout) => {
  dashboardStore.updateLayout(newLayout)
}
</script>

<template>
  <div>
    <!-- Toolbar -->
    <VCard class="mb-6">
      <VCardText>
        <div class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div>
            <h2 class="text-h4 mb-1">
              Dashboard Analytics
            </h2>
            <p class="text-body-2 text-medium-emphasis">
              Monitor your key metrics in real-time
            </p>
          </div>

          <div class="d-flex align-center gap-3 flex-wrap">
            <!-- Edit Mode Toggle -->
            <VBtn
              v-if="!isEditing"
              color="secondary"
              variant="outlined"
              @click="dashboardStore.toggleEditMode()"
            >
              <VIcon
                icon="tabler-edit"
                start
              />
              Edit Layout
            </VBtn>

            <!-- Edit Mode Actions -->
            <template v-if="isEditing">
              <VBtn
                color="primary"
                @click="showAddWidget = true"
              >
                <VIcon
                  icon="tabler-plus"
                  start
                />
                Add Widget
              </VBtn>

              <VBtn
                variant="outlined"
                color="secondary"
                @click="handleExport"
              >
                <VIcon
                  icon="tabler-download"
                  start
                />
                Export
              </VBtn>

              <VBtn
                variant="outlined"
                color="secondary"
                @click="handleImportClick"
              >
                <VIcon
                  icon="tabler-upload"
                  start
                />
                Import
              </VBtn>
              <input
                ref="fileInput"
                type="file"
                accept=".json"
                class="d-none"
                @change="handleImport"
              />

              <VBtn
                variant="outlined"
                color="warning"
                @click="dashboardStore.resetDashboard()"
              >
                <VIcon
                  icon="tabler-refresh"
                  start
                />
                Reset
              </VBtn>

              <VBtn
                color="success"
                @click="dashboardStore.saveLayout()"
              >
                <VIcon
                  icon="tabler-device-floppy"
                  start
                />
                Save
              </VBtn>

              <VBtn
                variant="outlined"
                @click="dashboardStore.toggleEditMode()"
              >
                <VIcon
                  icon="tabler-x"
                  start
                />
                Cancel
              </VBtn>
            </template>
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Add Widget Dialog -->
    <VDialog
      v-model="isAddWidgetDialogVisible"
      :width="$vuetify.display.smAndDown ? 'auto' : 900"
    >
      <!-- Dialog close btn -->
      <VBtn
        icon
        variant="text"
        size="small"
        color="medium-emphasis"
        class="dialog-close-btn"
        @click="isAddWidgetDialogVisible"
      >
        <VIcon icon="tabler-x"/>
      </VBtn>
      <VCard class="pa-2 pa-sm-10">
        <VCardText>
          <h4 class="text-h4 text-center mb-2">
            Add New Widget
          </h4>
          <p class="text-body-1 text-center mb-6">
            Configure your dashboard widget
          </p>

          <!-- Widget Title -->
          <VTextField
            v-model="newWidget.title"
            label="Widget Title"
            placeholder="e.g., Sales Performance"
            class="mb-4"
          />

          <!-- Chart Type -->
          <div class="mb-6">
            <label class="text-subtitle-1 font-weight-medium mb-3 d-block">
              Chart Type
            </label>
            <div class="d-flex flex-wrap ga-3">
              <VChip
                v-for="type in chartTypes"
                :key="type.value"
                :color="newWidget.type === type.value ? 'primary' : 'default'"
                :variant="newWidget.type === type.value ? 'elevated' : 'outlined'"
                class="cursor-pointer"
                @click="newWidget.type = type.value"
              >
                <span class="me-2">{{ type.icon }}</span>
                {{ type.label }}
              </VChip>
            </div>
          </div>

          <!-- Data Source -->
          <div class="mb-6">
            <label class="text-subtitle-1 font-weight-medium mb-3 d-block">
              Data Source
            </label>
            <div class="d-flex flex-wrap ga-3">
              <VChip
                v-for="source in availableDataSources"
                :key="source.value"
                :color="newWidget.dataSource === source.value ? 'primary' : 'default'"
                :variant="newWidget.dataSource === source.value ? 'elevated' : 'outlined'"
                class="cursor-pointer"
                @click="newWidget.dataSource = source.value"
              >
                <span class="me-2">{{ source.icon }}</span>
                {{ source.label }}
              </VChip>
            </div>
          </div>

          <!-- Size Options -->
          <VRow>
            <VCol cols="6">
              <VTextField
                v-model.number="newWidget.w"
                label="Width (columns)"
                type="number"
                :min="2"
                :max="12"
              />
            </VCol>
            <VCol cols="6">
              <VTextField
                v-model.number="newWidget.h"
                label="Height (rows)"
                type="number"
                :min="2"
                :max="12"
              />
            </VCol>
          </VRow>

          <!-- Actions -->
          <div class="d-flex gap-3 mt-6">
            <VBtn
              color="primary"
              class="flex-grow-1"
              @click="handleAddWidget"
            >
              Add Widget
            </VBtn>
            <VBtn
              variant="outlined"
              color="secondary"
              @click="isAddWidgetDialogVisible = false"
            >
              Cancel
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Dashboard Grid -->
    <div class="max-w-[1920px] mx-auto p-6">
      <GridLayout
        v-model:layout="widgets"
        :col-num="12"
        :row-height="30"
        :is-draggable="isEditing"
        :is-resizable="isEditing"
        :vertical-compact="true"
        :use-css-transforms="true"
        :margin="[16, 16]"
        @layout-updated="handleLayoutUpdate"
      >
        <GridItem
          v-for="widget in widgets"
          :key="widget.i"
          :x="widget.x"
          :y="widget.y"
          :w="widget.w"
          :h="widget.h"
          :i="widget.i"
          class="transition-all"
        >
          <div
            class="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow"
          >
            <!-- Widget Header -->
            <div
              class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white"
            >
              <div class="flex items-center gap-3">
                <div class="w-2 h-8 bg-blue-500 rounded-full"></div>
                <div>
                  <h3 class="font-semibold text-gray-900">{{ widget.title }}</h3>
                  <p class="text-xs text-gray-500 mt-0.5">{{ widget.type }} chart</p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button
                  v-if="isEditing"
                  @click="dashboardStore.removeWidget(widget.i)"
                  class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove widget"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Widget Content -->
            <div class="flex-1 p-6 overflow-auto">
              <!-- Charts -->
              <div v-if="widget.type !== 'metric'" class="h-full">
                <VueApexCharts
                  :type="widget.type === 'donut' ? 'donut' : widget.type === 'pie' ? 'pie' : widget.type"
                  :options="getChartOptions(widget)"
                  :series="getChartSeries(widget)"
                  height="100%"
                />
              </div>

              <!-- Metric Cards -->
              <div v-else class="grid grid-cols-2 gap-4 h-full auto-rows-fr">
                <div
                  v-for="(value, key) in dashboardStore.getDataSource(widget.dataSource)"
                  :key="key"
                  class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div class="text-xs font-semibold uppercase tracking-wide opacity-90 mb-2">
                    {{ key.replace(/_/g, ' ') }}
                  </div>
                  <div class="text-3xl font-bold">
                    {{ typeof value === 'number' ? value.toLocaleString() : value }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GridItem>
      </GridLayout>

      <!-- Empty State -->
      <div v-if="widgets.length === 0" class="text-center py-20">
        <div class="text-6xl mb-4">📊</div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No Widgets Yet</h3>
        <p class="text-gray-500 mb-6">Start building your dashboard by adding widgets</p>
        <button
          @click="dashboardStore.loadDefaultLayout(); dashboardStore.saveLayout()"
          class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Load Default Layout
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Grid item styling untuk mode edit */
.vue-grid-item.vue-grid-placeholder {
  background: rgb(59 130 246 / 0.2) !important;
  border: 2px dashed rgb(59 130 246) !important;
  border-radius: 12px;
}

.vue-grid-item.resizing {
  opacity: 0.9;
  z-index: 100;
}

.vue-grid-item.dragging {
  transition: none !important;
  z-index: 100;
}

.vue-grid-item > .vue-resizable-handle {
  opacity: 0;
  transition: opacity 0.2s;
}

.vue-grid-item:hover > .vue-resizable-handle {
  opacity: 1;
}

.dialog-close-btn {
  position: absolute;
  inset-block-start: 12px;
  inset-inline-end: 12px;
  z-index: 1;
}
</style>
