<script setup>
import { useConfigStore } from '@core/stores/config'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useTheme } from 'vuetify'

const props = defineProps({
  trendData: {
    type: Array,
    default: () => [
      { day: 'Mon', active: 1, resolved: 1, finished: 1 },
      { day: 'Tue', active: 0, resolved: 1, finished: 1 },
      { day: 'Wed', active: 2, resolved: 1, finished: 1 },
      { day: 'Thu', active: 0, resolved: 0, finished: 1 },
      { day: 'Fri', active: 2, resolved: 2, finished: 1 },
      { day: 'Sat', active: 1, resolved: 0, finished: 1 },
      { day: 'Sun', active: 0, resolved: 0, finished: 1 },
    ],
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

// Series data for ApexCharts
const series = computed(() => [
  {
    name: 'Active',
    data: props.trendData.map(item => item.active),
  },
  {
    name: 'Resolved',
    data: props.trendData.map(item => item.resolved),
  },
  {
    name: 'Finished',
    data: props.trendData.map(item => item.finished),
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
      type: 'bar',
      height: 350,
      stacked: true,
      parentHeightOffset: 0,
      toolbar: { 
        show: false,
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
      },
    },
    colors: ['#ef4444', '#f59e0b', '#22c55e'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 8,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'all',
        dataLabels: {
          position: 'center',
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
    xaxis: {
      categories: props.trendData.map(item => item.day),
      axisBorder: { 
        show: true,
        color: isDark.value 
          ? 'rgba(255, 255, 255, 0.08)' 
          : 'rgba(0, 0, 0, 0.08)',
      },
      axisTicks: { 
        show: false,
      },
      labels: {
        style: {
          colors: themeSecondaryTextColor,
          fontSize: '13px',
          fontWeight: 600,
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: themePrimaryTextColor,
          fontSize: '12px',
          fontWeight: 600,
        },
        formatter: value => Math.round(value),
      },
      title: {
        text: 'Issue Count',
        style: {
          color: themeSecondaryTextColor,
          fontSize: '12px',
          fontWeight: 600,
        },
      },
    },
    grid: {
      show: true,
      borderColor: isDark.value 
        ? 'rgba(255, 255, 255, 0.05)' 
        : 'rgba(0, 0, 0, 0.04)',
      strokeDashArray: 3,
      padding: {
        top: 0,
        right: 10,
        bottom: 0,
        left: 10,
      },
      xaxis: {
        lines: { show: false },
      },
      yaxis: {
        lines: { show: true },
      },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '13px',
      fontWeight: 600,
      labels: {
        colors: themePrimaryTextColor,
      },
      markers: {
        offsetX: -4,
      },
      itemMargin: {
        horizontal: 12,
        vertical: 8,
      },
    },
    tooltip: {
      enabled: true,
      theme: isDark.value ? 'dark' : 'light',
      style: {
        fontSize: '13px',
      },
      y: {
        formatter: value => `${value} issue${value !== 1 ? 's' : ''}`,
      },
      marker: {
        show: true,
      },
      custom: function({ series, seriesIndex, dataPointIndex, w }) {
        const active = series[0][dataPointIndex]
        const resolved = series[1][dataPointIndex]
        const finished = series[2][dataPointIndex]
        const total = active + resolved + finished
        const day = w.globals.labels[dataPointIndex]
        
        return `
          <div class="breakdown-tooltip ${isDark.value ? 'dark' : 'light'}">
            <div class="tooltip-header">${day}</div>
            <div class="tooltip-body">
              <div class="tooltip-row">
                <span class="dot" style="background: #ef4444;"></span>
                <span class="label">Active:</span>
                <span class="value">${active}</span>
              </div>
              <div class="tooltip-row">
                <span class="dot" style="background: #f59e0b;"></span>
                <span class="label">Resolved:</span>
                <span class="value">${resolved}</span>
              </div>
              <div class="tooltip-row">
                <span class="dot" style="background: #22c55e;"></span>
                <span class="label">Finished:</span>
                <span class="value">${finished}</span>
              </div>
              <div class="tooltip-divider"></div>
              <div class="tooltip-row total">
                <span class="label">Total:</span>
                <span class="value">${total}</span>
              </div>
            </div>
          </div>
        `
      },
    },
    responsive: [{
      breakpoint: 1200,
      options: {
        chart: {
          height: 320,
        },
        plotOptions: {
          bar: {
            columnWidth: '70%',
          },
        },
      },
    }],
  }
})

// Statistics
const statistics = computed(() => {
  const totalActive = props.trendData.reduce((sum, item) => sum + item.active, 0)
  const totalResolved = props.trendData.reduce((sum, item) => sum + item.resolved, 0)
  const totalFinished = props.trendData.reduce((sum, item) => sum + item.finished, 0)
  const total = totalActive + totalResolved + totalFinished
  
  return {
    active: totalActive,
    resolved: totalResolved,
    finished: totalFinished,
    total,
  }
})

onMounted(async () => {
  await nextTick()
  chartReady.value = true
})
</script>

<template>
  <div 
    class="breakdown-chart-wrapper"
    :class="isDark ? 'dark-theme' : 'light-theme'"
  >
    <!-- Statistics Cards -->
    <div class="stats-grid mb-4">
      <div class="stat-card active">
        <div class="stat-icon">
          <VIcon
            icon="tabler-alert-circle"
            size="20"
          />
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ statistics.active }}
          </div>
          <div class="stat-label">
            Active
          </div>
        </div>
      </div>
      
      <div class="stat-card resolved">
        <div class="stat-icon">
          <VIcon
            icon="tabler-progress-check"
            size="20"
          />
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ statistics.resolved }}
          </div>
          <div class="stat-label">
            Resolved
          </div>
        </div>
      </div>
      
      <div class="stat-card finished">
        <div class="stat-icon">
          <VIcon
            icon="tabler-circle-check"
            size="20"
          />
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ statistics.finished }}
          </div>
          <div class="stat-label">
            Finished
          </div>
        </div>
      </div>
    </div>

    <!-- Chart Container -->
    <div class="chart-container">
      <div class="chart-glow-effect" />
      
      <div class="chart-content">
        <VueApexCharts 
          v-if="chartReady"
          ref="chartRef" 
          :options="chartOptions" 
          :series="series" 
          height="350" 
          type="bar" 
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.breakdown-chart-wrapper {
  border-radius: 20px;
  padding: 20px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: row;
  gap: 12px;
}

.dark-theme {
  background: linear-gradient(
    145deg, 
    rgba(30, 41, 59, 0.7) 0%, 
    rgba(15, 23, 42, 0.85) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.light-theme {
  background: linear-gradient(
    145deg, 
    rgba(255, 255, 255, 0.98) 0%, 
    rgba(248, 250, 252, 1) 100%
  );
  border: 1px solid rgba(226, 232, 240, 0.7);
  box-shadow: 
    0 6px 24px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  border: 1px solid;
}

.dark-theme .stat-card {
  background: rgba(255, 255, 255, 0.04);
}

.light-theme .stat-card {
  background: rgba(255, 255, 255, 0.7);
}

.stat-card.active {
  border-color: rgba(239, 68, 68, 0.3);
}

.stat-card.resolved {
  border-color: rgba(245, 158, 11, 0.3);
}

.stat-card.finished {
  border-color: rgba(34, 197, 94, 0.3);
}

.stat-card.total {
  border-color: rgba(59, 130, 246, 0.3);
}

.stat-card:hover {
  transform: translateY(-2px);
}

.dark-theme .stat-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

.light-theme .stat-card:hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.stat-card.active .stat-icon {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.stat-card.resolved .stat-icon {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.stat-card.finished .stat-icon {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.stat-card.total .stat-icon {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.7;
}

/* Chart Container */
.chart-container {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  padding: 16px;
  flex-grow: 1;
}

.dark-theme .chart-container {
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.light-theme .chart-container {
  background: rgba(248, 250, 252, 0.6);
  border: 1px solid rgba(226, 232, 240, 0.6);
}

.chart-glow-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70%;
  height: 70%;
  background: radial-gradient(
    ellipse at center,
    rgba(59, 130, 246, 0.15),
    transparent 70%
  );
  filter: blur(60px);
  pointer-events: none;
  z-index: 0;
}

.chart-content {
  position: relative;
  z-index: 1;
}

/* Custom Tooltip Styles */
:deep(.breakdown-tooltip) {
  padding: 16px;
  border-radius: 12px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  border: 1px solid;
  min-width: 180px;
}

:deep(.breakdown-tooltip.dark) {
  background: rgba(30, 41, 59, 0.98);
  border-color: rgba(255, 255, 255, 0.12);
}

:deep(.breakdown-tooltip.light) {
  background: rgba(255, 255, 255, 0.98);
  border-color: rgba(226, 232, 240, 0.9);
}

:deep(.tooltip-header) {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid;
}

:deep(.breakdown-tooltip.dark .tooltip-header) {
  border-color: rgba(255, 255, 255, 0.1);
}

:deep(.breakdown-tooltip.light .tooltip-header) {
  border-color: rgba(0, 0, 0, 0.08);
}

:deep(.tooltip-body) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.tooltip-row) {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

:deep(.tooltip-row .dot) {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

:deep(.tooltip-row .label) {
  flex: 1;
  font-weight: 500;
  opacity: 0.8;
}

:deep(.tooltip-row .value) {
  font-weight: 700;
  min-width: 24px;
  text-align: right;
}

:deep(.tooltip-divider) {
  height: 1px;
  margin: 4px 0;
}

:deep(.breakdown-tooltip.dark .tooltip-divider) {
  background: rgba(255, 255, 255, 0.1);
}

:deep(.breakdown-tooltip.light .tooltip-divider) {
  background: rgba(0, 0, 0, 0.08);
}

:deep(.tooltip-row.total) {
  font-weight: 700;
  font-size: 14px;
  margin-top: 4px;
}

/* Responsive */
@media (max-width: 768px) {
  .breakdown-chart-wrapper {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Hover Effect */
.breakdown-chart-wrapper:hover {
  transform: translateY(-2px);
}

.dark-theme:hover {
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.light-theme:hover {
  box-shadow: 
    0 10px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}
</style>
