<script setup>
import { useConfigStore } from '@core/stores/config'
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const props = defineProps({
  copValue: {
    type: Number,
    required: false,
    default: 0,
  },
  header: {
    type: String,
    required: false,
    default: "",
  },
  subHeader: {
    type: String,
    required: false,
    default: "",
  },
})

// Theme Detection (sama seperti KPI card)
const configStore = useConfigStore()
const vuetifyTheme = useTheme()

const isDark = computed(() => {
  if (configStore.theme === 'system') {
    return vuetifyTheme.global.current.value.dark
  }
  return configStore.theme === 'dark'
})

const copMax = 8.0

const series = computed(() => {
  const value = Number((props.copValue / copMax) * 100)
  return [Math.min(Math.max(value, 0), 100)]
})

const copStatus = computed(() => {
  const dark = isDark.value

  if (props.copValue >= 4.0) {
    return {
      label: 'Excellent',
      sublabel: 'Peak Efficiency',
      // Dark
      color:        dark ? '#10b981' : '#059669',
      colorRgb:     dark ? '16, 185, 129' : '5, 150, 105',
      borderColor:  dark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(5, 150, 105, 0.30)',
      bgColor:      dark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(5, 150, 105, 0.10)',
      glowColor:    dark ? 'rgba(16, 185, 129, 0.20)' : 'rgba(5, 150, 105, 0.15)',
      gradientFrom: dark ? '#10b981' : '#059669',
      gradientTo:   dark ? '#06b6d4' : '#0891b2',
      pulse: true,
    }
  } else if (props.copValue >= 3.0) {
    return {
      label: 'Good',
      sublabel: 'Normal Range',
      color:        dark ? '#3b82f6' : '#2563eb',
      colorRgb:     dark ? '59, 130, 246' : '37, 99, 235',
      borderColor:  dark ? 'rgba(59, 130, 246, 0.35)' : 'rgba(37, 99, 235, 0.30)',
      bgColor:      dark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.10)',
      glowColor:    dark ? 'rgba(59, 130, 246, 0.20)' : 'rgba(37, 99, 235, 0.15)',
      gradientFrom: dark ? '#3b82f6' : '#2563eb',
      gradientTo:   dark ? '#8b5cf6' : '#7c3aed',
      pulse: false,
    }
  } else if (props.copValue >= 2.0) {
    return {
      label: 'Warning',
      sublabel: 'Below Optimal',
      color:        dark ? '#f59e0b' : '#d97706',
      colorRgb:     dark ? '245, 158, 11' : '217, 119, 6',
      borderColor:  dark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(217, 119, 6, 0.30)',
      bgColor:      dark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(217, 119, 6, 0.10)',
      glowColor:    dark ? 'rgba(245, 158, 11, 0.20)' : 'rgba(217, 119, 6, 0.15)',
      gradientFrom: dark ? '#f59e0b' : '#d97706',
      gradientTo:   dark ? '#ef4444' : '#dc2626',
      pulse: true,
    }
  } else {
    return {
      label: 'Alarm',
      sublabel: 'Critical',
      color:        dark ? '#ef4444' : '#dc2626',
      colorRgb:     dark ? '239, 68, 68' : '220, 38, 38',
      borderColor:  dark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(220, 38, 38, 0.30)',
      bgColor:      dark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(220, 38, 38, 0.10)',
      glowColor:    dark ? 'rgba(239, 68, 68, 0.20)' : 'rgba(220, 38, 38, 0.15)',
      gradientFrom: dark ? '#ef4444' : '#dc2626',
      gradientTo:   dark ? '#dc2626' : '#b91c1c',
      pulse: true,
    }
  }
})

// SVG arc colors — different opacity for light vs dark
const trackStroke = computed(() =>
  isDark.value ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)'
)
const tickMajor = computed(() =>
  isDark.value ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.18)'
)
const tickMinor = computed(() =>
  isDark.value ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.07)'
)
const tickLabel = computed(() =>
  isDark.value ? 'rgba(255,255,255,0.30)' : 'rgba(15,23,42,0.35)'
)
const copLabel = computed(() =>
  isDark.value ? 'rgba(148,163,184,0.65)' : 'rgba(71,85,105,0.70)'
)
const minMaxLabel = computed(() =>
  isDark.value ? 'rgba(148,163,184,0.38)' : 'rgba(100,116,139,0.55)'
)

// SVG gauge arc path
const gaugeArc = computed(() => {
  const cx = 110, cy = 100, r = 78
  const startAngle = 210
  const totalSweep = 240
  const fillSweep = (series.value[0] / 100) * totalSweep

  function pt(angle) {
    const rad = (angle - 90) * Math.PI / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  const s = pt(startAngle)
  const te = pt(startAngle + totalSweep)
  const fe = pt(startAngle + fillSweep)

  return {
    track: `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 1 1 ${te.x.toFixed(2)} ${te.y.toFixed(2)}`,
    fill: fillSweep > 1
      ? `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${fillSweep > 180 ? 1 : 0} 1 ${fe.x.toFixed(2)} ${fe.y.toFixed(2)}`
      : '',
    cx, cy,
  }
})

// Tick marks
const ticks = computed(() => {
  const { cx, cy } = gaugeArc.value
  return Array.from({ length: 9 }, (_, i) => {
    const angle = 210 + (i / 8) * 240
    const rad = (angle - 90) * Math.PI / 180
    const major = i % 2 === 0
    const rO = 90, rI = major ? 80 : 84, rL = 100
    return {
      x1: cx + rI * Math.cos(rad), y1: cy + rI * Math.sin(rad),
      x2: cx + rO * Math.cos(rad), y2: cy + rO * Math.sin(rad),
      lx: cx + rL * Math.cos(rad), ly: cy + rL * Math.sin(rad),
      label: i, major,
    }
  })
})
</script>

<template>
  <div
    class="cop-card"
    :class="{ 'cop-light': !isDark }"
    :style="{
      '--sc':        copStatus.color,
      '--sc-rgb':    copStatus.colorRgb,
      '--sc-border': copStatus.borderColor,
      '--sc-bg':     copStatus.bgColor,
      '--grad-from': copStatus.gradientFrom,
      '--grad-to':   copStatus.gradientTo,
    }"
  >
    <div class="cop-top-line" />
    <div class="cop-glow-blob" />
    <span class="sparkle sp1" />
    <span class="sparkle sp2" />
    <span class="sparkle sp3" />

    <!-- Header -->
    <div class="cop-header">
      <div class="cop-header-left">
        <div class="cop-icon-wrap">
          <VIcon icon="tabler-gauge" size="17" class="cop-icon" />
        </div>
        <div>
          <div class="cop-title">{{ props.header }}</div>
          <div class="cop-subtitle">{{ props.subHeader }}</div>
        </div>
      </div>

      <div class="cop-badge" :class="{ pulsing: copStatus.pulse }">
        <span class="badge-dot" :class="{ pulsing: copStatus.pulse }" />
        <span class="badge-label">{{ copStatus.label }}</span>
      </div>
    </div>

    <!-- Gauge SVG -->
    <div class="cop-gauge-wrap">
      <svg viewBox="0 0 220 150" class="cop-gauge-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cop-arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" :stop-color="copStatus.gradientFrom" />
            <stop offset="100%" :stop-color="copStatus.gradientTo" />
          </linearGradient>
          <filter id="cop-arc-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="cop-val-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Track -->
        <path :d="gaugeArc.track" fill="none" :stroke="trackStroke"
          stroke-width="10" stroke-linecap="round" />

        <!-- Ticks -->
        <g v-for="(t, i) in ticks" :key="i">
          <line :x1="t.x1" :y1="t.y1" :x2="t.x2" :y2="t.y2"
            :stroke="t.major ? tickMajor : tickMinor"
            :stroke-width="t.major ? 1.5 : 1" />
          <text v-if="t.major" :x="t.lx" :y="t.ly"
            text-anchor="middle" dominant-baseline="middle"
            :fill="tickLabel" font-size="8" font-family="Inter, sans-serif">
            {{ t.label }}
          </text>
        </g>

        <!-- Fill glow -->
        <path v-if="gaugeArc.fill" :d="gaugeArc.fill" fill="none"
          :stroke="copStatus.gradientFrom" stroke-width="14"
          stroke-linecap="round" opacity="0.18" filter="url(#cop-arc-glow)" />

        <!-- Fill arc -->
        <path v-if="gaugeArc.fill" :d="gaugeArc.fill" fill="none"
          stroke="url(#cop-arc-grad)" stroke-width="10" stroke-linecap="round" />

        <!-- COP value -->
        <text :x="gaugeArc.cx" :y="gaugeArc.cy - 8"
          text-anchor="middle" dominant-baseline="middle"
          :fill="copStatus.gradientFrom" font-size="32" font-weight="700"
          font-family="Inter, sans-serif" filter="url(#cop-val-glow)">
          {{ props.copValue.toFixed(1) }}
        </text>

        <!-- COP label -->
        <text :x="gaugeArc.cx" :y="gaugeArc.cy + 16"
          text-anchor="middle" :fill="copLabel"
          font-size="9" font-weight="500" letter-spacing="1.5"
          font-family="Inter, sans-serif">COP</text>

        <!-- Min / Max -->
        <text x="24" y="140" :fill="minMaxLabel" font-size="8" font-family="Inter, sans-serif">0.0</text>
        <text x="196" y="140" :fill="minMaxLabel" font-size="8"
          font-family="Inter, sans-serif" text-anchor="end">8.0</text>
      </svg>

      <div class="cop-sublabel">{{ copStatus.sublabel }}</div>
    </div>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════
   CARD — Dark (default)
═══════════════════════════════ */
.cop-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px !important;
  border: 1px solid rgba(255, 255, 255, 0.09) !important;
  border-top: 3px solid var(--sc) !important;
  background: rgba(15, 23, 42, 0.72) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05);
  padding: 18px 18px 22px;
  transition: transform 0.3s cubic-bezier(.4,0,.2,1), box-shadow 0.3s ease, background 0.35s ease;
  font-family: 'Inter', sans-serif;
}

.cop-card:hover {
  transform: translateY(-5px);
  box-shadow:
    0 12px 40px rgba(0,0,0,0.4),
    0 0 0 1px rgba(var(--sc-rgb), 0.22),
    0 0 50px rgba(var(--sc-rgb), 0.07);
}

/* ═══════════════════════════════
   CARD — Light override
═══════════════════════════════ */
.cop-card.cop-light {
  background: rgba(255, 255, 255, 0.95) !important;
  border-color: rgba(37, 99, 235, 0.12) !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07), inset 0 1px 0 rgba(255,255,255,0.8) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.cop-card.cop-light:hover {
  box-shadow:
    0 8px 28px rgba(0, 0, 0, 0.10),
    0 0 0 1px rgba(var(--sc-rgb), 0.20),
    0 0 40px rgba(var(--sc-rgb), 0.06) !important;
}

/* ═══════════════════════════════
   DECORATIVE ELEMENTS
═══════════════════════════════ */

/* Top scan line — dark: animated gradient */
.cop-top-line {
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, var(--sc), transparent);
  animation: line-scan 4s ease-in-out infinite;
}
@keyframes line-scan { 0%,100%{opacity:.35} 50%{opacity:1} }

/* Top line — light: solid full-width, no fade */
.cop-light .cop-top-line {
  background: var(--sc);
  animation: none;
  opacity: 1;
}

/* Glow blob — subtler in light */
.cop-glow-blob {
  position: absolute; top:-60%; left:-30%; width:200%; height:200%;
  background: radial-gradient(ellipse 50% 40% at 50% 50%, rgba(var(--sc-rgb),.09) 0%, transparent 70%);
  animation: blob-spin 10s linear infinite; pointer-events: none;
}
.cop-light .cop-glow-blob {
  background: radial-gradient(ellipse 50% 40% at 50% 50%, rgba(var(--sc-rgb),.05) 0%, transparent 70%);
}
@keyframes blob-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }

/* Sparkles */
.sparkle {
  position: absolute; width:3px; height:3px; border-radius:50%;
  background: var(--sc); box-shadow:0 0 6px var(--sc);
  pointer-events:none; animation:sp-float 3.5s ease-in-out infinite;
}
.sp1{top:18%;right:12%;animation-delay:0s}
.sp2{top:55%;left:8%; animation-delay:1.2s}
.sp3{bottom:25%;right:18%;animation-delay:2.4s}
@keyframes sp-float {
  0%,100%{opacity:0;transform:translateY(0) scale(.8)}
  50%    {opacity:1;transform:translateY(-14px) scale(1.6)}
}
/* Sparkles dimmer in light mode */
.cop-light .sparkle { opacity: 0.6; }

/* ═══════════════════════════════
   HEADER
═══════════════════════════════ */
.cop-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 10px; position: relative; z-index: 1; margin-bottom: 6px;
}
.cop-header-left { display:flex; align-items:flex-start; gap:10px; }

.cop-icon-wrap {
  width:34px; height:34px; border-radius:9px;
  background:rgba(var(--sc-rgb),.14); border:1px solid rgba(var(--sc-rgb),.25);
  display:flex; align-items:center; justify-content:center;
  color:var(--sc); flex-shrink:0; transition:all .3s ease;
}
.cop-card:hover .cop-icon-wrap {
  transform:rotate(-8deg) scale(1.08);
  box-shadow:0 4px 14px rgba(var(--sc-rgb),.3);
}
.cop-icon { filter: drop-shadow(0 0 4px rgba(var(--sc-rgb),.5)); }

/* Text colors — dark */
.cop-title    { font-size:.875rem; font-weight:600; color:#f1f5f9; line-height:1.2; }
.cop-subtitle { font-size:.72rem;  color:#64748b; margin-top:2px; }
.cop-sublabel { font-size:.72rem;  color:#64748b; margin-top:-4px; }

/* Text colors — light */
.cop-light .cop-title    { color:#0f172a; }
.cop-light .cop-subtitle { color:#94a3b8; }
.cop-light .cop-sublabel { color:#94a3b8; }

/* ═══════════════════════════════
   STATUS BADGE
═══════════════════════════════ */
.cop-badge {
  display:inline-flex; align-items:center; gap:5px;
  padding:4px 9px; border-radius:7px;
  background: var(--sc-bg, rgba(var(--sc-rgb),.12));
  border:1px solid var(--sc-border);
  flex-shrink:0; cursor:default;
}
.cop-badge.pulsing { animation:badge-breathe 2.2s ease-in-out infinite; }
@keyframes badge-breathe {
  0%,100%{box-shadow:0 0 0 0 rgba(var(--sc-rgb),0)}
  50%    {box-shadow:0 0 10px 3px rgba(var(--sc-rgb),.22)}
}

.badge-dot {
  width:6px; height:6px; border-radius:50%;
  background:var(--sc); box-shadow:0 0 5px rgba(var(--sc-rgb),.7);
  position:relative; flex-shrink:0;
}
.badge-dot.pulsing::after {
  content:''; position:absolute; inset:-3px; border-radius:50%;
  border:1.5px solid var(--sc); opacity:0;
  animation:dot-ring 2s ease-out infinite;
}
@keyframes dot-ring {
  0%  {opacity:.7;transform:scale(1)}
  70% {opacity:0; transform:scale(2.4)}
  100%{opacity:0; transform:scale(2.4)}
}

.badge-label {
  font-size:.65rem; font-weight:600; letter-spacing:.4px;
  text-transform:uppercase; color:var(--sc);
}

/* ═══════════════════════════════
   GAUGE
═══════════════════════════════ */
.cop-gauge-wrap {
  position:relative; z-index:1;
  display:flex; flex-direction:column; align-items:center;
  margin-top:2px;
}
.cop-gauge-svg { width:100%; max-width:220px; overflow:visible; }
</style>
