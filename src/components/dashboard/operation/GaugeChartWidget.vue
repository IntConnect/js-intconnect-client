<script setup>
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const props = defineProps({
  copValue: {
    type: Number,
    required: false,
    default: 0,
  },
})

const vuetifyTheme = useTheme()
const currentTheme = vuetifyTheme.current.value.colors

const series = computed(() => {
  const value = Number((props.copValue / copMax) * 100)

  return [Math.min(Math.max(value, 0), 100)]
})


// COP Data
const copMax = 8.0 // Maximum COP value

// Calculate percentage for gauge
const copPercentage = computed(() => {
  console.log(Number (props.copValue / copMax) * 100)
  
  return  Number (props.copValue / copMax) * 100

})


// Determine status based on COP value
const copStatus = computed(() => {
  if (props.copValue >= 4.0) {
    return {
      label: 'EXCELLENT',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.15)',
      icon: 'tabler-circle-check',
      borderColor: 'rgba(16, 185, 129, 0.4)',
    }
  } else if (props.copValue >= 3.0) {
    return {
      label: 'GOOD',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.15)',
      icon: 'tabler-circle-dot',
      borderColor: 'rgba(59, 130, 246, 0.4)',
    }
  } else if (props.copValue >= 2.0) {
    return {
      label: 'WARNING',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.15)',
      icon: 'tabler-alert-circle',
      borderColor: 'rgba(245, 158, 11, 0.4)',
    }
  } else {
    return {
      label: 'ALARM',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.15)',
      icon: 'tabler-alert-triangle',
      borderColor: 'rgba(239, 68, 68, 0.4)',
    }
  }
})


const chartOptions = computed(() => ({
  chart: {
    type: 'radialBar',
    offsetY: -10,
    sparkline: {
      enabled: true,
    },
  },
  plotOptions: {
    radialBar: {
      startAngle: -90,
      endAngle: 90,
      hollow: {
        size: '65%',
      },
      track: {
        background: 'rgba(255, 255, 255, 0.1)',
        strokeWidth: '100%',
        margin: 8,
      },
      dataLabels: {
        name: {
          show: false,
        },
        value: {
          offsetY: -5,
          fontSize: '32px',
          fontWeight: 'bold',
          color: copStatus.value.color,
          formatter: function () {
            return props.copValue.toFixed(1)
          },
        },
      },
    },
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'dark',
      type: 'horizontal',
      shadeIntensity: 0.5,
      gradientToColors: [copStatus.value.color],
      inverseColors: false,
      opacityFrom: 1,
      opacityTo: 1,
      stops: [0, 100],
    },
  },
  stroke: {
    lineCap: 'round',
  },
  colors: [copStatus.value.color],
}))
</script>

<template>
  <VCard class="gauge-glass-card">
    <!-- Animated Background Effect -->
    <div class="animated-glow" />
    
    <!-- Header -->
    <VCardText class="pb-2">
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-2">
          <div class="header-icon-wrapper">
            <VIcon
              icon="tabler-gauge"
              size="20"
              class="header-icon"
            />
          </div>
          <div>
            <h6 class="text-subtitle-2 text-white font-weight-bold mb-0">
              COP Monitor
            </h6>
          </div>
        </div>

        <!-- Status Badge -->
        <VChip
          size="small"
          :style="{
            background: copStatus.bgColor,
            color: copStatus.color,
            borderColor: copStatus.borderColor,
            border: '1px solid'
          }"
          class="font-weight-bold status-chip"
          :prepend-icon="copStatus.icon"
        >
          {{ copStatus.label }}
        </VChip>
      </div>
    </VCardText>

    <!-- Gauge Chart -->
    <VCardText class="py-3">
      <div class="gauge-container">
        <VueApexCharts
          :height="250"
          :options="chartOptions"
          :series="series"
          type="radialBar"
        />
        
      
        <!-- Min Max Labels -->
        <div class="gauge-labels">
          <span class="text-caption text-grey">0.0</span>
          <span class="text-caption text-grey">{{ copMax.toFixed(1) }}</span>
        </div>
      </div>
    </VCardText>


    <!-- Footer Info -->
    <VDivider class="divider-custom" />
    

    <!-- Sparkle Effects -->
    <div class="sparkle sparkle-1" />
    <div class="sparkle sparkle-2" />
    <div class="sparkle sparkle-3" />
  </VCard>
</template>

<style scoped>
.gauge-glass-card {
  position: relative;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 20px !important;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.gauge-glass-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 64px rgba(16, 185, 129, 0.2) !important;
  border-color: rgba(16, 185, 129, 0.3) !important;
}

/* Animated Glow Background */
.animated-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(16, 185, 129, 0.15) 0%,
    rgba(6, 182, 212, 0.1) 30%,
    transparent 70%
  );
  animation: rotate-glow 8s linear infinite;
  pointer-events: none;
  opacity: 0.6;
}

@keyframes rotate-glow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Header Icon */
.header-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2));
  border: 1px solid rgba(16, 185, 129, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.gauge-glass-card:hover .header-icon-wrapper {
  transform: rotate(-10deg) scale(1.1);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
}

.header-icon {
  color: #10b981;
  filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.6));
}

/* Status Chip */
.status-chip {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  animation: pulse-badge 2s ease-in-out infinite;
}

@keyframes pulse-badge {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* Gauge Container */
.gauge-container {
  position: relative;
  margin: 0 auto;
  max-width: 240px;
}


.gauge-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  margin-top: -10px;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 8px;
}

.metric-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 10px;
  transition: all 0.3s ease;
}

.metric-item:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(16, 185, 129, 0.3);
  transform: translateY(-2px);
}

.metric-icon-circle {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.metric-item:hover .metric-icon-circle {
  transform: rotate(10deg) scale(1.1);
}

.metric-value-container {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 4px;
}

.metric-value {
  font-size: 1.1rem;
  font-weight: bold;
  line-height: 1;
  text-shadow: 0 0 10px currentColor;
}

.metric-unit {
  font-size: 0.7rem;
  color: #94a3b8;
}

/* Divider */
.divider-custom {
  border-color: rgba(255, 255, 255, 0.08) !important;
}

/* Status Dot */
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
}

.animate-pulse {
  animation: pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-dot {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Sparkle Effects */
.sparkle {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.6);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
  animation: sparkle-float 3s ease-in-out infinite;
  pointer-events: none;
}

.sparkle-1 {
  top: 20%;
  right: 10%;
  animation-delay: 0s;
}

.sparkle-2 {
  top: 60%;
  left: 15%;
  animation-delay: 1s;
}

.sparkle-3 {
  bottom: 30%;
  right: 20%;
  animation-delay: 2s;
}

@keyframes sparkle-float {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0;
  }
  50% {
    transform: translateY(-20px) scale(1.5);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 960px) {
  .metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
