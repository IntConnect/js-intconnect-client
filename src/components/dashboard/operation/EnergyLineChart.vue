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
  colors: {
    type: Array,
    default: () => ['#10b981', '#8b5cf6'],
  },
})

const chartRef   = ref(null)
const chartReady = ref(false)

// Theme Detection — konsisten dengan komponen EMS lainnya
const configStore  = useConfigStore()
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

// Watch for realtime data update
watch(
  () => props.realtimeData,
  series => {
    if (!chartReady.value || !chartRef.value) return
    chartRef.value.updateSeries(
      series.map(s => ({ ...s, data: [...s.data] })),
      true,
    )
  },
  { deep: true },
)

const chartOptions = computed(() => {
  const { themeSecondaryTextColor, themePrimaryTextColor } = colorVariables(vuetifyTheme.current.value)
  const dark = isDark.value

  return {
    chart: {
      type: 'area',
      parentHeightOffset: 0,
      zoom: { enabled: false },
      toolbar: { show: false },
      background: 'transparent',
      animations: {
        enabled: true,
        easing: 'linear',
        dynamicAnimation: { speed: 300 },
      },
    },
    theme: { mode: dark ? 'dark' : 'light' },
    colors: props.colors,
    stroke: {
      curve: 'smooth',
      width: [2.5, 2.5],
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: dark ? 'dark' : 'light',
        shadeIntensity: 1,
        opacityFrom: 0.22,
        opacityTo: 0.0,
        stops: [0, 90, 100],
      },
    },
    dataLabels: { enabled: false },
    markers: {
      size: 0,
      hover: { size: 5, sizeOffset: 2 },
    },
    grid: {
      padding: { top: -8, left: 0, right: 0 },
      borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.07)',
      strokeDashArray: 5,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '12px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 500,
      markers: { width: 8, height: 8, radius: 4, offsetX: -2 },
      labels: { colors: themeSecondaryTextColor },
      itemMargin: { horizontal: 12 },
    },
    yaxis: {
      tickAmount: 5,
      labels: {
        style: {
          colors: themeSecondaryTextColor,
          fontSize: '11px',
          fontFamily: 'Inter, sans-serif',
        },
        formatter: v => v.toFixed(2),
      },
    },
    xaxis: {
      type: 'datetime',
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        datetimeUTC: false,
        format: 'HH:mm:ss',
        style: {
          colors: themeSecondaryTextColor,
          fontSize: '11px',
          fontFamily: 'Inter, sans-serif',
        },
      },
      crosshairs: {
        stroke: {
          color: dark ? 'rgba(16,185,129,0.25)' : 'rgba(5,150,105,0.35)',
          width: 1,
          dashArray: 4,
        },
      },
      tooltip: { enabled: false },
    },
    tooltip: {
      theme: dark ? 'dark' : 'light',
      style: { fontSize: '12px', fontFamily: 'Inter, sans-serif' },
      y: { formatter: v => v.toFixed(4) },
      marker: { show: true },
    },
  }
})

// Last value per channel
const lastValues = computed(() =>
  props.realtimeData.map(s => {
    const last = s.data?.at(-1)
    return Array.isArray(last) ? last[1] : last?.y ?? null
  }),
)

onMounted(async () => {
  await nextTick()
  chartReady.value = true
})
</script>

<template>
  <div
    class="area-card"
    :class="{ 'area-light': !isDark }"
    :style="{ '--c1': props.colors[0] ?? '#10b981', '--c2': props.colors[1] ?? '#8b5cf6' }"
  >
    <!-- Top accent line -->
    <div class="area-top-line" />

    <!-- Glow blob -->
    <div class="area-glow-blob" />

    <!-- ── Header ─────────────────────────── -->
    <div class="area-header">
      <div class="area-header-left">
        <div class="area-icon-wrap">
          <VIcon icon="tabler-wave-sine" size="18" class="area-icon" />
        </div>
        <div>
          <div class="area-title">{{ props.title }}</div>
          <div class="area-subtitle">{{ props.subtitle }}</div>
        </div>
      </div>

      <div class="area-header-right">
        <!-- Channel chips -->
        <div class="area-chips">
          <div
            v-for="(s, i) in realtimeData"
            :key="i"
            class="area-chip"
            :style="{ '--chip-color': props.colors[i] ?? '#10b981' }"
          >
            <span class="chip-dot" />
            <span class="chip-name">{{ s.name ?? `Ch.${i + 1}` }}</span>
            <strong class="chip-val">
              {{ lastValues[i] !== null ? Number(lastValues[i]).toFixed(3) : '—' }}
            </strong>
          </div>
        </div>

        <!-- Live badge -->
        <div class="area-live-badge">
          <span class="live-dot" />
          <span class="live-label">Live</span>
        </div>
      </div>
    </div>

    <!-- ── Divider ─────────────────────────── -->
    <div class="area-divider" />

    <!-- ── Chart body ─────────────────────── -->
    <div class="area-body">
      <VueApexCharts
        ref="chartRef"
        :options="chartOptions"
        :series="realtimeData"
        height="320"
        type="area"
      />
    </div>

    <!-- ── Footer ─────────────────────────── -->
    <div class="area-footer">
      <div class="area-footer-meta">
        <span class="footer-blink-dot" />
        <span>Streaming · 300ms refresh</span>
      </div>
      <div class="area-footer-actions">
        <button class="area-btn">
          <VIcon icon="tabler-player-pause" size="13" />
          Pause
        </button>
        <button class="area-btn area-btn--ghost">
          <VIcon icon="tabler-refresh" size="13" />
          Reset
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════
   CARD — Dark (default)
═══════════════════════════════════ */
.area-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px !important;
  border: 1px solid rgba(255, 255, 255, 0.09) !important;
  border-top: 3px solid var(--c1) !important;
  background: rgba(15, 23, 42, 0.72) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05);
  font-family: 'Inter', sans-serif;
  transition: transform 0.3s cubic-bezier(.4,0,.2,1), box-shadow 0.3s ease, background 0.35s ease;
}

.area-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 12px 40px rgba(0,0,0,0.4),
    0 0 0 1px rgba(16,185,129,0.18),
    0 0 50px rgba(16,185,129,0.06);
}

/* ═══════════════════════════════════
   CARD — Light override
═══════════════════════════════════ */
.area-card.area-light {
  background: rgba(255, 255, 255, 0.95) !important;
  border-color: rgba(37, 99, 235, 0.12) !important;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.8) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.area-card.area-light:hover {
  box-shadow:
    0 8px 28px rgba(0,0,0,0.10),
    0 0 0 1px rgba(16,185,129,0.16),
    0 0 40px rgba(16,185,129,0.05) !important;
}

/* ── Top line ── */
.area-top-line {
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, var(--c1), var(--c2), transparent);
  animation: line-scan 4s ease-in-out infinite;
}
@keyframes line-scan { 0%,100%{opacity:.35} 50%{opacity:1} }

/* Light: solid, no fade */
.area-light .area-top-line {
  background: linear-gradient(90deg, var(--c1), var(--c2));
  animation: none;
  opacity: 1;
}

/* ── Glow blob ── */
.area-glow-blob {
  position: absolute; top:-60%; left:-30%; width:200%; height:200%;
  background: radial-gradient(ellipse 50% 40% at 30% 40%, rgba(16,185,129,0.08) 0%, transparent 50%),
              radial-gradient(ellipse 40% 30% at 70% 60%, rgba(139,92,246,0.06) 0%, transparent 50%);
  animation: blob-spin 12s linear infinite; pointer-events: none;
}
.area-light .area-glow-blob {
  background: radial-gradient(ellipse 50% 40% at 30% 40%, rgba(16,185,129,0.05) 0%, transparent 50%),
              radial-gradient(ellipse 40% 30% at 70% 60%, rgba(139,92,246,0.04) 0%, transparent 50%);
}
@keyframes blob-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }

/* ── Header ── */
.area-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 18px 20px 14px;
  position: relative; z-index: 1;
}

.area-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.area-icon-wrap {
  width: 36px; height: 36px;
  border-radius: 9px;
  background: rgba(16, 185, 129, 0.14);
  border: 1px solid rgba(16, 185, 129, 0.25);
  display: flex; align-items: center; justify-content: center;
  color: #10b981; flex-shrink: 0;
  transition: all 0.3s ease;
}
.area-card:hover .area-icon-wrap {
  transform: rotate(-8deg) scale(1.08);
  box-shadow: 0 4px 14px rgba(16,185,129,0.30);
}
.area-icon { filter: drop-shadow(0 0 4px rgba(16,185,129,0.5)); }

/* Text dark */
.area-title    { font-size: .875rem; font-weight: 600; color: #f1f5f9; line-height: 1.2; }
.area-subtitle { font-size: .72rem;  color: #64748b; margin-top: 2px; }
/* Text light */
.area-light .area-title    { color: #0f172a; }
.area-light .area-subtitle { color: #94a3b8; }

/* Header right */
.area-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* ── Channel chips ── */
.area-chips { display: flex; gap: 6px; }

.area-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 7px;
  font-size: 0.72rem;
  font-weight: 500;
  background: rgba(var(--chip-color-rgb, 16,185,129), 0.10);
  background: color-mix(in srgb, var(--chip-color) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--chip-color) 30%, transparent);
  color: var(--chip-color);
  transition: transform 0.2s ease;
  cursor: default;
}
.area-chip:hover { transform: translateY(-1px); }

.chip-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--chip-color);
  box-shadow: 0 0 5px var(--chip-color);
  flex-shrink: 0;
}
.chip-name { opacity: 0.8; }
.chip-val  { font-weight: 700; font-size: 0.75rem; }

/* ── Live badge ── */
.area-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 7px;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.30);
  flex-shrink: 0; cursor: default;
}

.live-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 5px rgba(16,185,129,0.7);
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
  font-size: .65rem; font-weight: 600;
  letter-spacing: .4px; text-transform: uppercase; color: #10b981;
}

/* Light live badge */
.area-light .area-live-badge { background:rgba(5,150,105,.10); border-color:rgba(5,150,105,.25); }
.area-light .live-dot        { background:#059669; box-shadow:0 0 5px rgba(5,150,105,.6); }
.area-light .live-dot::after { border-color:#059669; }
.area-light .live-label      { color:#059669; }

/* ── Divider ── */
.area-divider {
  height: 1px;
  margin: 0 20px;
  background: rgba(255,255,255,0.07);
  position: relative; z-index: 1;
}
.area-light .area-divider { background: rgba(15,23,42,0.07); }

/* ── Chart body ── */
.area-body {
  position: relative; z-index: 1;
  padding: 12px 12px 4px;
}

:deep(.apexcharts-canvas),
:deep(.apexcharts-svg) {
  background: transparent !important;
}

/* ── Footer ── */
.area-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 20px 16px;
  position: relative; z-index: 1;
}

/* Footer meta text dark */
.area-footer-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.72rem;
  color: #64748b;
}
.area-light .area-footer-meta { color: #94a3b8; }

.footer-blink-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #10b981; opacity: 0.7;
  animation: blink 2s step-end infinite;
  flex-shrink: 0;
}
@keyframes blink { 0%,100%{opacity:.7} 50%{opacity:.2} }

.area-footer-actions { display: flex; gap: 6px; }

/* Action buttons */
.area-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 7px;
  font-size: 0.72rem;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(16, 185, 129, 0.25);
  background: rgba(16, 185, 129, 0.08);
  color: #10b981;
}
.area-btn:hover {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.40);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
}
.area-btn:active { transform: translateY(0); }

.area-btn--ghost {
  border-color: rgba(255,255,255,0.12);
  background: transparent;
  color: #64748b;
}
.area-light .area-btn--ghost { border-color: rgba(15,23,42,0.12); }
.area-btn--ghost:hover {
  background: rgba(139, 92, 246, 0.08);
  border-color: rgba(139, 92, 246, 0.30);
  color: #8b5cf6;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.12);
}

/* Light button adjustments */
.area-light .area-btn {
  background: rgba(5, 150, 105, 0.08);
  border-color: rgba(5, 150, 105, 0.25);
  color: #059669;
}
.area-light .area-btn:hover {
  background: rgba(5, 150, 105, 0.14);
  border-color: rgba(5, 150, 105, 0.35);
}

/* Responsive */
@media (max-width: 640px) {
  .area-chips { display: none; }
  .area-header { padding: 14px 16px 12px; }
  .area-footer { padding: 8px 16px 14px; }
  .area-body   { padding: 8px 8px 4px; }
}
</style>
