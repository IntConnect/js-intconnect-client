<script setup>
import { useConfigStore } from '@core/stores/config'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useTheme } from 'vuetify'

const props = defineProps({
  chartData: {
    type: Array,
    default: () => [
      { name: 'Jan', value: 245.5 },
      { name: 'Feb', value: 268.3 },
      { name: 'Mar', value: 251.7 },
      { name: 'Apr', value: 289.2 },
      { name: 'May', value: 276.8 },
      { name: 'Jun', value: 294.5 },
      { name: 'Jul', value: 312.1 },
      { name: 'Aug', value: 298.6 },
      { name: 'Sep', value: 285.3 },
      { name: 'Oct', value: 301.9 },
      { name: 'Nov', value: 318.4 },
      { name: 'Dec', value: 295.7 },
    ],
  },
  title: {
    type: String,
    default: 'Energy Efficiency',
  },
  chartColor: {
    type: String,
    default: '#3b82f6',
  },
   mode: {
    type: String,
    default: 'monthly', // realtime | weekly | monthly
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
  const themePrimaryTextColor = `rgba(${hexToRgb(themeColors.colors['on-surface'])},${themeColors.variables['high-emphasis-opacity']})`

  return { themeSecondaryTextColor, themePrimaryTextColor }
}

// Convert hex to RGB
const hexToRgb = hex => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b)
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null
}


const xCategories = computed(() => {
  switch (props.mode) {
    case 'realtime':
      // timestamp → HH:mm:ss
      return props.chartData.map(item =>
        new Date(new Date()).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )

    case 'weekly':
      return props.chartData.map(item => `Week ${item.week}`)

    case 'monthly':
    default:
      return props.chartData.map(item => item.name)
  }
})

// Series data for ApexCharts
const series = computed(() => [
  {
    name: 'Actual',
    data: props.chartData.map(item => item.value),
  },
  {
    name: 'Target',
    data: props.chartData.map(item => item.value),
  },
])

// Chart Options
const chartOptions = computed(() => {
  const {
    themeSecondaryTextColor,
    themePrimaryTextColor,
  } = colorVariables(vuetifyTheme.current.value)

  return {
    chart: {
      type: 'area',
      height: 350,
      parentHeightOffset: 0,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
    },
    colors: [props.chartColor],
    stroke: {
      curve: 'smooth',
      width: 3,
      lineCap: 'round',
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: isDark.value ? 'dark' : 'light',
        type: 'vertical',
        shadeIntensity: 0.5,
        gradientToColors: [props.chartColor],
        opacityFrom: isDark.value ? 0.4 : 0.3,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    dataLabels: { enabled: false },
    markers: {
      size: 0,
      strokeWidth: 3,
      strokeColors: isDark.value ? '#1e293b' : '#ffffff',
      hover: {
        size: 7,
        sizeOffset: 3,
      },
    },
    grid: {
      show: true,
      borderColor: isDark.value 
        ? 'rgba(255, 255, 255, 0.06)' 
        : 'rgba(0, 0, 0, 0.05)',
      strokeDashArray: 3,
      padding: {
        top: -20,
        bottom: 0,
        left: 10,
        right: 10,
      },
      xaxis: {
        lines: { show: false },
      },
      yaxis: {
        lines: { show: true },
      },
    },
    xaxis: {
  categories: xCategories.value,
  type: props.mode === 'realtime' ? 'category' : 'category',
  axisBorder: { show: false },
  axisTicks: { show: false },
  labels: {
    rotate: props.mode === 'realtime' ? -45 : 0,
    style: {
      colors: themeSecondaryTextColor,
      fontSize: '12px',
      fontWeight: 500,
    },
  },
  crosshairs: {
    show: true,
    position: 'front',
    stroke: {
      width: 1,
      dashArray: 3,
    },
  },
},
markers: {
  size: 0,
  hover: {
    size: 6,
  },
},

    yaxis: {
      labels: {
        style: {
          colors: themePrimaryTextColor,
          fontSize: '12px',
          fontWeight: 600,
        },
        formatter: value => `${value.toFixed(1)} kW`,
      },
    },
   tooltip: {
  shared: true,
  intersect: false,
  x: {
    formatter: value => {
      if (props.mode === 'realtime') return `Time: ${value}`
      if (props.mode === 'weekly') return value
      return value
    },
  },
},

    responsive: [{
      breakpoint: 1200,
      options: {
        chart: {
          height: 300,
        },
      },
    }],
  }
})

onMounted(async () => {
  await nextTick()
  chartReady.value = true
})
</script>

<template>
  <div 
    class="efficiency-chart-wrapper"
    :class="isDark ? 'dark-theme' : 'light-theme'"
  >
    <div class="chart-background-glow" :style="{ '--chart-color': chartColor }" />
    
    <div class="chart-content">
      <VueApexCharts 
        v-if="chartReady"
        ref="chartRef" 
        :options="chartOptions" 
        :series="series" 
        height="350" 
        type="area" 
      />
    </div>
  </div>
</template>

<style scoped>
.efficiency-chart-wrapper {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  padding: 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark-theme {
  background: linear-gradient(
    135deg, 
    rgba(30, 41, 59, 0.6) 0%, 
    rgba(15, 23, 42, 0.8) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    0 4px 24px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.light-theme {
  background: linear-gradient(
    135deg, 
    rgba(255, 255, 255, 0.95) 0%, 
    rgba(248, 250, 252, 0.98) 100%
  );
  border: 1px solid rgba(226, 232, 240, 0.6);
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.chart-background-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 80%;
  background: radial-gradient(
    ellipse at center,
    var(--chart-color),
    transparent 70%
  );
  opacity: 0.08;
  filter: blur(40px);
  pointer-events: none;
  z-index: 0;
}

.dark-theme .chart-background-glow {
  opacity: 0.12;
}

.chart-content {
  position: relative;
  z-index: 1;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 12px;
}

/* Custom Tooltip Styles */
:deep(.custom-tooltip) {
  padding: 12px 16px;
  border-radius: 10px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid;
  min-width: 140px;
}

:deep(.custom-tooltip.dark) {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(255, 255, 255, 0.1);
}

:deep(.custom-tooltip.light) {
  background: rgba(255, 255, 255, 0.98);
  border-color: rgba(226, 232, 240, 0.8);
}

:deep(.tooltip-header) {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  opacity: 0.7;
}

:deep(.tooltip-value) {
  font-size: 15px;
  font-weight: 700;
  color: var(--chart-color, #3b82f6);
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .efficiency-chart-wrapper {
    padding: 12px;
  }
}

/* Hover effect */
.efficiency-chart-wrapper:hover {
  transform: translateY(-2px);
}

.dark-theme:hover {
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
}

.light-theme:hover {
  box-shadow: 
    0 8px 28px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 1);
  border-color: rgba(226, 232, 240, 0.8);
}
</style>
