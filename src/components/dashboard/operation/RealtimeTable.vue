<script setup>
import { useConfigStore } from '@core/stores/config'
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const props = defineProps({
  realtimeData: {
    type: Array,
    default: () => [],
  },
  lastUpdate: {
    type: Date,
    default: () => new Date(),
  },
  machineData: {
    type: Object,
    default: () => ({
      isOnline: true,
      data: [],
    }),
  },
})

const configStore = useConfigStore()
const vuetifyTheme = useTheme()

const isDark = computed(() => {
  if (configStore.theme === 'system')
    return vuetifyTheme.global.current.value.dark
  return configStore.theme === 'dark'
})

const statusConfig = {
  active:   { color: '#10b981', rgb: '16,185,129',  icon: 'tabler-circle-check-filled', label: 'Normal'   },
  warning:  { color: '#f59e0b', rgb: '245,158,11',  icon: 'tabler-alert-circle',        label: 'Warning'  },
  inactive: { color: '#6b7280', rgb: '107,114,128', icon: 'tabler-circle-x',            label: 'Inactive' },
}

const getStatus = s => statusConfig[s] ?? statusConfig.active

const formatDateTime = d => {
  if (!d) return 'N/A'
  return new Date(d).toLocaleString('id-ID', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}
</script>

<template>
  <div class="monitor-card" :class="{ 'monitor-light': !isDark }">

    <!-- Top accent line -->
    <div class="monitor-top-line" />

    <!-- Glow blob -->
    <div class="monitor-glow-blob" />

    <!-- Sparkles -->
    <span class="sparkle sp1" />
    <span class="sparkle sp2" />

    <!-- ── Header ───────────────────────── -->
    <div class="monitor-header">
      <div class="monitor-header-left">
        <div class="monitor-icon-wrap">
          <VIcon icon="tabler-layout-dashboard" size="18" class="monitor-icon" />
        </div>
        <div>
          <div class="monitor-title">Realtime Monitoring</div>
          <div class="monitor-subtitle">
            <VIcon
              :icon="machineData.isOnline ? 'tabler-clock-hour-4' : 'tabler-clock-off'"
              size="12"
              :style="{ color: machineData.isOnline ? '#10b981' : '#64748b' }"
              style="vertical-align: middle; margin-right: 4px;"
            />
            Last update:
            <span class="monitor-subtitle-val">{{ formatDateTime(props.lastUpdate) }}</span>
          </div>
        </div>
      </div>

      <div class="monitor-header-right">
        <!-- Online/Offline badge -->
        <div
          class="monitor-status-badge"
          :class="machineData.isOnline ? 'badge-online' : 'badge-offline'"
        >
          <span class="badge-dot" :class="machineData.isOnline ? 'dot-pulse' : ''" />
          <span class="badge-text">{{ machineData.isOnline ? 'Live' : 'Offline' }}</span>
        </div>

        <!-- Scroll hint -->
        <div class="scroll-hint-wrap">
          <VIcon icon="tabler-arrows-horizontal" size="15" />
        </div>
      </div>
    </div>

    <!-- ── Online: scrollable cards ─────── -->
    <template v-if="machineData.isOnline">
      <div class="monitor-scroll-area" :class="{ 'scroll-light': !isDark }">
        <div class="monitor-grid">
          <div
            v-for="item in realtimeData"
            :key="item.id"
            class="param-card"
            :class="{ 'param-card-light': !isDark }"
            :style="{
              '--pc': getStatus(item.status).color,
              '--pc-rgb': getStatus(item.status).rgb,
            }"
          >
            <!-- Card top line -->
            <div class="param-top-line" />

            <!-- Status row -->
            <div class="param-status-row">
              <VIcon
                :icon="getStatus(item.status).icon"
                size="16"
                :style="{ color: getStatus(item.status).color }"
              />
              <span class="param-status-label">{{ getStatus(item.status).label }}</span>
            </div>

            <!-- Parameter name -->
            <div class="param-name">{{ item.parameter }}</div>

            <!-- Value -->
            <div class="param-value">{{ item.value }}</div>

            <!-- Bottom gradient line -->
            <div class="param-bottom-line" />
          </div>
        </div>
      </div>
    </template>

    <!-- ── Offline state ─────────────────── -->
    <template v-else>
      <div class="monitor-offline">
        <div class="offline-icon-wrap">
          <VIcon icon="tabler-wifi-off" size="32" style="color:#64748b;" />
        </div>
        <div class="offline-title">Machine Offline</div>
        <div class="offline-desc">Data tidak tersedia. Hubungkan mesin untuk mulai monitoring.</div>
      </div>
    </template>

  </div>
</template>

<style scoped>
/* ═══════════════════════════════════
   OUTER CARD — Dark
═══════════════════════════════════ */
.monitor-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-top: 3px solid #10b981;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05);
  padding: 20px 20px 18px;
  font-family: 'Inter', sans-serif;
  transition: transform 0.3s cubic-bezier(.4,0,.2,1), box-shadow 0.3s ease;
}
.monitor-card:hover {
  transform: translateY(-3px);
  box-shadow:
    0 12px 40px rgba(0,0,0,0.4),
    0 0 0 1px rgba(16,185,129,0.20),
    0 0 50px rgba(16,185,129,0.06);
}

/* ═══════════════════════════════════
   OUTER CARD — Light
═══════════════════════════════════ */
.monitor-card.monitor-light {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(37, 99, 235, 0.12);
  box-shadow: 0 2px 12px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.8);
}
.monitor-card.monitor-light:hover {
  box-shadow:
    0 8px 28px rgba(0,0,0,0.10),
    0 0 0 1px rgba(16,185,129,0.16),
    0 0 40px rgba(16,185,129,0.05);
}

/* ── Top line ── */
.monitor-top-line {
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, #10b981, #06b6d4, transparent);
  animation: line-scan 4s ease-in-out infinite;
}
@keyframes line-scan { 0%,100%{opacity:.35} 50%{opacity:1} }
.monitor-light .monitor-top-line {
  background: linear-gradient(90deg, #10b981, #06b6d4);
  animation: none; opacity: 1;
}

/* ── Glow blob ── */
.monitor-glow-blob {
  position: absolute; top:-60%; left:-30%; width:200%; height:200%;
  background: radial-gradient(ellipse 50% 40% at 50% 50%, rgba(16,185,129,0.08) 0%, transparent 70%);
  animation: blob-spin 14s linear infinite; pointer-events: none;
}
.monitor-light .monitor-glow-blob {
  background: radial-gradient(ellipse 50% 40% at 50% 50%, rgba(16,185,129,0.04) 0%, transparent 70%);
}
@keyframes blob-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }

/* ── Sparkles ── */
.sparkle {
  position: absolute; width:3px; height:3px; border-radius:50%;
  background: #10b981; box-shadow:0 0 6px #10b981;
  pointer-events:none; animation:sp-float 3.5s ease-in-out infinite;
}
.sp1 { top:12%; right:8%;  animation-delay:0s; }
.sp2 { top:60%; right:18%; animation-delay:1.8s; }
@keyframes sp-float {
  0%,100%{opacity:0;transform:translateY(0) scale(.8)}
  50%    {opacity:1;transform:translateY(-12px) scale(1.5)}
}
.monitor-light .sparkle { opacity:.5; }

/* ── Header ── */
.monitor-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 12px; position: relative; z-index: 1; margin-bottom: 16px;
}
.monitor-header-left { display: flex; align-items: center; gap: 10px; }

.monitor-icon-wrap {
  width: 36px; height: 36px; border-radius: 9px;
  background: rgba(16,185,129,0.14); border: 1px solid rgba(16,185,129,0.25);
  display: flex; align-items: center; justify-content: center;
  color: #10b981; flex-shrink: 0; transition: all 0.3s ease;
}
.monitor-card:hover .monitor-icon-wrap {
  transform: rotate(-8deg) scale(1.08);
  box-shadow: 0 4px 14px rgba(16,185,129,0.30);
}
.monitor-icon { filter: drop-shadow(0 0 4px rgba(16,185,129,0.5)); }

/* dark text */
.monitor-title    { font-size: .875rem; font-weight: 600; color: #f1f5f9; line-height: 1.2; }
.monitor-subtitle { font-size: .72rem; color: #64748b; margin-top: 3px; }
.monitor-subtitle-val { color: #94a3b8; font-weight: 500; margin-left: 2px; }
/* light text */
.monitor-light .monitor-title    { color: #0f172a; }
.monitor-light .monitor-subtitle { color: #94a3b8; }
.monitor-light .monitor-subtitle-val { color: #64748b; }

/* Header right */
.monitor-header-right { display: flex; align-items: center; gap: 8px; }

/* Status badge */
.monitor-status-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: 7px;
  flex-shrink: 0; cursor: default;
}
.badge-online {
  background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.30);
}
.badge-offline {
  background: rgba(107,114,128,0.12); border: 1px solid rgba(107,114,128,0.25);
}

.badge-dot {
  width: 6px; height: 6px; border-radius: 50%;
  position: relative; flex-shrink: 0;
}
.badge-online .badge-dot  { background: #10b981; box-shadow: 0 0 5px rgba(16,185,129,0.7); }
.badge-offline .badge-dot { background: #6b7280; }

.dot-pulse::after {
  content: ''; position: absolute; inset: -3px; border-radius: 50%;
  border: 1.5px solid #10b981; opacity: 0;
  animation: dot-ring 2s ease-out infinite;
}
@keyframes dot-ring {
  0%  { opacity:.7; transform:scale(1); }
  70% { opacity:0;  transform:scale(2.4); }
  100%{ opacity:0;  transform:scale(2.4); }
}
.badge-text {
  font-size: .65rem; font-weight: 600; letter-spacing: .4px; text-transform: uppercase;
}
.badge-online  .badge-text { color: #10b981; }
.badge-offline .badge-text { color: #6b7280; }

/* Light badge adjustments */
.monitor-light .badge-online {
  background: rgba(5,150,105,0.10); border-color: rgba(5,150,105,0.25);
}
.monitor-light .badge-online .badge-dot  { background: #059669; box-shadow: 0 0 5px rgba(5,150,105,0.6); }
.monitor-light .badge-online .dot-pulse::after { border-color: #059669; }
.monitor-light .badge-online .badge-text { color: #059669; }

/* Scroll hint */
.scroll-hint-wrap {
  color: #475569; opacity: 0.6;
  animation: bounce-x 2.2s ease-in-out infinite;
}
@keyframes bounce-x {
  0%,100%{ transform:translateX(0); }
  50%    { transform:translateX(5px); }
}

/* ═══════════════════════════════════
   SCROLL AREA
═══════════════════════════════════ */
.monitor-scroll-area {
  overflow-x: auto; overflow-y: hidden;
  padding-bottom: 10px;
  position: relative; z-index: 1;
  /* Scrollbar dark */
  scrollbar-width: thin;
  scrollbar-color: rgba(16,185,129,0.4) rgba(255,255,255,0.05);
}
.monitor-scroll-area::-webkit-scrollbar { height: 5px; }
.monitor-scroll-area::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.05); border-radius: 10px;
}
.monitor-scroll-area::-webkit-scrollbar-thumb {
  background: rgba(16,185,129,0.4); border-radius: 10px;
}
.monitor-scroll-area::-webkit-scrollbar-thumb:hover {
  background: rgba(16,185,129,0.65);
}
/* Scrollbar light */
.scroll-light { scrollbar-color: rgba(16,185,129,0.35) rgba(15,23,42,0.05); }
.scroll-light::-webkit-scrollbar-track { background: rgba(15,23,42,0.04); }
.scroll-light::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.30); }

/* Grid */
.monitor-grid {
  display: flex; flex-direction: row; gap: 12px; min-width: min-content;
}

/* ═══════════════════════════════════
   PARAM CARD
═══════════════════════════════════ */
.param-card {
  position: relative;
  overflow: hidden;
  min-width: 176px; max-width: 176px;
  flex-shrink: 0;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.10);
  border-top: 2px solid var(--pc);
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(12px);
  padding: 14px 14px 12px;
  transition: transform 0.25s cubic-bezier(.4,0,.2,1), box-shadow 0.25s ease;
  cursor: default;
}
.param-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 10px 28px rgba(0,0,0,0.30),
    0 0 0 1px rgba(var(--pc-rgb), 0.25),
    0 0 24px rgba(var(--pc-rgb), 0.12);
}

/* Light param card */
.param-card.param-card-light {
  background: rgba(255,255,255,0.92);
  border-color: rgba(203,213,225,0.45);
  border-top-color: var(--pc);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.param-card.param-card-light:hover {
  box-shadow:
    0 8px 22px rgba(0,0,0,0.10),
    0 0 0 1px rgba(var(--pc-rgb), 0.20),
    0 0 20px rgba(var(--pc-rgb), 0.08);
}

/* Top line on card */
.param-top-line {
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, var(--pc), transparent);
  opacity: 0;
  transition: opacity .25s ease;
}
.param-card:hover .param-top-line { opacity: 1; }

/* Status row */
.param-status-row {
  display: flex; align-items: center; gap: 5px; margin-bottom: 10px;
}
.param-status-label {
  font-size: .62rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: .5px; color: var(--pc);
}

/* Name */
.param-name {
  font-size: .70rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: .5px; color: #64748b; margin-bottom: 6px;
}
.param-card-light .param-name { color: #94a3b8; }

/* Value */
.param-value {
  font-size: 1.25rem; font-weight: 700;
  color: var(--pc);
  line-height: 1.15;
  margin-bottom: 10px;
  filter: drop-shadow(0 0 6px rgba(var(--pc-rgb), 0.35));
}
.param-card-light .param-value {
  filter: none;
}

/* Bottom gradient line */
.param-bottom-line {
  height: 2px; border-radius: 1px;
  background: linear-gradient(90deg, var(--pc), transparent);
  opacity: 0.5;
  transition: opacity .25s ease, height .25s ease;
}
.param-card:hover .param-bottom-line { opacity: 1; height: 3px; }

/* ═══════════════════════════════════
   OFFLINE STATE
═══════════════════════════════════ */
.monitor-offline {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center;
  padding: 36px 20px;
  text-align: center;
}
.offline-icon-wrap {
  width: 60px; height: 60px; border-radius: 14px;
  background: rgba(107,114,128,0.12); border: 1px solid rgba(107,114,128,0.20);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 14px;
}
.offline-title {
  font-size: .875rem; font-weight: 600; color: #64748b; margin-bottom: 6px;
}
.offline-desc {
  font-size: .72rem; color: #475569; max-width: 280px; line-height: 1.5;
}
.monitor-light .offline-title { color: #94a3b8; }
.monitor-light .offline-desc  { color: #94a3b8; }
</style>
