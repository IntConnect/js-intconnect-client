<script setup>
import { useConfigStore } from '@core/stores/config'
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const props = defineProps({
  realtimeData: {
    type: Array,
    default: () => [],
  },

  lastUpdate: {
    type: Date,
    default: "2026-01-01T10:30:00",
  },

  machineData: {
    type: Object,
    default: () => ({
      isOnline: true,
      data: [
        { id: 1, parameter: 'Temperature', value: '75.2°C', status: 'active' },
        { id: 2, parameter: 'Pressure', value: '120 PSI', status: 'active' },
        { id: 3, parameter: 'Vibration', value: '0.5 mm/s', status: 'warning' },
        { id: 4, parameter: 'Oil Level', value: '85%', status: 'active' },
        { id: 5, parameter: 'Power', value: '45.3 kW', status: 'active' },
        { id: 6, parameter: 'RPM', value: '1450', status: 'active' },
        { id: 7, parameter: 'Current', value: '85.2 A', status: 'active' },
        { id: 8, parameter: 'Voltage', value: '380 V', status: 'active' },
      ],
    }),
  },
})

// Theme Detection
const configStore = useConfigStore()
const theme = useTheme()

const isDark = computed(() => {
  if (configStore.theme === 'system') {
    return theme.global.current.value.dark
  }
  return configStore.theme === 'dark'
})

// Dynamic Styles
const glassCardStyle = computed(() => ({
  background: isDark.value
    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(20, 184, 166, 0.12) 100%)'
    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(20, 184, 166, 0.06) 100%)',
  borderColor: isDark.value
    ? 'rgba(16, 185, 129, 0.25)'
    : 'rgba(16, 185, 129, 0.3)',
  boxShadow: isDark.value
    ? '0 20px 60px rgba(16, 185, 129, 0.15)'
    : '0 8px 32px rgba(16, 185, 129, 0.12)'
}))

const textPrimaryClass = computed(() => 
  isDark.value ? 'text-white' : 'text-grey-darken-3'
)

const textSecondaryClass = computed(() => 
  isDark.value ? 'text-grey-lighten-1' : 'text-grey-darken-1'
)

const textMutedClass = computed(() => 
  isDark.value ? 'text-grey' : 'text-grey-lighten-1'
)

const getStatusIcon = status => {
  switch(status) {
    case 'active': return 'tabler-circle-check-filled'
    case 'warning': return 'tabler-alert-circle'
    case 'inactive': return 'tabler-circle-x'
    default: return 'tabler-circle'
  }
}

const getStatusColor = status => {
  switch(status) {
    case 'active': return 'success'
    case 'warning': return 'warning'
    case 'inactive': return 'default'
    default: return 'info'
  }
}

const formatDateTime = dateString => {
  if (!dateString) return 'N/A'
  
  return new Date(dateString).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
</script>

<template>
  <VRow>
    <VCol
      cols="12"
      md="12"
      lg="12"
    >
      <VCard
        class="glass-table-card pa-5"
        :class="isDark ? '' : 'glass-table-card-light'"
        :style="glassCardStyle"
        elevation="24"
      >
        <!-- Header -->
        <div class="d-flex align-center justify-space-between mb-4">
          <div class="d-flex align-center gap-3">
            <VAvatar
              class="header-avatar"
              :class="isDark ? '' : 'header-avatar-light'"
              size="48"
            >
              <VIcon
                size="28"
                icon="tabler-table"
              />
            </VAvatar>
            <div>
              <h4 
                class="text-h5 font-weight-bold mb-1"
                :class="textPrimaryClass"
              >
                Realtime Monitoring
              </h4>
              <div class="d-flex align-center gap-2">
                <VIcon
                  :icon="machineData.isOnline ? 'tabler-clock-hour-4' : 'tabler-clock-off'"
                  size="14"
                  :class="machineData.isOnline ? 'text-success' : textMutedClass"
                />
                <span 
                  class="text-caption"
                  :class="textSecondaryClass"
                >
                  Last update: 
                  <span 
                    class="font-weight-medium ms-1"
                    :class="textPrimaryClass"
                  >
                    {{ formatDateTime(props.lastUpdate) }}
                  </span>
                </span>
                <VChip
                  v-if="machineData.isOnline"
                  class="live-chip ms-1"
                  size="x-small"
                  color="success"
                  variant="flat"
                >
                  <VIcon
                    icon="tabler-broadcast"
                    size="12"
                    class="pulse-icon me-1"
                  />
                  LIVE
                </VChip>
              </div>
            </div>
          </div>
          <VIcon
            icon="tabler-arrows-horizontal"
            size="18"
            :class="textMutedClass"
            class="scroll-hint"
          />
        </div>

        <!-- Horizontal Scrollable Table -->
        <div 
          class="horizontal-scroll-container"
          :class="isDark ? '' : 'horizontal-scroll-light'"
        >
          <div class="data-grid">
            <VCard
              v-for="item in realtimeData"
              :key="item.id"
              class="data-card pa-4"
              :class="isDark ? '' : 'data-card-light'"
              elevation="0"
            >
              <!-- Status Indicator -->
              <div class="d-flex align-center justify-space-between mb-3">
                <VIcon
                  :icon="getStatusIcon('active')"
                  :color="getStatusColor('active')"
                  size="22"
                />
                <VChip
                  :color="getStatusColor('active')"
                  size="x-small"
                  variant="tonal"
                  class="status-chip"
                >
                 Normal
                </VChip>
              </div>

              <!-- Parameter Name -->
              <div 
                class="text-caption mb-2 font-weight-medium text-uppercase letter-spacing"
                :class="textSecondaryClass"
              >
                {{ item.parameter }}
              </div>

              <!-- Value -->
              <div 
                class="text-h5 font-weight-bold mb-3"
                :class="[
                  isDark ? '' : '',
                  item.status === 'active' ? 'text-success' : 
                  item.status === 'warning' ? 'text-warning' : 
                  textMutedClass
                ]"
              >
                {{ Number(item.value).toFixed(2) }} 
              </div>

              <!-- Decorative Bottom Line -->
              <div 
                class="decoration-line"
                :class="[
                  item.status === 'active' ? 'line-success' : 
                  item.status === 'warning' ? 'line-warning' : 
                  'line-inactive'
                ]"
              />
            </VCard>
          </div>
        </div>

        <!-- Offline State -->
        <VCard
          v-if="!machineData.isOnline"
          class="mt-4 text-center pa-6 rounded-lg offline-card"
          :class="isDark ? '' : 'offline-card-light'"
          elevation="0"
        >
          <VIcon
            icon="tabler-wifi-off"
            size="48"
            :class="textMutedClass"
            class="mb-3"
          />
          <div 
            class="text-subtitle-1 font-weight-medium mb-1"
            :class="textMutedClass"
          >
            Machine Offline
          </div>
          <div 
            class="text-caption"
            :class="textMutedClass"
          >
            Data tidak tersedia. Hubungkan mesin untuk mulai monitoring.
          </div>
        </VCard>
      </VCard>
    </VCol>
  </VRow>
</template>

<style scoped>
.glass-table-card {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 24px;
  transition: all 0.3s ease;
}

.glass-table-card:hover {
  transform: scale(1.005);
}

.glass-table-card-light {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.glass-table-card-light:hover {
  box-shadow: 0 12px 40px rgba(16, 185, 129, 0.15) !important;
}

.header-avatar {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(20, 184, 166, 0.3)) !important;
  color: rgb(167, 243, 208) !important;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
  border-radius: 16px !important;
}

.header-avatar-light {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(20, 184, 166, 0.2)) !important;
  color: rgb(5, 150, 105) !important;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.2);
}

.live-chip {
  font-weight: 700;
  letter-spacing: 0.5px;
}

.pulse-icon {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Horizontal Scrollable Container */
.horizontal-scroll-container {
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 12px;
  margin-bottom: -8px;
}

/* Custom Scrollbar - Dark */
.horizontal-scroll-container::-webkit-scrollbar {
  height: 8px;
}

.horizontal-scroll-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.horizontal-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(16, 185, 129, 0.4);
  border-radius: 10px;
  transition: background 0.3s ease;
}

.horizontal-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(16, 185, 129, 0.6);
}

/* Custom Scrollbar - Light */
.horizontal-scroll-light::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}

.horizontal-scroll-light::-webkit-scrollbar-thumb {
  background: rgba(16, 185, 129, 0.3);
}

.horizontal-scroll-light::-webkit-scrollbar-thumb:hover {
  background: rgba(16, 185, 129, 0.5);
}

/* Data Grid - Horizontal Layout */
.data-grid {
  display: flex;
  flex-direction: row;
  gap: 14px;
  min-width: min-content;
}

.data-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.05)) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 18px !important;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-width: 200px;
  max-width: 200px;
  flex-shrink: 0;
}

.data-card-light {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.8)) !important;
  border: 1px solid rgba(203, 213, 225, 0.4) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.data-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, rgba(16, 185, 129, 0.6), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.data-card:hover {
  transform: translateY(-4px);
  border-color: rgba(16, 185, 129, 0.4);
  box-shadow: 0 12px 32px rgba(16, 185, 129, 0.2);
}

.data-card-light:hover {
  box-shadow: 0 12px 32px rgba(16, 185, 129, 0.2) !important;
}

.data-card:hover::before {
  opacity: 1;
}

.status-chip {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.letter-spacing {
  letter-spacing: 0.5px;
}

.value-text {
  text-shadow: 0 0 15px currentColor;
}

.value-text-light {
}

/* Decorative Bottom Line */
.decoration-line {
  height: 3px;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.line-success {
  background: linear-gradient(90deg, #10b981, transparent);
}

.line-warning {
  background: linear-gradient(90deg, #f59e0b, transparent);
}

.line-inactive {
  background: linear-gradient(90deg, #6b7280, transparent);
}

.data-card:hover .decoration-line {
  opacity: 1;
  height: 4px;
}

.offline-card {
  background: rgba(30, 41, 59, 0.4) !important;
  border: 1px solid rgba(71, 85, 105, 0.3);
}

.offline-card-light {
  background: rgba(241, 245, 249, 0.6) !important;
  border: 1px solid rgba(203, 213, 225, 0.4) !important;
}

.scroll-hint {
  animation: bounce-horizontal 2s infinite;
  opacity: 0.5;
}

@keyframes bounce-horizontal {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(6px);
  }
}
</style>
