<script setup>
/* ===============================
 * Imports
 * =============================== */
import { GridItem, GridLayout } from 'grid-layout-plus'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import EnergyLineChart from '@/components/dashboard/operation/EnergyLineChart.vue'
import GaugeChartWidget from '@/components/dashboard/operation/GaugeChartWidget.vue'
import RealtimeTable from '@/components/dashboard/operation/RealtimeTable.vue'
import StatsCard from '@/components/dashboard/operation/StatsCard.vue'
import UnmanageableAreaOverlay from '@/components/general/UnmanageableAreaOverlay.vue'

import { useManageDashboardWidget } from '@/composables/useManageDashboardWidget'
import { useManageMachine } from '@/composables/useManageMachine'

/* ===============================
 * Composables
 * =============================== */
const route = useRoute()
const router = useRouter()
const machineId = route.params.id

const { saveDashboardWidget } = useManageDashboardWidget()
const { machine, fetchMachine } = useManageMachine()

/* ===============================
 * Component Maps
 * =============================== */
const chartComponentMap = {
  gauge: GaugeChartWidget,
  line: EnergyLineChart,
  metric: StatsCard,
}

/* ===============================
 * Machine & Parameters

 * =============================== */
const processedMachine = computed(() => {
  return machine?.value?.entry ?? null
})

const modelConfigurationReady = computed(() => { return Boolean(processedMachine.value) })
const isDataReady = computed(() => { return (processedMachine.value !== null && availableParameters.value.length > 0) })

const availableParameters = computed(() => {
  if (!processedMachine.value) return []

  return processedMachine.value.mqtt_topic?.parameters ?? []
})

/**
 * Parameter state
 * - featuredParameterIds: baseline (tidak berubah)
 * - selectedParameters: state aktif (bisa berubah)
 */
const featuredParameterIds = ref([])
const selectedParameters = ref([])
const runningTimes = ref([])

/* Sync featured → selected on load */
watch(
  availableParameters,
  params => {
    if (!params.length) return

    const featured = params.filter(p => p.is_featured)


    const featuredFiltered = featured.map(p => p.id)

    featuredParameterIds.value = [...featuredFiltered]
    selectedParameters.value = [...featuredFiltered]
    runningTimes.value = featured
  },
  { immediate: true },
)


watch(processedMachine, () => {
  if (!processedMachine.value) return null

  const widgetConfig = processedMachine.value?.widgets?.map(row => ({
    i: row.code,
    id: row.id,
    x: row.layout.x,
    y: row.layout.y,
    w: row.layout.w,
    h: row.layout.h,
    ...row.config,
    dataSourceIds: Array.isArray(row.config.dataSourceIds)
      ? row.config.dataSourceIds
      : [row.config.dataSourceIds],
  })) || []


  localStorage.setItem(STORAGE_KEY, JSON.stringify(widgetConfig))
})


/* Helper */
const getParameterById = id =>
  availableParameters.value.find(p => p.id === id)

/* ===============================
 * Processed Parameters (UI)
 * =============================== */
const processedParameters = computed(() =>
  availableParameters.value.map(p => ({
    id: p.id,
    title: p.name,
    code: p.code,
    unit: p.unit,
    is_featured: p.is_featured,
    value: p.id,
  })),
)

/* ===============================
 * Machine State (Cards)
 * =============================== */
const machineState = computed(() => {
  if (!processedMachine.value) return null

  return {
    id: processedMachine.value.id,
    name: processedMachine.value.name,
    status: 'on',
    totalRuntime: '1,245h 30m',
  }
})

/* ===============================
 * Layout Persistence
 * =============================== */
const STORAGE_KEY = `dashboard_layout_machine_${machineId}`
const layout = ref([])
const baselineLayout = ref([])

const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)

      layout.value = parsed
      baselineLayout.value = JSON.parse(JSON.stringify(parsed)) // deep copy
    }
  } catch (err) {
    console.error('Load layout failed:', err)
  }
}

const saveIntoStorage = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout.value))
  } catch (err) {
    console.error('Save layout failed:', err)
  }
}

/* ===============================
 * Widget Dialog State
 * =============================== */
const showAddWidget = ref(false)
const showEditWidget = ref(false)
const selectedWidget = ref(null)

const widgetForm = ref({
  type: 'line',
  title: '',
  subtitle: '',
  dataSourceIds: [],
  w: 6,
  h: 5,
  color: '#10b981',
})

const isAddMode = computed(() => !selectedWidget.value)

/* ===============================
 * Chart Types
 * =============================== */
const chartTypes = [
  { value: 'line', label: 'Line Chart', icon: 'tabler-chart-line', color: 'success' },
  { value: 'bar', label: 'Bar Chart', icon: 'tabler-chart-bar', color: 'info' },
  { value: 'gauge', label: 'Gauge Chart', icon: 'tabler-gauge', color: 'warning' },
  { value: 'metric', label: 'Metric Card', icon: 'tabler-numbers', color: 'primary' },
]

/* ===============================
 * Chart Props Map
 * =============================== */
const chartPropsMap = {
  line: widget => ({
    title: widget.title,
    realtimeData: widget.dataSourceIds.map(id => {
      const p = getParameterById(id)
      const now = Date.now()
      return {
        name: p?.name,
        data: [
          { x: now - 2000, y: 10 },
          { x: now - 1000, y: 11 },
          { x: now, y: 12 },
        ]
      }
    }),
  }),
  metric: widget => ({
    title: widget.title,
    subtitle: widget.subtitle,
    value: '100',
    unit: 'N/A',
  }),
}

/* ===============================
 * Widget Handlers
 * =============================== */
const handleOpenDialog = widget => {
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
  if (!widgetForm.value.title.trim()) return alert('Title required')
  if (!widgetForm.value.dataSourceIds.length)
    return alert('Select at least one parameter')

  if (isAddMode.value) {
    layout.value.push({
      ...widgetForm.value,
      i: `widget_${Date.now()}`,
      x: (layout.value.length * 6) % 12,
      y: Math.floor(layout.value.length / 2) * 5,
    })
  } else {
    let oldIdx = baselineLayout.value.findIndex(w => w.i === selectedWidget.value.i)
    if (oldIdx !== -1)
      layout.value[oldIdx] = { ...layout.value[oldIdx], ...widgetForm.value }

    let idx = editedWidgets.value.findIndex(w => w.i == selectedWidget.value.i)
    if (idx === -1) {
      editedWidgets.value.push({
        ...baselineLayout.value[idx], ...widgetForm.value
      })
    } else {
      editedWidgets.value[idx] = {
        ...editedWidgets.value[idx], ...widgetForm.value
      }
    }
  }

  saveIntoStorage()
  showAddWidget.value = false
  showEditWidget.value = false
  selectedWidget.value = null
}

const handleRemoveWidget = id => {
  if (!confirm('Remove widget?')) return
  layout.value = layout.value.filter(w => w.i !== id)
  saveIntoStorage()
}

const handleLayoutUpdate = newLayout => {
  const edited = []
  newLayout.forEach(newItem => {
    const baselineItem = baselineLayout.value.find(
      b => b.i === newItem.i,
    )


    if (isLayoutChanged(baselineItem, newItem)) {
      console.error("Edited !!!!")
      edited.push({
        id: baselineItem.id,
        i: newItem.i,
        layout: {
          x: newItem.x,
          y: newItem.y,
          w: newItem.w,
          h: newItem.h,
        },
        config: {
          type: selectedWidget.type,
          title: selectedWidget.title,
          subtitle: selectedWidget.subtitle,
          dataSourceIds: selectedWidget.dataSourceIds,
          color: selectedWidget.color,
        }
      })
    }
    editedWidgets.value = edited
    layout.value = newLayout

    saveIntoStorage()
  })

}

const isLayoutChanged = (oldItem, newItem) => {
  return (
    oldItem.x !== newItem.x ||
    oldItem.y !== newItem.y ||
    oldItem.w !== newItem.w ||
    oldItem.h !== newItem.h
  )
}

/* ===============================
 * Parameter Selection (Cards)
 * =============================== */
const handleAddParameter = id => {
  if (!selectedParameters.value.includes(id)) {
    selectedParameters.value.push(id)

    const parameter = getParameterById(id)

    runningTimes.value.push(parameter)
  }
}

const handleRemoveParameter = parameterId => {
  const index = selectedParameters.value.findIndex(p => p === parameterId)
  const indexRunningTime = runningTimes.value.findIndex(p => p === parameterId)

  if (index !== -1) {
    selectedParameters.value.splice(index, 1)
    runningTimes.value.splice(indexRunningTime, 1)

  }
}

/* ===============================
 * Persist Dashboard
 * =============================== */
const handleStoreWidget = () => {
  console.log(editedWidgets.value)
  return
  saveDashboardWidget({
    machine_id: machineId,
    added_parameter_ids: addedParameterIds.value,
    removed_parameter_ids: removedParameterIds.value,
    edited_widgets: editedWidgets.value,
    added_widgets: addedWidgets.value?.map(addedWidget => {
      return {
        code: addedWidget.i,
        layout: {
          x: addedWidget.x,
          y: addedWidget.y,
          w: addedWidget.w,
          h: addedWidget.h,
        },
        config: {
          type: addedWidget.type,
          title: addedWidget.title,
          subtitle: addedWidget.subtitle,
          dataSourceIds: addedWidget.dataSourceIds,
          color: addedWidget.color,
        },
      }
    }),
    removed_widgets: removedWidgets.value.map(removedWidget => {
      return removedWidget.i
    }),
  })
}

/* ===============================
 * Lifecycle
 * =============================== */
onMounted(async () => {
  await fetchMachine(machineId)
  loadFromStorage()
  await nextTick()
})

const addedParameterIds = computed(() => {
  return selectedParameters.value.filter(
    id => !featuredParameterIds.value.includes(id),
  )
})

const removedParameterIds = computed(() => {
  return featuredParameterIds.value.filter(
    id => !selectedParameters.value.includes(id),
  )
})

const addedWidgets = computed(() => {
  return layout.value.filter(
    w => !baselineLayout.value.some(b => b.i === w.i),
  )
})

const removedWidgets = computed(() => {
  return baselineLayout.value.filter(
    b => !layout.value.some(w => w.i === b.i),
  )
})

const editedWidgets = ref([])

const handleDragStart = (i) => {
  selectedWidget.value = baselineLayout.value.find(
    w => w.i === i
  )
}

const handleResizeStart = (i) => {
  selectedWidget.value = baselineLayout.value.find(
    w => w.i === i
  )
}
</script>


<template>
  <div>
    <VRow>
      <VCol cols="12" md="12" sm="12">
        <VCard class="mb-6">
          <VCardText>
            <div class="d-flex align-center justify-space-between flex-wrap gap-4">
              <div>
                <h2 class="text-h4 font-weight-bold text-white mb-1">
                  Dashboard Manager
                </h2>

                <div class="d-flex align-center gap-2 text-grey-lighten-1">
                  <VIcon icon="tabler-device-analytics" size="18" />
                  <span class="text-subtitle-1 font-weight-medium">
                    Machine {{ processedMachine?.name }}
                  </span>
                </div>

                <p class="text-subtitle-2 text-grey-lighten-2 mt-1 mb-0">
                  Configure and monitor real-time machine performance through customizable charts
                </p>
              </div>



              <div class="d-flex align-center gap-3 flex-wrap">
                <VBtn color="success" @click="handleStoreWidget">
                  <VIcon icon="tabler-device-floppy" start />
                  Store Chart
                </VBtn>

                <VBtn color="info" @click="handleOpenDialog(null)">
                  <VIcon icon="tabler-plus" start />
                  Add Chart
                </VBtn>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
    <VRow no-gutters>
      <VCol cols="12">
        <VAlert class="" closable type="warning">
          Data in this page only sample
        </VAlert>
      </VCol>
    </VRow>
    <VRow style="min-height: 520px" class="match-height">
      <!-- LEFT -->
      <VCol cols="12" lg="6" md="6" class="d-flex flex-column">
        <UnmanageableAreaOverlay message="3D Model Viewer">
          <ThreeModelViewer v-if="modelConfigurationReady" class="flex-grow-1"
            :model-path="processedMachine?.model_path" />
        </UnmanageableAreaOverlay>
      </VCol>
      <!-- RIGHT -->
      <VCol cols="6" md="6" sm="6" class="d-flex flex-column">
        <VRow class="match-height flex-grow-1">
          <VCol cols="12" class="py-3">
            <StateCards v-if="machineState !== null" :machine="machineState" :running-times="runningTimes ?? []"
              is-edit-mode :parameters="processedParameters" :selected-parameters="selectedParameters"
              @add-parameter="handleAddParameter" @remove-parameter="handleRemoveParameter" />
          </VCol>

          <VCol cols="12" class="py-3">
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

    <VCol cols="12" md="12" sm="12" class="pa-0">
      <div v-if="layout.length > 0" class="pa-0">
        <GridLayout v-model:layout="layout" :col-num="12" :row-height="30" is-draggable is-resizable vertical-compact
          use-css-transforms :margin="[16, 16]" :container-padding="[0, 0]" @layout-updated="handleLayoutUpdate">
          <GridItem v-for="widget in layout" :key="widget.i" :x="widget.x" :y="widget.y" :w="widget.w" :h="widget.h"
            :i="widget.i" class="grid-item-wrapper" @move="handleDragStart" @resize="handleResizeStart">
            <VCard class="h-100 widget-preview-card">
              <VCardText class="pa-4">
                <div class="d-flex align-center justify-space-between mb-3">
                  <div class="d-flex  align-center gap-2">
                    <VIcon :icon="chartTypes.find(t => t.value === widget.type)?.icon"
                      :color="chartTypes.find(t => t.value === widget.type)?.color" size="25" />
                    <div class="d-flex flex-row gap-3 align-center">
                      <div class="text-subtitle-2 font-weight-bold">
                        {{ widget.title }}
                      </div>

                      <div class="text-body-2 text-grey">
                        {{chartTypes.find(t => t.value === widget.type)?.label}}
                      </div>
                    </div>
                  </div>

                  <div class="d-flex gap-1">
                    <VBtn icon size="small" variant="text" @click="handleOpenDialog(widget)">
                      <VIcon icon="tabler-edit" size="18" />
                    </VBtn>
                    <VBtn icon size="small" variant="text" color="error" @click="handleRemoveWidget(widget.i)">
                      <VIcon icon="tabler-trash" size="18" />
                    </VBtn>
                  </div>
                </div>

                <VDivider class="mb-3" />

                <div class="preview-content text-center">
                  <component :is="chartComponentMap[widget.type]" v-if="isDataReady"
                    v-bind="chartPropsMap[widget.type](widget)" />

                  <div v-else class="text-caption text-grey">
                    Loading data...
                  </div>
                </div>
              </VCardText>
            </VCard>
          </GridItem>
        </GridLayout>
      </div>
      <VCard v-else class="empty-state-card text-center py-16 mt-5">
        <VCardText>
          <div class="mb-4">
            <VAvatar color="success" variant="tonal" size="120">
              <VIcon icon="tabler-chart-dots" size="64" />
            </VAvatar>
          </div>
          <h3 class="text-h4 font-weight-bold mb-2">
            No Charts Configured
          </h3>
          <p class="text-body-1 text-grey mb-6">
            Start building your dashboard by adding your first monitoring chart
          </p>
          <VBtn color="success" @click="handleOpenDialog(null)">
            <VIcon icon="tabler-plus" start />
            Add First Chart
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
    <!-- Empty State -->

    <!-- Add/Edit Widget Dialog -->
    <VDialog v-model="showAddWidget" max-width="800" scrollable>
      <VCard class="dialog-card">
        <VCardTitle class="dialog-header d-flex align-center justify-space-between pa-6">
          <div class="d-flex align-center gap-3">
            <VAvatar color="success" variant="tonal" size="40">
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
          <VBtn icon variant="text" @click="showAddWidget = false">
            <VIcon icon="tabler-x" />
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <VRow>
            <!-- Chart Type Selection -->
            <VCol cols="12">
              <div class="text-subtitle-1 font-weight-bold mb-3">
                <VIcon icon="tabler-chart-dots" size="18" class="me-2" />
                Select Chart Type
              </div>
              <div class="chart-type-grid">
                <VCard v-for="type in chartTypes" :key="type.value" class="chart-type-card"
                  :class="{ 'active': widgetForm.type === type.value }" @click="() => {
                    widgetForm.type = type.value
                    widgetForm.dataSourceIds = []
                  }">
                  <VCardText class="text-center pa-4">
                    <VAvatar :color="type.color" variant="tonal" size="48" class="mb-3">
                      <VIcon :icon="type.icon" size="28" />
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
              <VTextField v-model="widgetForm.title" label="Chart Title" placeholder="e.g., Temperature Monitoring"
                prepend-inner-icon="tabler-text-size" variant="outlined" />
            </VCol>

            <VCol cols="12">
              <VTextField v-model="widgetForm.subtitle" label="Chart Subtitle"
                placeholder="e.g., Real-time temperature data" prepend-inner-icon="tabler-text-caption"
                variant="outlined" />
            </VCol>

            <!-- Parameter Selection -->
            <VCol cols="12">
              <VSelect v-model="widgetForm.dataSourceIds" :items="availableParameters" item-title="name" item-value="id"
                label="Select Parameters" placeholder="Choose parameters to monitor"
                :multiple="widgetForm.type !== 'metric' && widgetForm.type !== 'gauge'"
                :chips="widgetForm.type !== 'metric' && widgetForm.type !== 'gauge'"
                :closable-chips="widgetForm.type !== 'metric' && widgetForm.type !== 'gauge'"
                prepend-inner-icon="tabler-binary-tree-2" variant="outlined">
                <template #chip="{ item, props }">
                  <VChip v-bind="props" size="small" color="success">
                    <VIcon v-if="item.raw.is_watch" icon="tabler-eye" size="14" start />
                    {{ item.title }}
                  </VChip>
                </template>
                <template #item="{ item, props }">
                  <VListItem v-bind="props" :title="item.raw.name">
                    <template #prepend>
                      <VAvatar :color="item.raw.is_watch ? 'success' : 'secondary'" size="32" variant="tonal">
                        <VIcon :icon="item.raw.is_watch ? 'tabler-eye' : 'tabler-binary-tree-2'" size="18" />
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


            <VCol cols="6" md="6">
              <VTextField v-model.number="widgetForm.w" label="Width" suffix="columns" type="number" min="2" max="12"
                prepend-inner-icon="tabler-layout-columns" variant="outlined" />
            </VCol>

            <VCol cols="6" md="6">
              <VTextField v-model.number="widgetForm.h" label="Height" suffix="rows" type="number" min="2" max="12"
                prepend-inner-icon="tabler-layout-rows" variant="outlined" />
            </VCol>
          </VRow>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-6 justify-end gap-2">
          <VBtn variant="tonal" color="error" @click="showAddWidget = false">
            Cancel
          </VBtn>
          <VBtn variant="flat" color="success" @click="handleSaveWidget()">
            Add Chart
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Edit Widget Dialog (same structure) -->
    <VDialog v-model="showEditWidget" max-width="800" scrollable>
      <VCard class="dialog-card">
        <VCardTitle class="dialog-header d-flex align-center justify-space-between pa-6">
          <div class="d-flex align-center gap-3">
            <VAvatar color="warning" variant="tonal" size="40">
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
          <VBtn icon variant="text" @click="showEditWidget = false">
            <VIcon icon="tabler-x" />
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <VRow>
            <VCol cols="12">
              <div class="text-subtitle-1 font-weight-bold mb-3">
                <VIcon icon="tabler-chart-dots" size="18" class="me-2" />
                Chart Type
              </div>
              <div class="chart-type-grid">
                <VCard v-for="type in chartTypes" :key="type.value" class="chart-type-card"
                  :class="{ 'active': widgetForm.type === type.value }" @click="widgetForm.type = type.value">
                  <VCardText class="text-center pa-4">
                    <VAvatar :color="type.color" variant="tonal" size="48" class="mb-3">
                      <VIcon :icon="type.icon" size="28" />
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
              <VTextField v-model="widgetForm.title" label="Chart Title" prepend-inner-icon="tabler-text"
                variant="outlined" />
            </VCol>

            <VCol cols="12">
              <VTextField v-model="widgetForm.subtitle" label="Chart Subtitle" prepend-inner-icon="tabler-text-caption"
                variant="outlined" />
            </VCol>

            <VCol cols="12">
              <VSelect v-model="widgetForm.dataSourceIds" :items="availableParameters" item-title="name" item-value="id"
                label="Select Parameters" multiple chips closable-chips prepend-inner-icon="tabler-binary-tree-2"
                variant="outlined" />
            </VCol>



            <VCol cols="6" md="4">
              <VTextField v-model.number="widgetForm.w" label="Width" type="number" min="2" max="12"
                prepend-inner-icon="tabler-layout-columns" variant="outlined" />
            </VCol>

            <VCol cols="6" md="4">
              <VTextField v-model.number="widgetForm.h" label="Height" type="number" min="2" max="12"
                prepend-inner-icon="tabler-layout-rows" variant="outlined" />
            </VCol>
          </VRow>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-6 justify-end gap-2">
          <VBtn variant="outlined" color="error" @click="showEditWidget = false">
            Cancel
          </VBtn>
          <VBtn color="primary" @click="handleSaveWidget">
            <VIcon icon="tabler-check" start />
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
