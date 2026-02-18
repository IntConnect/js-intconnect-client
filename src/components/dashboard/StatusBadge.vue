<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    default: 'online', // 'online', 'offline', 'standby', 'error'
  },
  showLabel: {
    type: Boolean,
    default: true,
  },
  size: {
    type: String,
    default: 'md', // 'sm', 'md', 'lg'
  },
  variant: {
    type: String,
    default: 'pill', // 'pill', 'dot', 'badge', 'card'
  },
  isDark: {
    type: Boolean,
    default: true,
  },
})

const statusConfig = computed(() => {
  const configs = {
    online: {
      label: 'Online',
      icon: '⬤',
      color: '#10b981',
      colorRgb: '16, 185, 129',
      colorLight: '#059669',
      glow: 'rgba(16, 185, 129, 0.5)',
      glowLight: 'rgba(5, 150, 105, 0.35)',
      pulse: true,
    },
    offline: {
      label: 'Offline',
      icon: '⬤',
      color: '#ef4444',
      colorRgb: '239, 68, 68',
      colorLight: '#dc2626',
      glow: 'rgba(239, 68, 68, 0.5)',
      glowLight: 'rgba(220, 38, 38, 0.35)',
      pulse: false,
    },
    standby: {
      label: 'Standby',
      icon: '⬤',
      color: '#f59e0b',
      colorRgb: '245, 158, 11',
      colorLight: '#d97706',
      glow: 'rgba(245, 158, 11, 0.5)',
      glowLight: 'rgba(217, 119, 6, 0.35)',
      pulse: true,
    },
    error: {
      label: 'Error',
      icon: '⬤',
      color: '#8b5cf6',
      colorRgb: '139, 92, 246',
      colorLight: '#7c3aed',
      glow: 'rgba(139, 92, 246, 0.5)',
      glowLight: 'rgba(124, 58, 237, 0.35)',
      pulse: true,
    },
  }
  return configs[props.status] || configs.offline
})
</script>

<template>
  <!-- ══════════════════════════════════════════════
       VARIANT: PILL (default, sleek horizontal pill)
  ══════════════════════════════════════════════ -->
  <div
    v-if="variant === 'pill'"
    class="ems-status-pill"
    :class="[`s-${status}`, `sz-${size}`, isDark ? 'dark' : 'light']"
  >
    <span class="ems-status-dot" :class="{ 'is-pulsing': statusConfig.pulse }"></span>
    <span v-if="showLabel" class="ems-status-text">{{ statusConfig.label }}</span>
  </div>

  <!-- ══════════════════════════════════════════════
       VARIANT: DOT (compact dot only)
  ══════════════════════════════════════════════ -->
  <span
    v-else-if="variant === 'dot'"
    class="ems-status-only-dot"
    :class="[`s-${status}`, `sz-${size}`, isDark ? 'dark' : 'light', { 'is-pulsing': statusConfig.pulse }]"
    :title="statusConfig.label"
  ></span>

  <!-- ══════════════════════════════════════════════
       VARIANT: BADGE (bold label badge)
  ══════════════════════════════════════════════ -->
  <div
    v-else-if="variant === 'badge'"
    class="ems-status-badge"
    :class="[`s-${status}`, `sz-${size}`, isDark ? 'dark' : 'light']"
  >
    <span class="ems-status-dot" :class="{ 'is-pulsing': statusConfig.pulse }"></span>
    <span v-if="showLabel" class="ems-status-text">{{ statusConfig.label }}</span>
    <span class="ems-badge-glow"></span>
  </div>

  <!-- ══════════════════════════════════════════════
       VARIANT: CARD (full status card mini)
  ══════════════════════════════════════════════ -->
  <div
    v-else-if="variant === 'card'"
    class="ems-status-card"
    :class="[`s-${status}`, isDark ? 'dark' : 'light']"
  >
    <div class="ems-status-card-inner">
      <span class="ems-status-dot" :class="{ 'is-pulsing': statusConfig.pulse }"></span>
      <span class="ems-status-text">{{ statusConfig.label }}</span>
    </div>
    <span class="ems-status-card-line"></span>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════
   CSS VARIABLES PER STATUS
═══════════════════════════════════════ */

/* ─── Online ─── */
.s-online {
  --sc: #10b981;
  --sc-glow: rgba(16, 185, 129, 0.45);
  --sc-bg: rgba(16, 185, 129, 0.10);
  --sc-border: rgba(16, 185, 129, 0.28);
  --sc-text: #10b981;
}
.s-online.light {
  --sc: #059669;
  --sc-glow: rgba(5, 150, 105, 0.35);
  --sc-bg: rgba(5, 150, 105, 0.09);
  --sc-border: rgba(5, 150, 105, 0.22);
  --sc-text: #059669;
}

/* ─── Offline ─── */
.s-offline {
  --sc: #ef4444;
  --sc-glow: rgba(239, 68, 68, 0.45);
  --sc-bg: rgba(239, 68, 68, 0.10);
  --sc-border: rgba(239, 68, 68, 0.28);
  --sc-text: #ef4444;
}
.s-offline.light {
  --sc: #dc2626;
  --sc-glow: rgba(220, 38, 38, 0.35);
  --sc-bg: rgba(220, 38, 38, 0.09);
  --sc-border: rgba(220, 38, 38, 0.22);
  --sc-text: #dc2626;
}

/* ─── Standby ─── */
.s-standby {
  --sc: #f59e0b;
  --sc-glow: rgba(245, 158, 11, 0.45);
  --sc-bg: rgba(245, 158, 11, 0.10);
  --sc-border: rgba(245, 158, 11, 0.28);
  --sc-text: #f59e0b;
}
.s-standby.light {
  --sc: #d97706;
  --sc-glow: rgba(217, 119, 6, 0.35);
  --sc-bg: rgba(217, 119, 6, 0.09);
  --sc-border: rgba(217, 119, 6, 0.22);
  --sc-text: #d97706;
}

/* ─── Error ─── */
.s-error {
  --sc: #8b5cf6;
  --sc-glow: rgba(139, 92, 246, 0.45);
  --sc-bg: rgba(139, 92, 246, 0.10);
  --sc-border: rgba(139, 92, 246, 0.28);
  --sc-text: #8b5cf6;
}
.s-error.light {
  --sc: #7c3aed;
  --sc-glow: rgba(124, 58, 237, 0.35);
  --sc-bg: rgba(124, 58, 237, 0.09);
  --sc-border: rgba(124, 58, 237, 0.22);
  --sc-text: #7c3aed;
}

/* ═══════════════════════════════════════
   SHARED DOT STYLES
═══════════════════════════════════════ */
.ems-status-dot {
  display: inline-block;
  border-radius: 50%;
  background: var(--sc);
  box-shadow: 0 0 6px 1px var(--sc-glow);
  flex-shrink: 0;
  position: relative;
}

/* Size: dot within pill/badge */
.sz-sm .ems-status-dot { width: 6px;  height: 6px; }
.sz-md .ems-status-dot { width: 8px;  height: 8px; }
.sz-lg .ems-status-dot { width: 10px; height: 10px; }

/* ─── Pulse ring animation ─── */
.ems-status-dot.is-pulsing::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 2px solid var(--sc);
  opacity: 0;
  animation: status-pulse 2s ease-out infinite;
}

@keyframes status-pulse {
  0%   { opacity: 0.8; transform: scale(1); }
  70%  { opacity: 0;   transform: scale(2.2); }
  100% { opacity: 0;   transform: scale(2.4); }
}

/* ═══════════════════════════════════════
   VARIANT: PILL
═══════════════════════════════════════ */
.ems-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border-radius: 999px;
  background: var(--sc-bg);
  border: 1px solid var(--sc-border);
  font-weight: 600;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: var(--sc-text);
  transition: all 0.3s ease;
  cursor: default;
  position: relative;
  overflow: hidden;
}

.ems-status-pill::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: shimmer-pill 3s ease-in-out infinite;
  pointer-events: none;
}

@keyframes shimmer-pill {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.s-offline.ems-status-pill::before { animation: none; }

/* Pill sizes */
.ems-status-pill.sz-sm { padding: 3px 10px; font-size: 0.68rem; }
.ems-status-pill.sz-md { padding: 5px 13px; font-size: 0.74rem; }
.ems-status-pill.sz-lg { padding: 7px 16px; font-size: 0.82rem; }

.ems-status-pill:hover {
  background: rgba(var(--sc), 0.15);
  box-shadow: 0 0 14px 2px var(--sc-glow);
  transform: scale(1.04);
}

/* ═══════════════════════════════════════
   VARIANT: DOT ONLY
═══════════════════════════════════════ */
.ems-status-only-dot {
  display: inline-block;
  border-radius: 50%;
  background: var(--sc);
  box-shadow: 0 0 6px 1px var(--sc-glow);
  flex-shrink: 0;
  position: relative;
  cursor: default;
}

.ems-status-only-dot.sz-sm { width: 8px;  height: 8px; }
.ems-status-only-dot.sz-md { width: 11px; height: 11px; }
.ems-status-only-dot.sz-lg { width: 14px; height: 14px; }

.ems-status-only-dot.is-pulsing::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 2px solid var(--sc);
  opacity: 0;
  animation: status-pulse 2s ease-out infinite;
}

/* ═══════════════════════════════════════
   VARIANT: BADGE (bolder, more dramatic)
═══════════════════════════════════════ */
.ems-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border-radius: 8px;
  background: var(--sc-bg);
  border: 1px solid var(--sc-border);
  border-left: 3px solid var(--sc);
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--sc-text);
  position: relative;
  overflow: hidden;
  cursor: default;
  transition: all 0.25s ease;
}

.ems-status-badge.sz-sm { padding: 4px 10px; font-size: 0.66rem; }
.ems-status-badge.sz-md { padding: 6px 13px; font-size: 0.72rem; }
.ems-status-badge.sz-lg { padding: 8px 16px; font-size: 0.80rem; }

/* Glow sweep on badge */
.ems-badge-glow {
  position: absolute;
  top: 0; left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
  animation: badge-sweep 3.5s ease-in-out infinite;
  pointer-events: none;
}

.s-offline .ems-badge-glow { animation: none; }

@keyframes badge-sweep {
  0%   { left: -100%; }
  50%  { left: 160%;  }
  100% { left: 160%;  }
}

.ems-status-badge:hover {
  box-shadow: 0 2px 16px var(--sc-glow);
  transform: translateY(-1px);
}

/* ═══════════════════════════════════════
   VARIANT: CARD (full-width mini status)
═══════════════════════════════════════ */
.ems-status-card {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  min-width: 90px;
  cursor: default;
}

.ems-status-card-inner {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--sc-text);
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: 0.6px;
  text-transform: uppercase;
}

.ems-status-card-line {
  display: block;
  width: 100%;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--sc) 0%, transparent 100%);
  animation: line-breathe 2.5s ease-in-out infinite;
}

.s-offline .ems-status-card-line {
  background: var(--sc);
  animation: none;
  opacity: 0.5;
}

@keyframes line-breathe {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

/* ═══════════════════════════════════════
   STATUS TEXT
═══════════════════════════════════════ */
.ems-status-text {
  line-height: 1;
}
</style>
