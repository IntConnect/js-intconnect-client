<script setup>
const props = defineProps({
  machine: {
    type: Object,
    default: () => {
      return {
        id: 1, 
        name: 'Machine A-01', 
        status: 'on',
        totalRuntime: '1,245h 30m',
        hover: false, 
      }

    },
    required: false,
  },
  runningTimes: {
    type: Array,
    required: false,
    default: () => [
      { id: 1, name: 'Compressor 1', value: '142h 35m', icon: 'tabler-circle-1', color: '#10b981' },
      { id: 2, name: 'Compressor 2', value: '98h 12m', icon: 'tabler-circle-2', color: '#14b8a6' },
      { id: 3, name: 'Compressor 3', value: '215h 48m', icon: 'tabler-circle-3', color: '#06b6d4' },
      { id: 4, name: 'Compressor 4', value: '87h 23m', icon: 'tabler-circle-4', color: '#0ea5e9' },
      { id: 5, name: 'Compressor 5', value: '156h 05m', icon: 'tabler-circle-5', color: '#8b5cf6' },
    ],
  },
})
</script>

<template>
  <VRow>
    <VCol
      cols="12"
      md="12"
      lg="12"
    >
      <VCard
        class="glass-card pa-5 transition-all"
        :class="[
          props.machine.status === 'on' ? 'glass-card-on' : 'glass-card-off'
        ]"
        elevation="24"
        @mouseenter="props.machine.hover = true"
        @mouseleave="props.machine.hover = false"
      >
        <!-- Header Section -->
        <div class="d-flex justify-space-between align-start mb-4">
          <div class="flex-grow-1">
            <div class="d-flex align-center gap-3 mb-2">
              <h3 class="text-h5 font-weight-bold text-white mb-0">
                {{ props.machine.name }}
              </h3>
              <VChip
                class="px-3 chip-status"
                :class="[
                  props.machine.status === 'on' ? 'chip-online' : 'chip-offline'
                ]"
                size="small"
                label
              >
                <VIcon
                  :class="props.machine.status === 'on' ? 'pulse-animation' : ''"
                  size="small"
                  start
                  icon="tabler-wifi"
                />
                {{ props.machine.status === 'on' ? 'Connected' : 'Disconnected' }}
              </VChip>
            </div>
            
            <!-- Total Runtime Display -->
            <div 
              v-if="props.machine.status === 'on'"
              class="runtime-badge"
            >
              <VIcon
                icon="tabler-clock-hour-4"
                size="16"
                class="text-cyan"
              />
              <span class="text-caption text-grey-lighten-1 ms-1">Total Runtime:</span>
              <span class="text-subtitle-2 font-weight-bold text-cyan ms-1">
                {{ props.machine.totalRuntime }}
              </span>
            </div>
          </div>
            
          <VAvatar
            class="icon-avatar"
            :class="[
              props.machine.status === 'on' ? 'avatar-on' : 'avatar-off'
            ]"
            size="48"
          >
            <VIcon
              size="28"
              icon="tabler-chart-area-line"
            />
          </VAvatar>
        </div>

        <!-- Status Info Section with Horizontal Scrollable -->
        <div
          v-if="props.machine.status === 'on'"
          class="mt-5"
        >
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="d-flex align-center">
              <VIcon
                icon="tabler-clock"
                size="20"
                class="text-emerald me-2"
              />
              <span class="text-subtitle-2 text-white font-weight-medium">Performance Overview</span>
            </div>
            <VIcon
              icon="tabler-arrows-horizontal"
              size="18"
              class="text-grey scroll-hint-horizontal"
            />
          </div>
            
          <div class="scrollable-container">
            <div class="running-time-grid">
              <VCard
                v-for="item in runningTimes"
                :key="item.id"
                class="running-time-card pa-4"
                elevation="0"
              >
                <!-- Icon Circle with Gradient -->
                <div class="d-flex align-center mb-3">
                  <div 
                    class="icon-circle"
                    :style="{ 
                      background: `linear-gradient(135deg, ${item.color}40, ${item.color}20)`,
                      borderColor: `${item.color}60`
                    }"
                  >
                    <VIcon
                      :icon="item.icon"
                      size="20"
                      :style="{ color: item.color }"
                    />
                  </div>
                  <span class="text-caption text-grey-lighten-1 ms-2 font-weight-medium">
                    {{ item.name }}
                  </span>
                </div>
                  
                <!-- Value Display -->
                <div class="value-container">
                  <div 
                    class="text-h5 font-weight-bold value-text"
                    :style="{ color: item.color }"
                  >
                    {{ item.value }}
                  </div>
                </div>

                <!-- Decorative Bottom Line -->
                <div 
                  class="decoration-line mt-3"
                  :style="{ background: `linear-gradient(90deg, ${item.color}, transparent)` }"
                />
              </VCard>
            </div>
          </div>
        </div>

        <VCard
          v-else
          class="mt-4 text-center pa-2 rounded-lg idle-card"
          elevation="0"
        >
          <VIcon
            icon="tabler-circle-off"
            size="40"
            class="text-grey mb-2"
          />
          <div class="text-body-2 text-grey font-weight-medium">
            System Idle
          </div>
        </VCard>
      </VCard>
    </VCol>
  </VRow>
</template>

<style scoped>
.glass-card {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
}

.glass-card:hover {
  transform: scale(1.01);
}

.glass-card-on {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(20, 184, 166, 0.15) 100%);
  border-color: rgba(16, 185, 129, 0.3);
  box-shadow: 0 20px 60px rgba(16, 185, 129, 0.2);
}

.glass-card-off {
  background: rgba(30, 41, 59, 0.4);
  border-color: rgba(71, 85, 105, 0.3);
}

.chip-status {
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid;
  border-radius: 12px;
}

.chip-online {
  background: rgba(16, 185, 129, 0.25) !important;
  color: rgb(167, 243, 208) !important;
  border-color: rgba(16, 185, 129, 0.5);
}

.chip-offline {
  background: rgba(51, 65, 85, 0.5) !important;
  color: rgb(148, 163, 184) !important;
  border-color: rgba(71, 85, 105, 0.5);
}

.icon-avatar {
  border-radius: 16px !important;
}

.avatar-on {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(20, 184, 166, 0.3)) !important;
  color: rgb(167, 243, 208) !important;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
}

.avatar-off {
  background: rgba(51, 65, 85, 0.5) !important;
  color: rgb(100, 116, 139) !important;
}

/* Horizontal Scrollable Container */
.scrollable-container {
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 12px;
  margin-bottom: -8px;
}

/* Custom Horizontal Scrollbar */
.scrollable-container::-webkit-scrollbar {
  height: 6px;
}

.scrollable-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.scrollable-container::-webkit-scrollbar-thumb {
  background: rgba(16, 185, 129, 0.4);
  border-radius: 10px;
  transition: background 0.3s ease;
}

.scrollable-container::-webkit-scrollbar-thumb:hover {
  background: rgba(16, 185, 129, 0.6);
}

/* Running Time Grid - Horizontal */
.running-time-grid {
  display: flex;
  flex-direction: row;
  gap: 12px;
  min-width: min-content;
}

.running-time-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04)) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px !important;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-width: 180px;
  flex-shrink: 0;
}

.running-time-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, rgba(16, 185, 129, 0.5), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.running-time-card:hover {
  transform: translateY(-2px);
  border-color: rgba(16, 185, 129, 0.3);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15);
}

.running-time-card:hover::before {
  opacity: 1;
}

/* Icon Circle */
.icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid;
  transition: all 0.3s ease;
}

.running-time-card:hover .icon-circle {
  transform: scale(1.1) rotate(5deg);
}

/* Value Container */
.value-container {
  padding: 8px 0;
}

.value-text {
  text-shadow: 0 0 20px currentColor;
  letter-spacing: 0.5px;
}

/* Decoration Line */
.decoration-line {
  height: 3px;
  border-radius: 2px;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.running-time-card:hover .decoration-line {
  opacity: 1;
}

.idle-card {
  background: rgba(30, 41, 59, 0.3) !important;
  border: 1px solid rgba(71, 85, 105, 0.3);
}

.text-emerald {
  color: rgb(167, 243, 208);
}

.text-teal {
  color: rgb(153, 246, 228);
}

.pulse-animation {
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

.scroll-hint-horizontal {
  animation: bounce-horizontal 2s infinite;
  opacity: 0.5;
}

@keyframes bounce-horizontal {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(4px);
  }
}

.transition-all {
  transition: all 0.3s ease;
}

/* Runtime Badge */
.runtime-badge {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(14, 165, 233, 0.15));
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 12px;
  padding: 6px 12px;
  margin-top: 4px;
}

.text-cyan {
  color: #06b6d4;
}
</style>
