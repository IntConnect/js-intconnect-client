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
    default: "offline",
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
  color: {
    type: String,
    default: 'green', // 'green', 'blue', 'warn', 'violet', 'red'
  },
  trendType: {
    type: String,
    default: 'up', // 'up', 'down', 'steady'
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

// Trend icon based on type
const trendIcon = computed(() => {
  switch (props.trendType) {
    case 'up': return 'tabler-arrow-down'
    case 'down': return 'tabler-arrow-up'
    default: return 'tabler-minus'
  }
})
</script>

<template>
  <VCard 
    class="ems-kpi-card"
    :class="[
      `c-${props.color}`,
      isDark ? '' : 'ems-light'
    ]"
  >
    <!-- Header -->
   <div class="ems-kpi-top">
  <div class="ems-kpi-top-left">
    <span class="ems-kpi-label">{{ props.title }}</span>
    <StatusBadge :status="props.badge" variant="badge" size="md" :is-dark="isDark" />
  </div>
  <div class="ems-kpi-icon-box">
    <VIcon :icon="props.icon" size="24" />
  </div>
</div>

    <!-- Value -->
    <div class="ems-kpi-val">
      <span class="ems-kpi-num">{{ typeof props.value === 'number' ? props.value.toFixed(2) : props.value }}</span>
      <span class="ems-kpi-unit">{{ props.unit }}</span>
    </div>

    <!-- Footer -->
    <div class="ems-kpi-foot">
      <VChip
        :class="[
          'ems-badge',
          `ems-badge-${props.trendType}`,
          isDark ? '' : 'ems-badge-light'
        ]"
        :prepend-icon="trendIcon"
        size="small"
        variant="flat"
      >
        {{ props.percentage }}
      </VChip>
      <span class="ems-kpi-sub">{{ props.subtitle }}</span>
    </div>

    <!-- Animated gradient overlay (before pseudo-element in CSS) -->
  </VCard>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════
   EMS KPI CARD — mengikuti desain sistem sebelumnya
   dengan CSS variables konsisten
═══════════════════════════════════════════════════════ */

.ems-kpi-card {
  position: relative;
  overflow: hidden;
  padding: 22px 22px 18px !important;
  border-radius: 14px !important;
  border: 1px solid !important;
  border-top-width: 3px !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.35s ease;
  
  /* Dark mode defaults */
  background: rgba(15, 23, 42, 0.70) !important;
  border-color: rgba(255, 255, 255, 0.10) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.30) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Light mode override */
.ems-kpi-card.ems-light {
  background: rgba(255, 255, 255, 0.95) !important;
  border-color: rgba(37, 99, 235, 0.15) !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* Gradient overlay via ::before */
.ems-kpi-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.08) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}

/* Hover effect */
.ems-kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.13) !important;
}

.ems-kpi-card.ems-light:hover {
  box-shadow: 0 8px 28px rgba(37, 99, 235, 0.15) !important;
}

/* ─── Color variants (dark) ───────────────────────── */
.ems-kpi-card.c-green {
  --accent-rgb: 16, 185, 129;
  border-top-color: #10b981 !important;
}
.ems-kpi-card.c-blue {
  --accent-rgb: 59, 130, 246;
  border-top-color: #3b82f6 !important;
}
.ems-kpi-card.c-warn {
  --accent-rgb: 245, 158, 11;
  border-top-color: #f59e0b !important;
}
.ems-kpi-card.c-violet {
  --accent-rgb: 139, 92, 246;
  border-top-color: #8b5cf6 !important;
}
.ems-kpi-card.c-red {
  --accent-rgb: 239, 68, 68;
  border-top-color: #ef4444 !important;
}

/* ─── Color variants (light) ──────────────────────── */
.ems-kpi-card.ems-light.c-green {
  --accent-rgb: 5, 150, 105;
  border-top-color: #059669 !important;
}
.ems-kpi-card.ems-light.c-blue {
  --accent-rgb: 37, 99, 235;
  border-top-color: #2563eb !important;
}
.ems-kpi-card.ems-light.c-warn {
  --accent-rgb: 217, 119, 6;
  border-top-color: #d97706 !important;
}
.ems-kpi-card.ems-light.c-violet {
  --accent-rgb: 124, 58, 237;
  border-top-color: #7c3aed !important;
}
.ems-kpi-card.ems-light.c-red {
  --accent-rgb: 220, 38, 38;
  border-top-color: #dc2626 !important;
}

/* Additional light mode gradient tweaks */
.ems-kpi-card.ems-light::before {
  background: linear-gradient(145deg, rgba(var(--accent-rgb), 0.10) 0%, rgba(255, 255, 255, 0.90) 100%);
}
.ems-kpi-card.ems-light:hover::before {
  background: linear-gradient(145deg, rgba(var(--accent-rgb), 0.12) 0%, rgba(255, 255, 255, 0.88) 100%);
}

/* ═══════════════════════════════════════════════════════
   CARD CONTENT (all relative to bring above ::before)
═══════════════════════════════════════════════════════ */
.ems-kpi-top,
.ems-kpi-val,
.ems-kpi-foot {
  position: relative;
  z-index: 1;
}

/* ─── Top section ─────────────────────────────────── */
.ems-kpi-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}

.ems-kpi-label {
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #94a3b8; /* dark default */
}

.ems-kpi-card.ems-light .ems-kpi-label {
  color: #64748b;
}

.ems-kpi-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--accent-rgb), 0.14);
  flex-shrink: 0;
  transition: all 0.3s ease;
}

/* Icon colors per variant (dark) */
.ems-kpi-card.c-green .ems-kpi-icon-box { color: #10b981; }
.ems-kpi-card.c-blue .ems-kpi-icon-box  { color: #3b82f6; }
.ems-kpi-card.c-warn .ems-kpi-icon-box  { color: #f59e0b; }
.ems-kpi-card.c-violet .ems-kpi-icon-box{ color: #8b5cf6; }
.ems-kpi-card.c-red .ems-kpi-icon-box   { color: #ef4444; }

/* Icon colors per variant (light) */
.ems-kpi-card.ems-light.c-green .ems-kpi-icon-box { color: #059669; }
.ems-kpi-card.ems-light.c-blue .ems-kpi-icon-box  { color: #2563eb; }
.ems-kpi-card.ems-light.c-warn .ems-kpi-icon-box  { color: #d97706; }
.ems-kpi-card.ems-light.c-violet .ems-kpi-icon-box{ color: #7c3aed; }
.ems-kpi-card.ems-light.c-red .ems-kpi-icon-box   { color: #dc2626; }

.ems-kpi-card:hover .ems-kpi-icon-box {
  transform: scale(1.05);
}

/* ─── Value section ───────────────────────────────── */
.ems-kpi-val {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 10px;
}

.ems-kpi-num {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  color: #f8fafc; /* dark */
}

.ems-kpi-card.ems-light .ems-kpi-num {
  color: #0f172a;
}

.ems-kpi-unit {
  font-size: 0.9rem;
  font-weight: 500;
  color: #94a3b8; /* dark */
}

.ems-kpi-card.ems-light .ems-kpi-unit {
  color: #64748b;
}

/* ─── Footer section ──────────────────────────────── */
.ems-kpi-foot {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ems-kpi-sub {
  font-size: 0.78rem;
  color: #94a3b8; /* dark */
}

.ems-kpi-card.ems-light .ems-kpi-sub {
  color: #64748b;
}

.ems-kpi-top-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ─── Badge styles ────────────────────────────────── */
.ems-badge {
  font-size: 0.78rem !important;
  font-weight: 600 !important;
  border: 1px solid !important;
  padding: 3px 9px !important;
  height: auto !important;
}

/* Dark mode badges */
.ems-badge-up {
  color: #10b981 !important;
  background: rgba(16, 185, 129, 0.12) !important;
  border-color: rgba(16, 185, 129, 0.25) !important;
}

.ems-badge-down {
  color: #ef4444 !important;
  background: rgba(239, 68, 68, 0.12) !important;
  border-color: rgba(239, 68, 68, 0.25) !important;
}

.ems-badge-steady {
  color: #94a3b8 !important;
  background: rgba(148, 163, 184, 0.10) !important;
  border-color: rgba(255, 255, 255, 0.10) !important;
}

/* Light mode badges */
.ems-badge.ems-badge-light.ems-badge-up {
  color: #059669 !important;
  background: rgba(5, 150, 105, 0.12) !important;
  border-color: rgba(5, 150, 105, 0.25) !important;
}

.ems-badge.ems-badge-light.ems-badge-down {
  color: #dc2626 !important;
  background: rgba(220, 38, 38, 0.12) !important;
  border-color: rgba(220, 38, 38, 0.25) !important;
}

.ems-badge.ems-badge-light.ems-badge-steady {
  color: #64748b !important;
  background: rgba(100, 116, 139, 0.10) !important;
  border-color: rgba(37, 99, 235, 0.15) !important;
}

/* Make sure VChip doesn't add extra styling */
.ems-badge :deep(.v-chip__content) {
  padding: 0;
}
</style>
