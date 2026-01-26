<script setup>
import { useConfigStore } from '@core/stores/config'
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const props = defineProps({
  title: {
    type: String,
    default: "Title",
  },
  subtitle: {
    type: String,
    default: "Subtitle",
  },
  badge: {
    type: String,
    default: "Warning",
  },
  value: {
    type: [String, Number],
    default: "100",
  },
  icon: {
    type: String,
    default: "tabler-snowflake",
  },
  percentage: {
    type: String,
    default: "10",
  },
  unit: {
    type: String,
    default: "kW",
  },
})

// Theme Detection
const configStore = useConfigStore()
const vuetifyTheme = useTheme()

const isDark = computed(() => {
  if (configStore.theme === 'system') {
    return vuetifyTheme.global.current.value.dark
  }
  
  return configStore.theme === 'dark'
})

const currentTheme = vuetifyTheme.current.value.colors

// Dynamic Styles
const glassCardStyle = computed(() => ({
  background: isDark.value
    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)'
    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(6, 182, 212, 0.04) 100%)',
  borderColor: isDark.value
    ? 'rgba(16, 185, 129, 0.2)'
    : 'rgba(16, 185, 129, 0.25)',
}))

const textPrimaryClass = computed(() => 
  isDark.value ? 'text-white' : 'text-grey-darken-3',
)

const textSecondaryClass = computed(() => 
  isDark.value ? 'text-grey-lighten-1' : 'text-grey-darken-1',
)

const textMutedClass = computed(() => 
  isDark.value ? 'text-grey' : 'text-grey-lighten-1',
)

// Data statistik
const stats = {
  current: '650',
  unit: 'kW',
  change: '+12.5%',
  isPositive: true,
  status: 'Optimal',
}
</script>

<template>
  <VCard 
    class="glass-card-chiller"
    :class="isDark ? '' : 'glass-card-chiller-light'"
    :style="glassCardStyle"
  >
    <!-- Header Section -->
    <VCardText class="pb-3">
      <div class="d-flex align-center justify-space-between mb-1">
        <div class="d-flex align-center gap-2 flex-grow-1 min-width-0">
          <div 
            class="icon-wrapper flex-shrink-0"
            :class="isDark ? '' : 'icon-wrapper-light'"
          >
            <VIcon
              :icon="props.icon"
              class="icon-glow"
              size="24"
            />
          </div>
          <div>
            <h5 
              class="text-subtitle-2 mb-0 text-left"
              :class="textSecondaryClass"
            >
              {{ props.title }}
            </h5>
            <div 
              class="text-caption"
              :class="textMutedClass"
            >
              {{ props.subtitle }}
            </div>
          </div>
        </div>

        <!-- Status Badge -->
        <VChip
          class="status-chip flex-shrink-0"
          :class="isDark ? '' : 'status-chip-light'"
          prepend-icon="tabler-circle-filled"
          size="small"
        >
          {{ props.badge }} Online
        </VChip>
      </div>

      <!-- Main Value Display -->
      <div class="value-section mt-4">
        <div class="d-flex align-center gap-3">
          <div>
            <div class="d-flex align-baseline gap-1">
              <h3 
                class="text-h3 font-weight-bold value-glow"
                :class="isDark ? '' : 'value-glow-light'"
              >
                {{ Number(props.value).toFixed(2) }}
              </h3>
              <span 
                class="text-h6"
                :class="textSecondaryClass"
              >
                {{ props.unit }}
              </span>
            </div>

            <!-- Change Indicator -->
            <div class="d-flex align-center gap-2 mt-1">
              <VChip
                :class="[
                  stats.isPositive ? 'change-chip-positive' : 'change-chip-negative',
                  isDark ? '' : 'change-chip-light'
                ]"
                :prepend-icon="stats.isPositive ? 'tabler-trending-up' : 'tabler-trending-down'"
                size="x-small"
              >
                {{ props.percentage }}
              </VChip>
              <span 
                class="text-caption"
                :class="textMutedClass"
              >
                vs last hour
              </span>
            </div>
          </div>

          <VSpacer />
        </div>
      </div>
    </VCardText>

    <!-- Chart Section -->

    <!-- Animated Background -->
    <div 
      class="animated-bg"
      :class="isDark ? '' : 'animated-bg-light'"
    />
  </VCard>
</template>

<style scoped>
.glass-card-chiller {
  position: relative;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(16, 185, 129, 0.2) !important;
  border-radius: 20px !important;
  overflow: hidden;
  transition: all 0.3s ease;
}

.glass-card-chiller:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 60px rgba(16, 185, 129, 0.25) !important;
  border-color: rgba(16, 185, 129, 0.4) !important;
}

.glass-card-chiller-light {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.glass-card-chiller-light:hover {
  box-shadow: 0 12px 40px rgba(16, 185, 129, 0.2) !important;
}

/* Icon Wrapper */
.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2));
  border: 1px solid rgba(16, 185, 129, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.icon-wrapper-light {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15));
  border-color: rgba(16, 185, 129, 0.25);
}

.glass-card-chiller:hover .icon-wrapper {
  transform: rotate(-5deg) scale(1.05);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
}

.glass-card-chiller-light:hover .icon-wrapper {
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.25);
}

.icon-glow {
  color: #10b981;
  filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.6));
}

.glass-card-chiller-light .icon-glow {
  filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.4));
}

/* Status Chip */
.status-chip {
  background: rgba(16, 185, 129, 0.2) !important;
  color: rgb(167, 243, 208) !important;
  border: 1px solid rgba(16, 185, 129, 0.4);
  font-weight: 600;
  font-size: 0.7rem;
}

.status-chip-light {
  background: rgba(16, 185, 129, 0.15) !important;
  color: rgb(5, 150, 105) !important;
  border-color: rgba(16, 185, 129, 0.3);
}

/* Value Section */
.value-section {
  padding: 12px 0;
}

.value-glow {
  color: #10b981;
  text-shadow: 0 0 30px rgba(16, 185, 129, 0.5);
  letter-spacing: -1px;
}

.value-glow-light {
  text-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
}

/* Change Chips */
.change-chip-positive {
  background: rgba(16, 185, 129, 0.2) !important;
  color: rgb(167, 243, 208) !important;
  border: 1px solid rgba(16, 185, 129, 0.3);
  font-weight: 700;
}

.change-chip-positive.change-chip-light {
  background: rgba(16, 185, 129, 0.15) !important;
  color: rgb(5, 150, 105) !important;
  border-color: rgba(16, 185, 129, 0.25);
}

.change-chip-negative {
  background: rgba(239, 68, 68, 0.2) !important;
  color: rgb(254, 202, 202) !important;
  border: 1px solid rgba(239, 68, 68, 0.3);
  font-weight: 700;
}

.change-chip-negative.change-chip-light {
  background: rgba(239, 68, 68, 0.15) !important;
  color: rgb(185, 28, 28) !important;
  border-color: rgba(239, 68, 68, 0.25);
}

.circle-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Chart Container */
.chart-container {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Divider Custom */
.divider-custom {
  border-color: rgba(255, 255, 255, 0.1) !important;
}

/* Bottom Stats */
.stat-item {
  text-align: center;
  flex: 1;
}

/* Animated Background */
.animated-bg {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
  animation: pulse-bg 4s ease-in-out infinite;
  pointer-events: none;
}

.animated-bg-light {
  background: radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%);
}

@keyframes pulse-bg {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.3;
  }
}
</style>
