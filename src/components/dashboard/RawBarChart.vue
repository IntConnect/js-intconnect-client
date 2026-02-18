<script setup>
import { useConfigStore } from '@core/stores/config'
import { computed } from 'vue'
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
  colors: {
    type: Array,
    default: () => ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'],
  },
})

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
  const themePrimaryTextColor   = `rgba(${hexToRgb(themeColors.colors['on-surface'])},${themeColors.variables['high-emphasis-opacity']})`
  return { themeSecondaryTextColor, themePrimaryTextColor }
}

const chartOptions = computed(() => {
  const { themeSecondaryTextColor, themePrimaryTextColor } = colorVariables(vuetifyTheme.current.value)
  const dark = isDark.value

  return {
    chart: {
      type: 'bar',
      parentHeightOffset: 0,
      background: 'transparent',
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: { enabled: true, delay: 150 },
        dynamicAnimation: { enabled: true, speed: 350 },
      },
    },
    theme: {
      mode: dark ? 'dark' : 'light',
    },
    colors: props.colors,
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 8,
        borderRadiusApplication: 'end',
        dataLabels: { position: 'top' },
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    /* ← legend dimatikan, diganti custom HTML di bawah */
    legend: { show: false },
    grid: {
      padding: { top: -10 },
      borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)',
      strokeDashArray: 4,
    },
    xaxis: {
      type: 'datetime',
      axisBorder: { show: false },
      axisTicks: { color: dark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.12)' },
      labels: {
        datetimeUTC: false,
        format: 'HH:mm:ss',
        style: { colors: themeSecondaryTextColor, fontSize: '0.8125rem' },
      },
      crosshairs: {
        stroke: { color: dark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.12)' },
      },
    },
    yaxis: {
      labels: {
        style: { colors: themePrimaryTextColor, fontSize: '0.8125rem' },
      },
    },
    fill: {
      opacity: 1,
      type: 'gradient',
      gradient: {
        shade: dark ? 'dark' : 'light',
        type: 'vertical',
        shadeIntensity: 0.5,
        gradientToColors: props.colors.map(c => c + '80'),
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.75,
        stops: [0, 100],
      },
    },
    tooltip: {
      theme: dark ? 'dark' : 'light',
      y: { formatter: val => val },
    },
  }
})

/* warna yang dipakai tiap series (fallback ke props.colors) */
const seriesColor = idx => props.colors[idx % props.colors.length]
</script>

<template>
  <div
    class="chart-card"
    :class="{ 'chart-light': !isDark }"
  >
    <!-- Top accent line -->
    <div class="chart-top-line" />

    <!-- Glow blob -->
    <div class="chart-glow-blob" />

    <!-- Header -->
    <div class="chart-header">
      <div class="chart-header-left">
        <div class="chart-icon-wrap">
          <VIcon icon="tabler-chart-bar" size="18" class="chart-icon" />
        </div>
        <div>
          <div class="chart-title">{{ props.title }}</div>
          <div class="chart-subtitle">{{ props.subtitle }}</div>
        </div>
      </div>

      <!-- Live badge -->
      <div class="chart-live-badge">
        <span class="live-dot" />
        <span class="live-label">Live</span>
      </div>
    </div>

    <!-- Chart body -->
    <div class="chart-body">
      <VueApexCharts
        :options="chartOptions"
        :series="realtimeData"
        height="400"
        type="bar"
      />
    </div>

    <!-- ─── Custom Legend ───────────────────────── -->
    <div class="chart-legend">
      <div
        v-for="(series, idx) in realtimeData"
        :key="idx"
        class="chart-legend__item"
      >
        <span
          class="chart-legend__dot"
          :style="{ background: seriesColor(idx) }"
        />
        <span class="chart-legend__label">{{ series.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════
   CARD — Dark (default)
═══════════════════════════════════ */
.chart-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px !important;
  border: 1px solid rgba(255, 255, 255, 0.09) !important;
  border-top: 3px solid #10b981 !important;
  background: rgba(15, 23, 42, 0.72) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05);
  padding: 20px 20px 16px;
  transition: transform 0.3s cubic-bezier(.4,0,.2,1), box-shadow 0.3s ease, background 0.35s ease;
  font-family: 'Inter', sans-serif;
}

.chart-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 12px 40px rgba(0,0,0,0.4),
    0 0 0 1px rgba(16,185,129,0.22),
    0 0 50px rgba(16,185,129,0.07);
}

/* ═══════════════════════════════════
   CARD — Light override
═══════════════════════════════════ */
.chart-card.chart-light {
  background: rgba(255, 255, 255, 0.95) !important;
  border-color: rgba(37, 99, 235, 0.12) !important;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.8) !important;
}

.chart-card.chart-light:hover {
  box-shadow:
    0 8px 28px rgba(0,0,0,0.10),
    0 0 0 1px rgba(16,185,129,0.18),
    0 0 40px rgba(16,185,129,0.06) !important;
}

/* ═══════════════════════════════════
   TOP LINE
═══════════════════════════════════ */
.chart-top-line {
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, #10b981, transparent);
  animation: line-scan 4s ease-in-out infinite;
}
@keyframes line-scan { 0%,100%{opacity:.35} 50%{opacity:1} }

.chart-light .chart-top-line {
  background: #10b981;
  animation: none;
  opacity: 1;
}

/* ═══════════════════════════════════
   GLOW BLOB
═══════════════════════════════════ */
.chart-glow-blob {
  position: absolute; top:-60%; left:-30%; width:200%; height:200%;
  background: radial-gradient(ellipse 50% 40% at 50% 50%, rgba(16,185,129,0.09) 0%, transparent 70%);
  animation: blob-spin 12s linear infinite; pointer-events: none;
}
.chart-light .chart-glow-blob {
  background: radial-gradient(ellipse 50% 40% at 50% 50%, rgba(16,185,129,0.05) 0%, transparent 70%);
}
@keyframes blob-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }

/* ═══════════════════════════════════
   HEADER
═══════════════════════════════════ */
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  position: relative; z-index: 1;
  margin-bottom: 14px;
}
.chart-header-left {
  display: flex; align-items: center; gap: 10px;
}
.chart-icon-wrap {
  width: 36px; height: 36px; border-radius: 9px;
  background: rgba(16, 185, 129, 0.14);
  border: 1px solid rgba(16, 185, 129, 0.25);
  display: flex; align-items: center; justify-content: center;
  color: #10b981; flex-shrink: 0; transition: all 0.3s ease;
}
.chart-card:hover .chart-icon-wrap {
  transform: rotate(-8deg) scale(1.08);
  box-shadow: 0 4px 14px rgba(16,185,129,0.30);
}
.chart-icon { filter: drop-shadow(0 0 4px rgba(16,185,129,0.5)); }

.chart-title    { font-size: .875rem; font-weight: 600; color: #f1f5f9; line-height: 1.2; }
.chart-subtitle { font-size: .72rem;  color: #64748b; margin-top: 2px; }
.chart-light .chart-title    { color: #0f172a; }
.chart-light .chart-subtitle { color: #94a3b8; }

/* ═══════════════════════════════════
   LIVE BADGE
═══════════════════════════════════ */
.chart-live-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: 7px;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.30);
  flex-shrink: 0;
}
.live-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #10b981; box-shadow: 0 0 5px rgba(16,185,129,0.7);
  position: relative; flex-shrink: 0;
}
.live-dot::after {
  content: ''; position: absolute; inset: -3px; border-radius: 50%;
  border: 1.5px solid #10b981; opacity: 0;
  animation: dot-ring 2s ease-out infinite;
}
@keyframes dot-ring {
  0%  { opacity:.7; transform:scale(1); }
  70% { opacity:0;  transform:scale(2.4); }
  100%{ opacity:0;  transform:scale(2.4); }
}
.live-label {
  font-size: .65rem; font-weight: 600; letter-spacing: .4px;
  text-transform: uppercase; color: #10b981;
}
.chart-light .chart-live-badge { background: rgba(5,150,105,0.10); border-color: rgba(5,150,105,0.25); }
.chart-light .live-dot         { background: #059669; box-shadow: 0 0 5px rgba(5,150,105,0.6); }
.chart-light .live-dot::after  { border-color: #059669; }
.chart-light .live-label       { color: #059669; }

/* ═══════════════════════════════════
   CHART BODY
═══════════════════════════════════ */
.chart-body {
  position: relative; z-index: 1;
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  padding: 10px 8px 0;
  border: 1px solid rgba(255,255,255,0.07);
}
.chart-light .chart-body {
  background: rgba(15,23,42,0.02);
  border-color: rgba(15,23,42,0.07);
}

/* ═══════════════════════════════════
   CUSTOM LEGEND
═══════════════════════════════════ */
.chart-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
  position: relative; z-index: 1;
  padding: 12px 8px 4px;
}

.chart-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  transition: background 0.2s ease, border-color 0.2s ease;
  cursor: default;
}

.chart-legend__item:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.14);
}

.chart-light .chart-legend__item {
  border-color: rgba(15,23,42,0.08);
  background: rgba(15,23,42,0.03);
}
.chart-light .chart-legend__item:hover {
  background: rgba(15,23,42,0.07);
  border-color: rgba(15,23,42,0.13);
}

.chart-legend__dot {
  width: 8px; height: 8px;
  border-radius: 2px;   /* persegi kecil — beda dari bulat biasa */
  flex-shrink: 0;
}

.chart-legend__label {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(148, 163, 184, 0.9);
  white-space: nowrap;
}
.chart-light .chart-legend__label {
  color: rgba(71, 85, 105, 0.9);
}

/* ApexCharts bg */
:deep(.apexcharts-canvas),
:deep(.apexcharts-svg) {
  background: transparent !important;
}
</style>
