<script setup>
import { useTheme } from 'vuetify'

const props = defineProps({
  realtimeData: {
    type: Array,
    required: true,
  },
  
  title: {
    type: String,
    default: 'Bar Chart',
  },
  subtitle: {
    type: String,
    default: 'Data visualization',
  },
  // ✅ Added colors prop with default
  colors: {
    type: Array,
    default: () => ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'],
  },
})

const vuetifyTheme = useTheme()

const colorVariables = themeColors => {
  const themeSecondaryTextColor = `rgba(${hexToRgb(themeColors.colors['on-surface'])},${themeColors.variables['medium-emphasis-opacity']})`
  const themeDisabledTextColor = `rgba(${hexToRgb(themeColors.colors['on-surface'])},${themeColors.variables['disabled-opacity']})`
  const themeBorderColor = `rgba(${hexToRgb(String(themeColors.variables['border-color']))},${themeColors.variables['border-opacity']})`
  const themePrimaryTextColor = `rgba(${hexToRgb(themeColors.colors['on-surface'])},${themeColors.variables['high-emphasis-opacity']})`
  
  return { themeSecondaryTextColor, themeDisabledTextColor, themeBorderColor, themePrimaryTextColor }
}

const getBarChartConfig = () => {
  const {
    themeSecondaryTextColor,
    themeDisabledTextColor,
    themeBorderColor,
    themePrimaryTextColor,
  } = colorVariables(vuetifyTheme.current.value)

  return {
    chart: {
      type: 'bar',
      parentHeightOffset: 0,
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
    },
    colors: props.colors, // ✅ Use from props
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 8,
        borderRadiusApplication: 'end',
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    legend: {
      show: true,
      position: 'bottom', // ✅ Changed from 'top' to 'bottom'
      horizontalAlign: 'center', // ✅ Changed from 'left' to 'center'
      labels: {
        colors: themeSecondaryTextColor,
      },
      markers: {
        radius: 4,
      },
    },
    grid: {
      padding: { top: -10 },
      borderColor: 'rgba(255, 255, 255, 0.1)',
      strokeDashArray: 4,
    },
    xaxis: {
      type: 'datetime',
      axisBorder: { show: false },
      axisTicks: { color: 'rgba(255, 255, 255, 0.1)' },
      labels: {
        datetimeUTC: false,
        format: 'HH:mm:ss',
        style: {
          colors: themeSecondaryTextColor,
          fontSize: '0.8125rem',
        },
      },
      crosshairs: {
        stroke: { color: 'rgba(255, 255, 255, 0.1)' },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: themePrimaryTextColor,
          fontSize: '0.8125rem',
        },
      },
    },
    fill: {
      opacity: 1,
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'vertical',
        shadeIntensity: 0.5,
        gradientToColors: props.colors.map(color => color + '80'), // ✅ Use props.colors
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.8,
        stops: [0, 100],
      },
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: function (val) {
          return val
        },
      },
    },
  }
}

const chartOptions = computed(() => getBarChartConfig())
</script>

<template>
  <VCard class="chart-glass-card">
    <VCardText class="pb-2">
      <div class="d-flex align-center justify-space-between mb-3">
        <div class="d-flex align-center gap-2">
          <div class="chart-icon-wrapper">
            <VIcon
              icon="tabler-chart-bar"
              size="20"
              class="chart-icon"
            />
          </div>
          <div>
            <h6 class="text-left text-h6 text-white font-weight-bold mb-0">
              {{ title }}
            </h6>
            <span class="text-caption text-grey-lighten-1">{{ subtitle }}</span>
          </div>
        </div>

        <div class="d-flex align-center gap-1">
          <div class="status-dot-live" />
          <span class="text-caption text-success font-weight-medium">Live</span>
        </div>
      </div>
    </VCardText>

    <VCardText class="pt-0">
      <div class="chart-container">
        <VueApexCharts
          :options="chartOptions"
          :series="realtimeData"
          height="400"
          type="bar"
        />
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped>
.chart-glass-card {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%) !important;
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

.chart-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2));
  border: 1px solid rgba(16, 185, 129, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
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
