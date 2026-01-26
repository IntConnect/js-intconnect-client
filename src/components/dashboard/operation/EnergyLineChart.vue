<script setup>
import { useConfigStore } from '@core/stores/config'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useTheme } from 'vuetify'

const props = defineProps({
  realtimeData: {
    type: Array,
    required: true,
  },

  title: {
    type: String,
    default: 'Realtime Monitor',
  },
  subtitle: {
    type: String,
    default: 'Live data visualization',
  },
})

const chartRef = ref(null)
const chartReady = ref(false)

// Theme Detection
const configStore = useConfigStore()
const vuetifyTheme = useTheme()

const isDark = computed(() => {
  if (configStore.theme === 'system') {
    return vuetifyTheme.global.current.value.dark
  }
  return configStore.theme === 'dark'
})

const colorVariables = themeColors => {
  const themeSecondaryTextColor = `rgba(${hexToRgb(themeColors.colors['on-surface'])},${themeColors.variables['medium-emphasis-opacity']})`
  const themeDisabledTextColor = `rgba(${hexToRgb(themeColors.colors['on-surface'])},${themeColors.variables['disabled-opacity']})`
  const themeBorderColor = `rgba(${hexToRgb(String(themeColors.variables['border-color']))},${themeColors.variables['border-opacity']})`
  const themePrimaryTextColor = `rgba(${hexToRgb(themeColors.colors['on-surface'])},${themeColors.variables['high-emphasis-opacity']})`

  return { themeSecondaryTextColor, themeDisabledTextColor, themeBorderColor, themePrimaryTextColor }
}

// Dynamic Styles
const glassCardStyle = computed(() => ({
  background: isDark.value
    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.95) 100%)',
  borderColor: isDark.value
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(203, 213, 225, 0.4)',
}))

const textPrimaryClass = computed(() => 
  isDark.value ? 'text-white' : 'text-grey-darken-3'
)

const textSecondaryClass = computed(() => 
  isDark.value ? 'text-grey-lighten-1' : 'text-grey-darken-1'
)

const chartOptions = computed(() => {
  return getLineChartSimpleConfig()
})

watch(
  () => props.realtimeData,
  series => {
    if (!chartReady.value || !chartRef.value) return

    chartRef.value.updateSeries(
      series.map(s => ({
        ...s,
        data: [...s.data],
      })),
      true,
    )
  },
  { deep: true },
)

const getLineChartSimpleConfig = () => {
  const {
    themeSecondaryTextColor,
    themeDisabledTextColor,
    themeBorderColor,
    themePrimaryTextColor,
  } = colorVariables(vuetifyTheme.current.value)

  return {
    chart: {
      parentHeightOffset: 0,
      zoom: { enabled: false },
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: 'linear',
        dynamicAnimation: {
          speed: 300,
        },
      },
    },
    colors: ['#10b981', '#06b6d4'],
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    dataLabels: { enabled: false },
    markers: {
      size: 0,
      strokeWidth: 2,
      strokeOpacity: 1,
      strokeColors: isDark.value ? '#fff' : '#f8fafc',
      hover: {
        size: 6,
      },
    },
    grid: {
      padding: { top: -10 },
      borderColor: isDark.value 
        ? 'rgba(255, 255, 255, 0.1)' 
        : 'rgba(0, 0, 0, 0.08)',
      strokeDashArray: 4,
    },
    legend: {
      labels: {
        colors: themeSecondaryTextColor,
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: themePrimaryTextColor,
          fontSize: '0.8125rem',
        },
            formatter: v => v.toFixed(2),

      },
    },
    xaxis: {
      type: 'datetime',
      axisBorder: { show: false },
      axisTicks: { 
        color: isDark.value 
          ? 'rgba(255, 255, 255, 0.1)' 
          : 'rgba(0, 0, 0, 0.08)' 
      },
      labels: {
        datetimeUTC: false,
        format: 'HH:mm:ss',
        style: {
          colors: themeSecondaryTextColor,
          fontSize: '0.8125rem',
        },
      },
      crosshairs: {
        stroke: { 
          color: isDark.value 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.08)' 
        },
      },
    },
    tooltip: {
      theme: isDark.value ? 'dark' : 'light',
       y: {
    formatter: v => v.toFixed(2),
  },
    },
  }
}

onMounted(async () => {
  await nextTick()
  chartReady.value = true
})
</script>

<template>
  <VCard 
    class="chart-glass-card"
    :class="isDark ? '' : 'chart-glass-card-light'"
    :style="glassCardStyle"
  >
    <VCardText class="pb-2">
      <div class="d-flex align-center justify-space-between mb-3">
        <div class="d-flex align-center gap-2">
          <div 
            class="chart-icon-wrapper"
            :class="isDark ? '' : 'chart-icon-wrapper-light'"
          >
            <VIcon class="chart-icon" icon="tabler-chart-line" size="30" />
          </div>
          <div>
            <h5 
              class="text-h5 font-weight-bold mb-0 text-left"
              :class="textPrimaryClass"
            >
              {{ title }}
            </h5>
            <span 
              class="text-caption"
              :class="textSecondaryClass"
            >
              {{ subtitle }}
            </span>
          </div>
        </div>

        <div class="d-flex align-center gap-1">
          <div class="status-dot-live" />
          <span class="text-caption text-success font-weight-medium">Realtime</span>
        </div>
      </div>
    </VCardText>

    <VCardText class="pt-0">
      <div 
        class="chart-container"
        :class="isDark ? '' : 'chart-container-light'"
      >
        <VueApexCharts ref="chartRef" :options="chartOptions" :series="realtimeData" height="400" type="line" />
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped>
.chart-glass-card {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 20px !important;
  overflow: hidden;
  transition: all 0.3s ease;
}

.chart-glass-card:hover {
  border-color: rgba(16, 185, 129, 0.3) !important;
  box-shadow: 0 20px 60px rgba(16, 185, 129, 0.15) !important;
}

.chart-glass-card-light {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(203, 213, 225, 0.4) !important;
}

.chart-glass-card-light:hover {
  box-shadow: 0 12px 40px rgba(16, 185, 129, 0.12) !important;
}

.chart-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2));
  border: 1px solid rgba(16, 185, 129, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.chart-icon-wrapper-light {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15));
  border-color: rgba(16, 185, 129, 0.25);
}

.chart-icon {
  color: #10b981;
  width: 36px;
}

.chart-container {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s ease;
}

.chart-container-light {
  background: rgba(248, 250, 252, 0.5);
  border: 1px solid rgba(226, 232, 240, 0.6);
}

.status-dot-live {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
  animation: pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
