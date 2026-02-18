<script setup>
import EnergyLineChart from '@/components/dashboard/operation/EnergyLineChart.vue'
import GaugeChartWidget from '@/components/dashboard/operation/GaugeChartWidget.vue'
import RealtimeTable from '@/components/dashboard/operation/RealtimeTable.vue'
import StatsCard from '@/components/dashboard/operation/StatsCard.vue'
import { useManageAlarmLog } from '@/composables/useManageAlarmLog'
import { useManageDashboardWidget } from '@/composables/useManageDashboardWidget'
import { useConfigStore } from '@core/stores/config'
import { GridItem, GridLayout } from 'grid-layout-plus'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useTheme } from 'vuetify'
import ThreeDimensionModelRenderer from '../ThreeDimensionModelRenderer.vue'
import RawBarChart from './RawBarChart.vue'

const props = defineProps({
  systemSetting: {
    type: Object,
    required: false,
    default: () => { },
  },
})

const {
  saveDashboardWidget,
} = useManageDashboardWidget()

const isRegisterDialogOpen = ref(false)
const selectedRegister = ref({})

const chartComponentMap = {
  gauge: GaugeChartWidget,
  line: EnergyLineChart,
  metric: StatsCard,
  bar: RawBarChart,
}

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
  getParameterById,
  getParameterOnlineStatusById,
  getValueByParameterId,
  getFormattedValueById,
  lastUpdate,
} = useMqttConnection()

const modelViewerRef = ref(null)

const handleRegisterClick = registerData => {
  isRegisterDialogOpen.value = true
  selectedRegister.value = registerData
}

const selectedParameterIds = ref([])
const interval = ref([])

const handleRegisterValueUpdate = value => {
  isRegisterDialogOpen.value =false
  manageRegisterValue(selectedRegister.value.id, {
    value: value,
  })
}

const {
  alarmLogs,
  fetchAlarmLogsByMachineId,
} = useManageAlarmLog()


const {
  registers,
  manageRegisterValue,
} = useManageRegister()

// Theme Detection
const configStore = useConfigStore()
const theme = useTheme()

const isDark = computed(() => {
  if (configStore.theme === 'system') {
    return theme.global.current.value.dark
  }
  
  return configStore.theme === 'dark'
})

// Dynamic colors berdasarkan theme
const overlayBgColor = computed(() => 
  isDark.value 
    ? 'rgba(211, 47, 47, 0.15)' 
    : 'rgba(211, 47, 47, 0.08)',
)

const cardBorderColor = computed(() =>
  isDark.value
    ? 'rgb(211, 47, 47)'
    : 'rgb(244, 67, 54)',
)

const alarmDetailsBg = computed(() =>
  isDark.value
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(0, 0, 0, 0.03)',
)

const tableHighlightBg = computed(() =>
  isDark.value
    ? 'rgba(211, 47, 47, 0.05)'
    : 'rgba(211, 47, 47, 0.03)',
)

// WebSocket Alarm Connection
const alarmSocket = ref(null)
const readyState = ref(0)
const alarms = ref([])
const showAlarmOverlay = ref(false)
const activeAlarm = ref(null)
const alarmAudio = ref(null)

// Initialize alarm audio
onMounted(() => {
  // Create alarm sound (beep)
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()

  const playAlarmSound = () => {
    if (!audioContext) return

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800 // Hz
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }

  alarmAudio.value = playAlarmSound
})

const connectAlarmWebSocket = () => {
  try {
    alarmSocket.value = new WebSocket('ws://localhost:8181/ws')

    alarmSocket.value.onopen = () => {
      readyState.value = alarmSocket.value.readyState // 1

    }

    alarmSocket.value.onmessage = event => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'CREATED') {
          const parameter = getParameterById(data.parameter_id)

          const newAlarm = {
            id: data.id,
            parameter_id: data.parameter_id,
            parameter_name: parameter?.name || 'Unknown Parameter',
            parameter_code: parameter?.code || '',
            value: data.value,
            unit: parameter?.unit || '',
            status: data.status,
            timestamp: data.timestamp,
            acknowledged: false,
          }
          
          processedAlarmLogs.value.push(newAlarm)

          // Add to alarms list
          alarms.value.unshift(newAlarm)

          // Show overlay notification if status is Open
          activeAlarm.value = newAlarm
          showAlarmOverlay.value = true

          // Play alarm sound
          if (alarmAudio.value) {
            alarmAudio.value()

            // Repeat sound 3 times
            setTimeout(() => alarmAudio.value?.(), 600)
            setTimeout(() => alarmAudio.value?.(), 1200)
            setTimeout(() => {
              showAlarmOverlay.value = false
            }, 3000)
          }
        }else{
          const indexOfUpdatedAlarmLog =  processedAlarmLogs.value.findIndex(alarmLog => alarmLog.parameter_id == data.parameter_id)

          processedAlarmLogs.value[indexOfUpdatedAlarmLog] = {
            ...processedAlarmLogs.value[indexOfUpdatedAlarmLog],
            value: data.value,
            timestamp: data.timestamp,
            status: data.status,
          }
        }
      } catch (error) {
        console.error('Error parsing alarm data:', error)
      }
    }

    alarmSocket.value.onerror = error => {
      console.error('Alarm WebSocket Error:', error)
      readyState.value = alarmSocket.value.readyState

    }

    alarmSocket.value.onclose = () => {

      // Reconnect after 5 seconds
      readyState.value = alarmSocket.value.readyState // 3

      setTimeout(() => {
        if (alarmSocket.value?.readyState === 3) { // 3 = CLOSED
          connectAlarmWebSocket()
        }
      }, 5000)
    }
  } catch (error) {
    console.error('Failed to connect alarm WebSocket:', error)
  }
}

const acknowledgeAlarm = alarmId => {
  const alarm = alarms.value.find(a => a.id === alarmId)
  if (alarm) {
    alarm.acknowledged = true
  }

  if (activeAlarm.value?.id === alarmId) {
    showAlarmOverlay.value = false
    activeAlarm.value = null
  }
}

const dismissAlarmOverlay = () => {
  showAlarmOverlay.value = false
  if (activeAlarm.value) {
    activeAlarm.value.acknowledged = true
  }
  activeAlarm.value = null
}

const getAlarmSeverityColor = status => {
  return status === 'Open' ? 'error' : 'warning'
}

const formatAlarmTime = timestamp => {
  const date = new Date(timestamp)
  
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const formatAlarmDate = timestamp => {
  const date = new Date(timestamp)
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const openAlarms = computed(() => {
  return alarms.value.filter(a => a.status === 'Open' && !a.acknowledged)
})

// Disconnect on unmount
onUnmounted(() => {
  disconnectMQTT()
  if (alarmSocket.value) {
    alarmSocket.value.close()
  }
})

// Filter running times
const runningTimes = ref([])

const realtimeData = ref([])

watch(
  mqttData,
  newVal => {
    let newData = []
    Object.entries(mqttData).forEach(([key, value]) => {
      newData.push({
        id: value.id,
        parameter: value.name,
        value: value.value,
        unit: value.unit,
        code: value.code,
      })
    })
    realtimeData.value = newData
    modelViewerRef.value.updateParameterMarkers(newData)

  },
  { deep: true },
)

const processedMachine = computed(() => {
  const rawProcessedMachine = machine.value.entry
  if (!rawProcessedMachine) return null


  if (rawProcessedMachine) {
    connectMQTT(rawProcessedMachine)
  }
    processedParameters.value = rawProcessedMachine.value?.mqtt_topic.parameters.map(parameter => {
    return {
      id: parameter.id,
      title: parameter.code,
    }
  })
  return rawProcessedMachine
})

const parameters = computed(() => {
  if (processedMachine.value == null) return []

  return processedMachine.value['mqtt_topic'].parameters
})

watch(parameters, () => {
  runningTimes.value = parameters.value.filter(parameter => parameter.is_featured)
})

const layout = ref([])

watch(
  processedMachine,
  machine => {
    if (!machine?.widgets) return
    layout.value = machine.widgets.map(row => ({
      i: row.code,
      x: row.layout.x,
      y: row.layout.y,
      w: row.layout.w,
      h: row.layout.h,
      ...row.config,
      dataSourceIds: Array.isArray(row.config.dataSourceIds)
        ? row.config.dataSourceIds
        : [row.config.dataSourceIds],
    }))
  },
  { immediate: true },
)

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

const processedAlarmLogs = ref([])
const processedParameters = ref([])

onMounted(async () => {
  let machineId = props.systemSetting.entry.value.machine_id
  let actionResult = await fetchMachine(machineId, true)
  let actionAlarmLogResult = await fetchAlarmLogsByMachineId(machineId, true)
  await nextTick()
  processedAlarmLogs.value = alarmLogs.value.entries?.map(alarmLog => {
    const parameter = getParameterById(alarmLog.parameter_id)
    
    return {
      id: alarmLog.id,
      parameter_id: alarmLog.parameter_id,
      parameter_name: parameter?.name || 'Unknown Parameter',
      parameter_code: parameter?.code || '',
      value: alarmLog.value,
      unit: parameter?.unit || '',
      status: alarmLog.status,
      timestamp: alarmLog.created_at,
      acknowledged: false,
    }
  }) ?? []


  // Connect to alarm WebSocket
  connectAlarmWebSocket()
})

const lineSeriesStore = ref({})

watch(
  mqttData,
  newVal => {

    const now = Date.now()

    Object.values(newVal).forEach(param => {
      if (!param?.code) return

      if (!lineSeriesStore.value[param.code]) {
        lineSeriesStore.value[param.code] = []
      }

      const series = lineSeriesStore.value[param.code]

      // Sliding window
      if (series.length >= 20) {
        series.shift()
      }

      series.push({
        x: now,          // timestamp (ms)
        y: param.value,  // numeric value
      })

      runningTimes.value.forEach(item => {
        const mqttParam = newVal[item.code]
        if (!mqttParam) return

        // update VALUE SAJA
        item.value = `${Number(mqttParam.value).toFixed(2)} ${mqttParam.unit ?? item.unit ?? ''}`
      })
    })

  },
  { deep: true },
)


// Helper untuk generate props per widget - DIBUAT COMPUTED
const getWidgetProps = computed(() => {
  // Force reactivity dengan mengakses mqttData
  const mqttSnapshot = { ...mqttData }

  return widget => {
    if (widget.type === 'line') {
      return {
        title: widget.title,
        realtimeData: widget.dataSourceIds.map(id => {
          const p = getParameterById(id)
          if (!p) return null

          return {
            name: p.name,
            data: lineSeriesStore.value[p.code] ?? [],
          }
        }),
      }
    }

    if (widget.type === 'metric') {
      const dataSourceId = widget.dataSourceIds[0]
      const formattedValue = getFormattedValueById(dataSourceId)
      const parameter = getParameterById(dataSourceId)
      return {
        title: widget.title,
        subtitle: parameter.name,
        badge: "",
        value: formattedValue.value || '-',
        icon: widget.icon || "tabler-snowflake",
        percentage: "10",
        unit: formattedValue.unit || '',
        badge: getParameterOnlineStatusById(parameter.id)
      }
    }

    if (widget.type === 'gauge') {
      const dataSourceId = widget.dataSourceIds[0]
      const formattedValue = getFormattedValueById(dataSourceId)
      const parameter = getParameterById(dataSourceId)

      return {
        header: widget.title,
        subHeader: parameter.name,
        value: formattedValue.value || 0,
        unit: formattedValue.unit || '',
        min: widget.min || 0,
        max: widget.max || 100,
      }
    }

    if (widget.type === 'bar') {
      return {
        title: widget.title,
        subtitle: widget.subtitle,
        realtimeData: widget.dataSourceIds.map(id => {
          const p = getParameterById(id)
          if (!p) return null

          return {
            name: p.name,
            data: lineSeriesStore.value[p.code] ?? [],
          }
        }),
      }
    }

    return {}
  }
})

const gridMinHeight = computed(() => {
  if (!layout.value || layout.value.length === 0) return 'auto'

  // Cari posisi row terbawah (y + h maksimal)
  const maxRow = Math.max(
    ...layout.value.map(item => item.y + item.h),
  )

  const rowHeight = 20  // dari :row-height="30"
  const marginY = 16    // dari :margin="[16, 16]"

  // Total height = (jumlah row * (row height + margin)) + extra padding
  const totalHeight = (maxRow * (rowHeight + marginY))

  return `${totalHeight}px`
})
</script>

<template>
  <div>
    <!-- Alarm Overlay Notification -->
    <VOverlay 
      v-model="showAlarmOverlay" 
      class="alarm-overlay" 
      :class="{ 'light-theme': !isDark }"
      :style="{ backgroundColor: overlayBgColor }"
      :z-index="9999" 
      persistent
    >
      <div class="alarm-notification-container">
        <VCard 
          class="alarm-notification-card" 
          :class="{ 'light-theme-card': !isDark }"
          :style="{ borderColor: cardBorderColor }"
          elevation="24"
        >
          <VCardText class="pa-6">
            <div class="d-flex align-center mb-4">
              <VAvatar
                color="error"
                size="64"
                class="mr-4 alarm-icon-pulse"
              >
                <VIcon
                  icon="tabler-alert-triangle"
                  size="40"
                />
              </VAvatar>
              <div class="flex-grow-1">
                <div class="text-h5 font-weight-bold text-error mb-1">
                  ⚠️ ALARM TRIGGERED
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  Immediate attention required
                </div>
              </div>
            </div>

            <VDivider class="my-4" />

            <div 
              v-if="activeAlarm" 
              class="alarm-details"
              :style="{ backgroundColor: alarmDetailsBg }"
            >
              <VRow dense>
                <VCol
                  cols="12"
                  class="mb-2"
                >
                  <div class="text-caption text-medium-emphasis">
                    Parameter
                  </div>
                  <div class="text-h6 font-weight-medium">
                    {{ activeAlarm.parameter_name }}
                  </div>
                </VCol>

                <VCol cols="6">
                  <div class="text-caption text-medium-emphasis">
                    Value
                  </div>
                  <div class="text-h5 text-error font-weight-bold">
                    {{ activeAlarm.value }} {{ activeAlarm.unit }}
                  </div>
                </VCol>

                <VCol cols="6">
                  <div class="text-caption text-medium-emphasis">
                    Status
                  </div>
                  <VChip
                    color="error"
                    size="small"
                    class="mt-1"
                  >
                    {{ activeAlarm.status }}
                  </VChip>
                </VCol>

                <VCol
                  cols="12"
                  class="mt-2"
                >
                  <div class="text-caption text-medium-emphasis">
                    Time
                  </div>
                  <div class="text-body-2">
                    {{ formatAlarmDate(activeAlarm.timestamp) }} at {{ formatAlarmTime(activeAlarm.timestamp) }}
                  </div>
                </VCol>
              </VRow>
            </div>

            <VDivider class="my-4" />
          </VCardText>
        </VCard>
      </div>
    </VOverlay>

<VRow class="match-height align-stretch">
      <!-- LEFT -->
      <VCol
        cols="12"
        lg="6"
        md="6"
        class="d-flex flex-column"
      >
        <ThreeDimensionModelRenderer
  
          v-if="processedMachine !== null"
          ref="modelViewerRef"
          :model-path="processedMachine.model_path"
                        
          :clickable="false"
                      
          :camera-position="{
            x: processedMachine.camera_x,
            y: processedMachine.camera_y,
            z: processedMachine.camera_z + 7
          }"
            class="flex-grow-1"
                style="min-height:500px;"            

          :parameters="processedMachine.parameters"
          :registers="processedMachine.registers"
          @register-click="handleRegisterClick"
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
          <VCol cols="12">
            <StateCards
              v-if="machineState !== null"
              :machine="machineState"
              :running-times="runningTimes"
              :is-edit-mode="false"
            />
            <RealtimeTable
              :realtime-data="realtimeData"
              :last-update="lastUpdate"
            />
          </VCol>
        </VRow>
      </VCol>
    </VRow>

    <!-- Alarms Section -->
    <VRow class="mt-4">
      <VCol cols="12">
        <VCard>
          <VCardTitle class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center">
              <VIcon
                icon="tabler-bell"
                class="mr-2"
                color="error"
              />
              <span class="text-h6">System Alarms</span>
              <VBadge
                v-if="openAlarms.length > 0"
                :content="openAlarms.length"
                color="error"
                class="ml-3"
              />
            </div>
            <VChip
              v-if="readyState === 1"
              color="success"
              size="small"
              variant="tonal"
            >
              <VIcon
                icon="tabler-wifi"
                size="16"
                class="mr-1"
              />
              Connected
            </VChip>

            <VChip
              v-else-if="readyState === 0"
              color="warning"
              size="small"
              variant="tonal"
            >
              <VIcon
                icon="tabler-loader"
                size="16"
                class="mr-1"
              />
              Connecting
            </VChip>

            <VChip
              v-else
              color="error"
              size="small"
              variant="tonal"
            >
              <VIcon
                icon="tabler-wifi-off"
                size="16"
                class="mr-1"
              />
              Disconnected
            </VChip>
          </VCardTitle>

          <VDivider />

          <VCardText class="pa-0">
            <div
              v-if="processedAlarmLogs.length === 0"
              class="text-center py-12"
            >
              <VAvatar
                color="success"
                variant="tonal"
                size="80"
                class="mb-4"
              >
                <VIcon
                  icon="tabler-check"
                  size="40"
                />
              </VAvatar>
              <div class="text-h6 text-medium-emphasis mb-2">
                No Alarms
              </div>
              <div class="text-body-2 text-disabled">
                System is operating normally
              </div>
            </div>

            <VTable
              v-else
              class="alarm-table mb-2"
            >
              <thead>
                <tr>
                  <th width="50" />
                  <th>Parameter</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                  <th width="120">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="alarm in processedAlarmLogs" 
                  :key="alarm.id"
                  :class="{ 
                    'alarm-open': alarm.status === 'Open' && !alarm.acknowledged,
                    'light-theme-row': !isDark 
                  }"
                  :style="
                    alarm.status === 'Open' && !alarm.acknowledged 
                      ? { backgroundColor: tableHighlightBg } 
                      : {}
                  "
                >
                  <td>
                    <VIcon
                      :icon="alarm.status === 'Open' ? 'tabler-alert-triangle' : 'tabler-alert-circle'"
                      :color="getAlarmSeverityColor(alarm.status)"
                      :class="{ 'alarm-icon-pulse': alarm.status === 'Open' && !alarm.acknowledged }"
                    />
                  </td>
                  <td>
                    <div class="font-weight-medium">
                      {{ alarm.parameter_name }}
                    </div>
                    <div class="text-caption text-disabled">
                      {{ alarm.parameter_code }}
                    </div>
                  </td>
                  <td>
                    <span
                      class="font-weight-bold"
                      :class="{ 'text-error': alarm.status === 'Open' }"
                    >
                      {{ alarm.value }} {{ alarm.unit }}
                    </span>
                  </td>
                  <td>
                    <VChip
                      :color="getAlarmSeverityColor(alarm.status)"
                      size="small"
                      :variant="alarm.acknowledged ? 'tonal' : 'flat'"
                    >
                      {{ alarm.status }}
                    </VChip>
                  </td>
                  <td>
                    <div class="text-body-2">
                      {{ formatAlarmDate(alarm.timestamp) }}
                    </div>
                    <div class="text-caption text-disabled">
                      {{ formatAlarmTime(alarm.timestamp) }}
                    </div>
                  </td>
                  <td>
                    <VBtn
                      v-if="!alarm.acknowledged && alarm.status === 'Open'"
                      size="small"
                      color="error"
                      variant="tonal"
                      @click="acknowledgeAlarm(alarm.id)"
                    >
                      <VIcon
                        icon="tabler-check"
                        size="18"
                        class="mr-1"
                      />
                      ACK
                    </VBtn>
                    <VChip
                      v-else
                      size="small"
                      color="success"
                      variant="tonal"
                    >
                      <VIcon
                        icon="tabler-check"
                        size="16"
                        class="mr-1"
                      />
                      Acknowledged
                    </VChip>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow>
      <VCol
        cols="12"
        md="12"
        sm="12"
        class="pa-0 mb-5"
      >
        <div
          v-if="layout.length > 0"
          :style="{ minHeight: gridMinHeight }"
        >
          <GridLayout
            v-model:layout="layout"
            :col-num="12"
            :row-height="20"
            :is-resizable="false"
            :is-draggable="false"
            vertical-compact
            use-css-transforms
            :margin="[16, 16]"
            :container-padding="[0, 0]"
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
                  v-if="isDataReady && chartComponentMap[widget.type]"
                  v-bind="getWidgetProps(widget)"
                 
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
  <ManageRegisterValueDialog
    v-model:is-dialog-visible="isRegisterDialogOpen"

    :register="selectedRegister"
    @submit:value="handleRegisterValueUpdate"
  />
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
  overflow: visible;
  padding-top: 4px;
  padding-bottom: 4px;
}

.chart-container {
  height: 100%;
  width: 100%;
}

/* Alarm Styles */
.alarm-overlay {
  backdrop-filter: blur(4px);
  transition: background-color 0.3s ease;
}

.alarm-overlay.light-theme {
  backdrop-filter: blur(2px);
}

.alarm-notification-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 24px;
}

.alarm-notification-card {
  max-width: 600px;
  width: 100%;
  border: 3px solid rgb(211, 47, 47) !important;
  animation: alarm-card-pulse 2s ease-in-out infinite;
  transition: all 0.3s ease;
}

.alarm-notification-card.light-theme-card {
  animation: alarm-card-pulse-light 2s ease-in-out infinite;
}

@keyframes alarm-card-pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(211, 47, 47, 0.4);
  }
  50% {
    box-shadow: 0 0 40px rgba(211, 47, 47, 0.8);
  }
}

@keyframes alarm-card-pulse-light {
  0%, 100% {
    box-shadow: 0 0 30px rgba(211, 47, 47, 0.3);
  }
  50% {
    box-shadow: 0 0 50px rgba(211, 47, 47, 0.6);
  }
}

.alarm-icon-pulse {
  animation: icon-pulse 1.5s ease-in-out infinite;
}

@keyframes icon-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.alarm-table tbody tr.alarm-open {
  animation: row-highlight 2s ease-in-out infinite;
  transition: background-color 0.3s ease;
}

@keyframes row-highlight {
  0%, 100% {
    background-color: rgba(211, 47, 47, 0.05);
  }
  50% {
    background-color: rgba(211, 47, 47, 0.12);
  }
}

.alarm-table tbody tr.alarm-open.light-theme-row {
  animation: row-highlight-light 2s ease-in-out infinite;
}

@keyframes row-highlight-light {
  0%, 100% {
    background-color: rgba(211, 47, 47, 0.03);
  }
  50% {
    background-color: rgba(211, 47, 47, 0.08);
  }
}

.alarm-details {
  border-radius: 8px;
  padding: 16px;
  transition: background-color 0.3s ease;
}
</style>
