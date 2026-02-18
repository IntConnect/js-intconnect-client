<script setup>
import { useConfigStore } from '@core/stores/config'
import { computed, ref } from 'vue'
import { useTheme } from 'vuetify'

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
  isEditMode: {
    type: Boolean,
    default: true,
  },
  parameters: {
    type: Array,
    default: () => [],
  },
  selectedParameters: {
    type: Array, 
    default: () => [],
  },
})

const emit = defineEmits(['addParameter', 'removeParameter'])

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
const glassCardStyle = computed(() => {
  if (props.machine.status === 'on') {
    return {
      background: isDark.value 
        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(20, 184, 166, 0.15) 100%)'
        : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(20, 184, 166, 0.08) 100%)',
      borderColor: isDark.value 
        ? 'rgba(16, 185, 129, 0.3)'
        : 'rgba(16, 185, 129, 0.4)',
      boxShadow: isDark.value
        ? '0 20px 60px rgba(16, 185, 129, 0.2)'
        : '0 8px 32px rgba(16, 185, 129, 0.15)',
    }
  }
  
  return {
    background: isDark.value 
      ? 'rgba(30, 41, 59, 0.4)'
      : 'rgba(241, 245, 249, 0.6)',
    borderColor: isDark.value 
      ? 'rgba(71, 85, 105, 0.3)'
      : 'rgba(203, 213, 225, 0.5)',
  }
})

const textPrimaryClass = computed(() => 
  isDark.value ? 'text-white' : 'text-grey-darken-3',
)

const textSecondaryClass = computed(() => 
  isDark.value ? 'text-grey-lighten-1' : 'text-grey-darken-1',
)

const textMutedClass = computed(() => 
  isDark.value ? 'text-grey' : 'text-grey-lighten-1',
)

// Dialog state
const showAddDialog = ref(false)

const handleOpenDialog = () => {
  showAddDialog.value = true
}

const handleRemoveParameter = itemId => {
  emit('removeParameter', itemId)
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
        class="glass-card pa-5 transition-all"
        :class="[
          isDark ? 'glass-card-dark' : 'glass-card-light',
          props.machine.status === 'on' ? 'glass-card-on' : 'glass-card-off'
        ]"
        :style="glassCardStyle"
        elevation="24"
        @mouseenter="props.machine.hover = true"
        @mouseleave="props.machine.hover = false"
      >
        <!-- Header Section -->
        <div class="d-flex justify-space-between align-start mb-4">
          <div class="flex-grow-1">
            <div class="d-flex align-center gap-3 mb-2">
              <h3 
                class="text-h5 font-weight-bold mb-0"
                :class="textPrimaryClass"
              >
                {{ props.machine.name }}
              </h3>
              <VChip
                class="px-3 chip-status"
                :class="[
                  props.machine.status === 'on' ? 'chip-online' : 'chip-offline',
                  isDark ? '' : 'chip-light'
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
              :class="isDark ? '' : 'runtime-badge-light'"
            >
              <VIcon
                icon="tabler-clock-hour-4"
                size="16"
                class="text-cyan"
              />
              <span 
                class="text-caption ms-1"
                :class="textSecondaryClass"
              >
                Total Runtime:
              </span>
              <span class="text-subtitle-2 font-weight-bold text-cyan ms-1">
                {{ props.machine.totalRuntime }}
              </span>
            </div>
          </div>
            
          <VAvatar
            class="icon-avatar"
            :class="[
              props.machine.status === 'on' ? 'avatar-on' : 'avatar-off',
              isDark ? '' : 'avatar-light'
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
              <span 
                class="text-subtitle-2 font-weight-medium"
                :class="textPrimaryClass"
              >
                Performance Overview
              </span>
            </div>
            <VIcon
              icon="tabler-arrows-horizontal"
              size="18"
              :class="textMutedClass"
              class="scroll-hint-horizontal"
            />
          </div>
            
          <div
            class="scrollable-container"
            :class="isDark ? '' : 'scrollable-light'"
          >
            <div class="running-time-grid">
              <!-- Add Parameter Card (Only in Edit Mode) -->
              <VCard
                v-if="isEditMode"
                class="add-parameter-card pa-4"
                :class="isDark ? '' : 'add-parameter-card-light'"
                elevation="0"
                @click="handleOpenDialog"
              >
                <div class="add-card-content">
                  <div 
                    class="add-icon-wrapper"
                    :class="isDark ? '' : 'add-icon-wrapper-light'"
                  >
                    <VIcon
                      icon="tabler-plus"
                      size="32"
                      class="add-icon"
                    />
                  </div>
                  <div 
                    class="text-caption font-weight-medium mt-3"
                    :class="textPrimaryClass"
                  >
                    Add Parameter
                  </div>
                </div>
              </VCard>

              <!-- Running Time Cards -->
              <VCard
                v-for="item in props.runningTimes"
                :key="item.id"
                class="running-time-card pa-4"
                :class="isDark ? '' : 'running-time-card-light'"
                elevation="0"
              >
                <!-- Delete Button (Only in Edit Mode) -->
                <VBtn
                  v-if="isEditMode"
                  icon
                  size="x-small"
                  variant="text"
                  color="error"
                  class="delete-btn"
                  @click.stop="handleRemoveParameter(item.id)"
                >
                  <VIcon
                    icon="tabler-x"
                    size="16"
                  />
                </VBtn>

                <!-- Icon Circle with Gradient -->
                <div class="d-flex align-center mb-3">
                  <div 
                    class="icon-circle"
                    :style="{ 
                      background: isDark 
                        ? `linear-gradient(135deg, ${item.color}40, ${item.color}20)`
                        : `linear-gradient(135deg, ${item.color}20, ${item.color}10)`,
                      borderColor: isDark ? `${item.color}60` : `${item.color}40`
                    }"
                  >
                    <VIcon
                      icon="tabler-wifi"
                      size="20"
                      :style="{ color: item.color }"
                    />
                  </div>
                  <span 
                    class="text-caption ms-2 font-weight-medium"
                    :class="textSecondaryClass"
                  >
                    {{ item.name }}
                  </span>
                </div>
                  
                <!-- Value Display -->
                <div class="value-container">
                  <div 
                    class="text-h5 font-weight-bold value-text"
                    :class="isDark ? '' : 'value-text-light'"
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
          :class="isDark ? '' : 'idle-card-light'"
          elevation="0"
        >
          <VIcon
            icon="tabler-circle-off"
            size="40"
            :class="textMutedClass"
            class="mb-2"
          />
          <div 
            class="text-body-2 font-weight-medium"
            :class="textMutedClass"
          >
            System Idle
          </div>
        </VCard>
      </VCard>
    </VCol>

    <!-- Add Parameter Dialog -->
    <VDialog
      v-model="showAddDialog"
      max-width="600"
    >
      <VCard 
        class="add-dialog-card"
        :class="isDark ? '' : 'add-dialog-card-light'"
      >
        <VCardTitle class="d-flex align-center justify-space-between pa-6">
          <div class="d-flex align-center gap-3">
            <VAvatar
              color="success"
              variant="tonal"
              size="40"
            >
              <VIcon icon="tabler-plus" />
            </VAvatar>
            <div>
              <div class="text-h6 font-weight-bold">
                Add Parameters
              </div>
              <div 
                class="text-caption"
                :class="textMutedClass"
              >
                Select parameters to display
              </div>
            </div>
          </div>
          <VBtn
            icon
            variant="text"
            size="small"
            @click="showAddDialog = false"
          >
            <VIcon icon="tabler-x" />
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <VSelect
            :model-value="props.selectedParameters"
            :items="parameters"
            label="Select Parameters"
            placeholder="Choose one or more parameters"
            multiple
            chips
            closable-chips
            variant="outlined"
            prepend-inner-icon="tabler-filter"
            @update:model-value="(item) => { 
              emit('addParameter', item[item.length-1]) 
            }"
          >
            <template #chip="{ item, props }">
              <VChip
                v-bind="props"
                size="small"
                color="success"
              >
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
                    color="success"
                    size="32"
                    variant="tonal"
                  >
                    <VIcon
                      icon="tabler-binary-tree-2"
                      size="18"
                    />
                  </VAvatar>
                </template>
                <template #subtitle>
                  <span 
                    class="text-caption"
                    :class="textMutedClass"
                  >
                    {{ item.raw.code }} • {{ item.raw.unit }}
                  </span>
                </template>
              </VListItem>
            </template>
          </VSelect>

          <div
            v-if="selectedParameters.length > 0"
            class="mt-4 pa-3 rounded-lg selection-info"
            :class="isDark ? '' : 'selection-info-light'"
          >
            <div class="text-caption text-success font-weight-medium mb-1">
              Selected: {{ selectedParameters.length }} parameter(s)
            </div>
            <div 
              class="text-caption"
              :class="textMutedClass"
            >
              These parameters will be added to the performance overview
            </div>
          </div>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-6 d-flex justify-space-between">
          <div 
            class="text-caption text-medium-emphasis"
            :class="textMutedClass"
          >
            Parameter saved when click "Store Chart"
          </div>
          <div>
            <VBtn
              variant="tonal"
              color="primary"
              @click="showAddDialog = false"
            >
              Hide
            </VBtn>
          </div>
        </VCardActions>
      </VCard>
    </VDialog>
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

.glass-card-dark.glass-card-off {
  background: rgba(30, 41, 59, 0.4);
  border-color: rgba(71, 85, 105, 0.3);
}

.glass-card-light.glass-card-off {
  background: rgba(241, 245, 249, 0.6);
  border-color: rgba(203, 213, 225, 0.5);
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

.chip-online.chip-light {
  background: rgba(16, 185, 129, 0.15) !important;
  color: rgb(5, 150, 105) !important;
  border-color: rgba(16, 185, 129, 0.4);
}

.chip-offline {
  background: rgba(51, 65, 85, 0.5) !important;
  color: rgb(148, 163, 184) !important;
  border-color: rgba(71, 85, 105, 0.5);
}

.chip-offline.chip-light {
  background: rgba(148, 163, 184, 0.15) !important;
  color: rgb(71, 85, 105) !important;
  border-color: rgba(148, 163, 184, 0.3);
}

.icon-avatar {
  border-radius: 16px !important;
}

.avatar-on {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(20, 184, 166, 0.3)) !important;
  color: rgb(167, 243, 208) !important;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
}

.avatar-on.avatar-light {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(20, 184, 166, 0.2)) !important;
  color: rgb(5, 150, 105) !important;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.2);
}

.avatar-off {
  background: rgba(51, 65, 85, 0.5) !important;
  color: rgb(100, 116, 139) !important;
}

.avatar-off.avatar-light {
  background: rgba(226, 232, 240, 0.8) !important;
  color: rgb(100, 116, 139) !important;
}

.scrollable-container {
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 12px;
  margin-bottom: -8px;
}

.scrollable-container::-webkit-scrollbar {
  height: 6px;
}

.scrollable-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.scrollable-light::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}

.scrollable-container::-webkit-scrollbar-thumb {
  background: rgba(16, 185, 129, 0.4);
  border-radius: 10px;
  transition: background 0.3s ease;
}

.scrollable-container::-webkit-scrollbar-thumb:hover {
  background: rgba(16, 185, 129, 0.6);
}

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

.running-time-card-light {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(241, 245, 249, 0.6)) !important;
  border: 1px solid rgba(203, 213, 225, 0.4) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
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

.running-time-card-light:hover {
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.2) !important;
}

.running-time-card:hover::before {
  opacity: 1;
}

/* Add Parameter Card */
.add-parameter-card {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.1)) !important;
  backdrop-filter: blur(10px);
  border: 2px dashed rgba(16, 185, 129, 0.4) !important;
  border-radius: 16px !important;
  min-width: 180px;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-parameter-card-light {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(6, 182, 212, 0.05)) !important;
  border: 2px dashed rgba(16, 185, 129, 0.3) !important;
}

.add-parameter-card:hover {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15)) !important;
  border-color: rgba(16, 185, 129, 0.6) !important;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.2);
}

.add-parameter-card-light:hover {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.1)) !important;
}

.add-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 140px;
}

.add-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.2);
  border: 2px solid rgba(16, 185, 129, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.add-icon-wrapper-light {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.3);
}

.add-parameter-card:hover .add-icon-wrapper {
  background: rgba(16, 185, 129, 0.3);
  transform: scale(1.1) rotate(90deg);
}

.add-icon {
  color: #10b981;
}

/* Delete Button */
.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  background: rgba(239, 68, 68, 0.2) !important;
  backdrop-filter: blur(8px);
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.3) !important;
}

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

.value-container {
  padding: 8px 0;
}

.value-text {
  letter-spacing: 0.5px;
}

.value-text-light {
}

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

.idle-card-light {
  background: rgba(241, 245, 249, 0.5) !important;
  border: 1px solid rgba(203, 213, 225, 0.4) !important;
}

.text-emerald {
  color: rgb(167, 243, 208);
}

.text-cyan {
  color: #06b6d4;
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

.runtime-badge {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(14, 165, 233, 0.15));
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 12px;
  padding: 6px 12px;
  margin-top: 4px;
}

.runtime-badge-light {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(14, 165, 233, 0.1));
  border-color: rgba(6, 182, 212, 0.25);
}

/* Dialog Styles */
.add-dialog-card {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98)) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.add-dialog-card-light {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95)) !important;
  border: 1px solid rgba(203, 213, 225, 0.3) !important;
}

.selection-info {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.selection-info-light {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.15);
}
</style>
