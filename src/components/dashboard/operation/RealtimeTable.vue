<script setup>
const props = defineProps({
  machineData: {
    type: Object,
    default: () => ({
      name: 'Machine A-01',
      isOnline: true,
      lastUpdate: '2026-01-01T10:30:00',
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
        elevation="24"
      >
        <!-- Header -->
        <div class="d-flex align-center justify-space-between mb-4">
          <div class="d-flex align-center gap-3">
            <VAvatar
              class="header-avatar"
              size="48"
            >
              <VIcon
                size="28"
                icon="tabler-table"
              />
            </VAvatar>
            <div>
              <h4 class="text-h5 font-weight-bold text-white mb-1">
                Realtime Monitoring
              </h4>
              <div class="d-flex align-center gap-2">
                <VIcon
                  :icon="machineData.isOnline ? 'tabler-clock-hour-4' : 'tabler-clock-off'"
                  size="14"
                  :class="machineData.isOnline ? 'text-success' : 'text-grey'"
                />
                <span class="text-caption text-grey-lighten-1">
                  Last update: 
                  <span class="font-weight-medium text-white ms-1">
                    {{ formatDateTime(machineData.lastUpdate) }}
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
            class="text-grey scroll-hint"
          />
        </div>

        <!-- Horizontal Scrollable Table -->
        <div class="horizontal-scroll-container">
          <div class="data-grid">
            <VCard
              v-for="item in machineData.data"
              :key="item.id"
              class="data-card pa-4"
              elevation="0"
            >
              <!-- Status Indicator -->
              <div class="d-flex align-center justify-space-between mb-3">
                <VIcon
                  :icon="getStatusIcon(item.status)"
                  :color="getStatusColor(item.status)"
                  size="22"
                />
                <VChip
                  :color="getStatusColor(item.status)"
                  size="x-small"
                  variant="tonal"
                  class="status-chip"
                >
                  {{ item.status }}
                </VChip>
              </div>

              <!-- Parameter Name -->
              <div class="text-caption text-grey-lighten-1 mb-2 font-weight-medium text-uppercase letter-spacing">
                {{ item.parameter }}
              </div>

              <!-- Value -->
              <div 
                class="text-h5 font-weight-bold mb-3"
                :class="[
                  item.status === 'active' ? 'text-success' : 
                  item.status === 'warning' ? 'text-warning' : 
                  'text-grey'
                ]"
              >
                {{ item.value }}
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
          elevation="0"
        >
          <VIcon
            icon="tabler-wifi-off"
            size="48"
            class="text-grey mb-3"
          />
          <div class="text-subtitle-1 text-grey font-weight-medium mb-1">
            Machine Offline
          </div>
          <div class="text-caption text-grey-darken-1">
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
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(20, 184, 166, 0.12) 100%);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(16, 185, 129, 0.15);
  transition: all 0.3s ease;
}

.glass-table-card:hover {
  transform: scale(1.005);
  box-shadow: 0 24px 70px rgba(16, 185, 129, 0.2);
}

.header-avatar {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(20, 184, 166, 0.3)) !important;
  color: rgb(167, 243, 208) !important;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
  border-radius: 16px !important;
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

/* Custom Scrollbar */
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
