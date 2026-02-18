<script setup>
import { useConfigStore } from '@core/stores/config'
import { computed, ref } from 'vue'
import { useTheme } from 'vuetify'

const props = defineProps({
  machine: {
    type: Object,
    default: () => ({
      id: 1,
      name: 'Machine A-01',
      status: 'on',
      totalRuntime: '1,245h 30m',
      hover: false,
    }),
    required: false,
  },
  runningTimes: {
    type: Array,
    required: false,
    default: () => [
      { id: 1, name: 'Compressor 1', value: '142h 35m', icon: 'tabler-circle-1', color: '#10b981' },
      { id: 2, name: 'Compressor 2', value: '98h 12m',  icon: 'tabler-circle-2', color: '#14b8a6' },
      { id: 3, name: 'Compressor 3', value: '215h 48m', icon: 'tabler-circle-3', color: '#06b6d4' },
      { id: 4, name: 'Compressor 4', value: '87h 23m',  icon: 'tabler-circle-4', color: '#0ea5e9' },
      { id: 5, name: 'Compressor 5', value: '156h 05m', icon: 'tabler-circle-5', color: '#8b5cf6' },
    ],
  },
  isEditMode: {
    type: Boolean,
    default: true,
  },
  parameters: {
    type: Array,
    default: () => [],
  },
  selectedParameters: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['addParameter', 'removeParameter'])

const configStore = useConfigStore()
const theme = useTheme()

const isDark = computed(() => {
  if (configStore.theme === 'system')
    return theme.global.current.value.dark
  return configStore.theme === 'dark'
})

const showAddDialog = ref(false)

const handleOpenDialog = () => { showAddDialog.value = true }
const handleRemoveParameter = id => emit('removeParameter', id)

const hexToRgb = hex => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <!-- ── Outer Card ───────────────────────── -->
      <div
        class="machine-card"
        :class="[
          isDark ? '' : 'machine-light',
          machine.status === 'on' ? 'machine-online' : 'machine-offline',
        ]"
      >
        <!-- Top accent line -->
        <div
          class="machine-top-line"
          :class="machine.status === 'on' ? 'line-on' : 'line-off'"
        />

        <!-- Glow blob -->
        <div
          class="machine-glow-blob"
          :class="machine.status === 'on' ? 'blob-on' : 'blob-off'"
        />

        <!-- Sparkles (only when online) -->
        <template v-if="machine.status === 'on'">
          <span class="sparkle sp1" />
          <span class="sparkle sp2" />
        </template>

        <!-- ── Header ── -->
        <div class="machine-header">
          <div class="machine-header-left">
            <!-- Icon -->
            <div
              class="machine-icon-wrap"
              :class="machine.status === 'on' ? 'icon-wrap-on' : 'icon-wrap-off'"
            >
              <VIcon
                icon="tabler-chart-area-line"
                size="18"
                class="machine-icon"
                :class="machine.status === 'on' ? 'icon-on' : 'icon-off'"
              />
            </div>

            <div>
              <!-- Machine name -->
              <div
                class="machine-title"
                :class="isDark ? '' : 'machine-title-light'"
              >
                {{ machine.name }}
              </div>

              <!-- Runtime badge -->
              <div
                v-if="machine.status === 'on'"
                class="machine-subtitle"
              >
                <VIcon
                  icon="tabler-clock-hour-4"
                  size="12"
                  style="color:#06b6d4; vertical-align:middle; margin-right:4px;"
                />
                Total Runtime:
                <span class="machine-subtitle-val">{{ machine.totalRuntime }}</span>
              </div>
              <div
                v-else
                class="machine-subtitle"
              >
                <VIcon
                  icon="tabler-clock-off"
                  size="12"
                  style="color:#64748b; vertical-align:middle; margin-right:4px;"
                />
                <span style="color:#64748b;">No runtime data</span>
              </div>
            </div>
          </div>

          <!-- Right: status badge + scroll hint -->
          <div class="machine-header-right">
            <div
              class="machine-status-badge"
              :class="machine.status === 'on' ? 'badge-online' : 'badge-offline'"
            >
              <span
                class="badge-dot"
                :class="machine.status === 'on' ? 'dot-pulse' : ''"
              />
              <span class="badge-text">{{ machine.status === 'on' ? 'Connected' : 'Disconnected' }}</span>
            </div>

            <div
              v-if="machine.status === 'on'"
              class="scroll-hint-wrap"
            >
              <VIcon
                icon="tabler-arrows-horizontal"
                size="15"
              />
            </div>
          </div>
        </div>

        <!-- ── Online: scrollable param cards ── -->
        <template v-if="machine.status === 'on'">
          <!-- Section label -->
          <div class="section-label">
            <VIcon
              icon="tabler-clock"
              size="14"
              style="color:#10b981; margin-right:6px;"
            />
            <span :class="isDark ? 'section-label-text-dark' : 'section-label-text-light'">Performance Overview</span>
          </div>

          <div
            class="machine-scroll-area"
            :class="{ 'scroll-light': !isDark }"
          >
            <div class="machine-grid">
              <!-- Add Parameter Card -->
              <div
                v-if="isEditMode"
                class="add-card"
                :class="{ 'add-card-light': !isDark }"
                @click="handleOpenDialog"
              >
                <div class="add-card-inner">
                  <div
                    class="add-icon-ring"
                    :class="{ 'add-icon-ring-light': !isDark }"
                  >
                    <VIcon
                      icon="tabler-plus"
                      size="28"
                      style="color:#10b981;"
                    />
                  </div>
                  <div
                    class="add-card-label"
                    :class="isDark ? 'add-card-label-dark' : 'add-card-label-light'"
                  >
                    Add Parameter
                  </div>
                </div>
              </div>

              <!-- Parameter Cards -->
              <div
                v-for="item in runningTimes"
                :key="item.id"
                class="param-card"
                :class="{ 'param-card-light': !isDark }"
                :style="{
                  '--pc': item.color,
                  '--pc-rgb': hexToRgb('#10b981'),
                }"
              >
                <!-- Card top accent line -->
                <div class="param-top-line" />

                <!-- Delete btn -->
                <VBtn
                  v-if="isEditMode"
                  icon
                  size="x-small"
                  variant="text"
                  color="error"
                  class="param-delete-btn"
                  @click.stop="handleRemoveParameter(item.id)"
                >
                  <VIcon
                    icon="tabler-x"
                    size="14"
                  />
                </VBtn>

                <!-- Icon circle + name -->
                <div class="param-status-row">
                  <div
                    class="param-icon-circle"
                    :style="{
                      background: `rgba(${hexToRgb('#10b981')}, ${isDark ? '0.18' : '0.10'})`,
                      borderColor: `rgba(${hexToRgb('#10b981')}, ${isDark ? '0.35' : '0.25'})`,
                    }"
                  >
                    <VIcon
                      icon="tabler-activity"
                      size="14"
                      :style="{ color: item.color }"
                    />
                  </div>
                  <span
                    class="param-status-label"
                    :style="{ color: item.color }"
                  >Active</span>
                </div>

                <!-- Name -->
                <div
                  class="param-name"
                  :class="{ 'param-name-light': !isDark }"
                >
                  {{ item.name }}
                </div>

                <!-- Value -->
                <div
                  class="param-value"
                  :class="{ 'param-value-light': !isDark }"
                  :style="{ color: item.color }"
                >
                  {{ item.value }}
                </div>

                <!-- Bottom gradient line -->
                <div class="param-bottom-line" />
              </div>
            </div>
          </div>
        </template>

        <!-- ── Offline State ── -->
        <template v-else>
          <div class="machine-offline-body">
            <div class="offline-icon-wrap">
              <VIcon
                icon="tabler-circle-off"
                size="32"
                style="color:#64748b;"
              />
            </div>
            <div
              class="offline-title"
              :class="{ 'offline-title-light': !isDark }"
            >
              System Idle
            </div>
            <div
              class="offline-desc"
              :class="{ 'offline-desc-light': !isDark }"
            >
              Mesin tidak aktif. Nyalakan mesin untuk mulai monitoring performa.
            </div>
          </div>
        </template>
      </div>
    </VCol>

    <!-- ── Add Parameter Dialog ── -->
    <VDialog
      v-model="showAddDialog"
      max-width="600"
    >
      <VCard
        class="dialog-card"
        :class="{ 'dialog-card-light': !isDark }"
      >
        <VCardTitle class="d-flex align-center justify-space-between pa-6">
          <div class="d-flex align-center gap-3">
            <VAvatar
              color="success"
              variant="tonal"
              size="40"
            >
              <VIcon icon="tabler-plus" />
            </VAvatar>
            <div>
              <div
                class="dialog-title"
                :class="{ 'dialog-title-light': !isDark }"
              >
                Add Parameters
              </div>
              <div class="dialog-subtitle">
                Select parameters to display
              </div>
            </div>
          </div>
          <VBtn
            icon
            variant="text"
            size="small"
            @click="showAddDialog = false"
          >
            <VIcon icon="tabler-x" />
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <VSelect
            :model-value="props.selectedParameters"
            :items="parameters"
            label="Select Parameters"
            placeholder="Choose one or more parameters"
            multiple
            chips
            closable-chips
            variant="outlined"
            prepend-inner-icon="tabler-filter"
            @update:model-value="item => emit('addParameter', item[item.length - 1])"
          >
            <template #chip="{ item, props: chipProps }">
              <VChip
                v-bind="chipProps"
                size="small"
                color="success"
              >
                {{ item.title }}
              </VChip>
            </template>
            <template #item="{ item, props: itemProps }">
              <VListItem
                v-bind="itemProps"
                :title="item.raw.name"
              >
                <template #prepend>
                  <VAvatar
                    color="success"
                    size="32"
                    variant="tonal"
                  >
                    <VIcon
                      icon="tabler-binary-tree-2"
                      size="18"
                    />
                  </VAvatar>
                </template>
                <template #subtitle>
                  <span class="dialog-subtitle">
                    {{ item.raw.code }} • {{ item.raw.unit }}
                  </span>
                </template>
              </VListItem>
            </template>
          </VSelect>

          <div
            v-if="selectedParameters.length > 0"
            class="selection-info"
            :class="{ 'selection-info-light': !isDark }"
          >
            <div class="text-caption text-success font-weight-medium mb-1">
              Selected: {{ selectedParameters.length }} parameter(s)
            </div>
            <div class="dialog-subtitle">
              These parameters will be added to the performance overview
            </div>
          </div>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-6 d-flex justify-space-between">
          <div class="dialog-subtitle">
            Parameter saved when click "Store Chart"
          </div>
          <VBtn
            variant="tonal"
            color="primary"
            @click="showAddDialog = false"
          >
            Hide
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VRow>
</template>

<style scoped>
/* ═══════════════════════════════════════
   OUTER CARD — Dark base
═══════════════════════════════════════ */
.machine-card {
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
.machine-card:hover {
  transform: translateY(-3px);
  box-shadow:
    0 12px 40px rgba(0,0,0,0.4),
    0 0 0 1px rgba(16,185,129,0.20),
    0 0 50px rgba(16,185,129,0.06);
}

/* Offline border color */
.machine-card.machine-offline {
  border-top-color: #475569;
}

/* ── Light ── */
.machine-card.machine-light {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(37, 99, 235, 0.12);
  box-shadow: 0 2px 12px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.8);
}
.machine-card.machine-light:hover {
  box-shadow:
    0 8px 28px rgba(0,0,0,0.10),
    0 0 0 1px rgba(16,185,129,0.16),
    0 0 40px rgba(16,185,129,0.05);
}
.machine-card.machine-light.machine-offline {
  border-top-color: #94a3b8;
}

/* ── Top accent line ── */
.machine-top-line {
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
}
.line-on {
  background: linear-gradient(90deg, transparent, #10b981, #06b6d4, transparent);
  animation: line-scan 4s ease-in-out infinite;
}
.line-off {
  background: linear-gradient(90deg, transparent, #475569, transparent);
  opacity: 0.5;
}
.machine-light .line-on {
  background: linear-gradient(90deg, #10b981, #06b6d4);
  animation: none; opacity: 1;
}
@keyframes line-scan { 0%,100%{opacity:.35} 50%{opacity:1} }

/* ── Glow blob ── */
.machine-glow-blob {
  position: absolute; top: -60%; left: -30%; width: 200%; height: 200%;
  animation: blob-spin 14s linear infinite; pointer-events: none;
}
.blob-on {
  background: radial-gradient(ellipse 50% 40% at 50% 50%, rgba(16,185,129,0.08) 0%, transparent 70%);
}
.blob-off {
  background: radial-gradient(ellipse 50% 40% at 50% 50%, rgba(71,85,105,0.05) 0%, transparent 70%);
}
.machine-light .blob-on {
  background: radial-gradient(ellipse 50% 40% at 50% 50%, rgba(16,185,129,0.04) 0%, transparent 70%);
}
@keyframes blob-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }

/* ── Sparkles ── */
.sparkle {
  position: absolute; width: 3px; height: 3px; border-radius: 50%;
  background: #10b981; box-shadow: 0 0 6px #10b981;
  pointer-events: none; animation: sp-float 3.5s ease-in-out infinite;
}
.sp1 { top: 12%; right: 8%;  animation-delay: 0s; }
.sp2 { top: 60%; right: 18%; animation-delay: 1.8s; }
@keyframes sp-float {
  0%,100%{ opacity:0; transform:translateY(0) scale(.8) }
  50%    { opacity:1; transform:translateY(-12px) scale(1.5) }
}
.machine-light .sparkle { opacity: .5; }

/* ═══════════════════════════════════════
   HEADER
═══════════════════════════════════════ */
.machine-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 12px; position: relative; z-index: 1; margin-bottom: 16px;
}
.machine-header-left  { display: flex; align-items: center; gap: 10px; }
.machine-header-right { display: flex; align-items: center; gap: 8px; }

/* Icon wrapper */
.machine-icon-wrap {
  width: 36px; height: 36px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all 0.3s ease;
}
.icon-wrap-on {
  background: rgba(16,185,129,0.14); border: 1px solid rgba(16,185,129,0.25);
}
.icon-wrap-off {
  background: rgba(71,85,105,0.14); border: 1px solid rgba(71,85,105,0.25);
}
.machine-card:hover .machine-icon-wrap {
  transform: rotate(-8deg) scale(1.08);
  box-shadow: 0 4px 14px rgba(16,185,129,0.30);
}
.icon-on  { color: #10b981; filter: drop-shadow(0 0 4px rgba(16,185,129,0.5)); }
.icon-off { color: #64748b; }

/* Title / subtitle */
.machine-title       { font-size: .9rem; font-weight: 700; color: #f1f5f9; line-height: 1.2; }
.machine-title-light { color: #0f172a; }
.machine-subtitle    { font-size: .72rem; color: #64748b; margin-top: 3px; }
.machine-subtitle-val { color: #06b6d4; font-weight: 600; margin-left: 2px; }

/* Status badge */
.machine-status-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: 7px; flex-shrink: 0; cursor: default;
}
.badge-online {
  background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.30);
}
.badge-offline {
  background: rgba(107,114,128,0.12); border: 1px solid rgba(107,114,128,0.25);
}

.badge-dot {
  width: 6px; height: 6px; border-radius: 50%; position: relative; flex-shrink: 0;
}
.badge-online  .badge-dot { background: #10b981; box-shadow: 0 0 5px rgba(16,185,129,0.7); }
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

/* Light badge */
.machine-light .badge-online {
  background: rgba(5,150,105,0.10); border-color: rgba(5,150,105,0.25);
}
.machine-light .badge-online .badge-dot  { background: #059669; box-shadow: 0 0 5px rgba(5,150,105,0.6); }
.machine-light .badge-online .dot-pulse::after { border-color: #059669; }
.machine-light .badge-online .badge-text { color: #059669; }

/* Scroll hint */
.scroll-hint-wrap {
  color: #475569; opacity: 0.6;
  animation: bounce-x 2.2s ease-in-out infinite;
}
@keyframes bounce-x {
  0%,100%{ transform:translateX(0); }
  50%    { transform:translateX(5px); }
}

/* ── Section label ── */
.section-label {
  display: flex; align-items: center;
  margin-bottom: 10px; position: relative; z-index: 1;
}
.section-label-text-dark  { font-size: .75rem; font-weight: 600; color: #94a3b8; }
.section-label-text-light { font-size: .75rem; font-weight: 600; color: #64748b; }

/* ═══════════════════════════════════════
   SCROLL AREA
═══════════════════════════════════════ */
.machine-scroll-area {
  overflow-x: auto; overflow-y: hidden;
  padding-bottom: 10px;
  position: relative; z-index: 1;
  scrollbar-width: thin;
  scrollbar-color: rgba(16,185,129,0.4) rgba(255,255,255,0.05);
}
.machine-scroll-area::-webkit-scrollbar { height: 5px; }
.machine-scroll-area::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.05); border-radius: 10px;
}
.machine-scroll-area::-webkit-scrollbar-thumb {
  background: rgba(16,185,129,0.4); border-radius: 10px;
}
.machine-scroll-area::-webkit-scrollbar-thumb:hover {
  background: rgba(16,185,129,0.65);
}
.scroll-light { scrollbar-color: rgba(16,185,129,0.35) rgba(15,23,42,0.05); }
.scroll-light::-webkit-scrollbar-track { background: rgba(15,23,42,0.04); }
.scroll-light::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.30); }

.machine-grid {
  display: flex; flex-direction: row; gap: 12px; min-width: min-content;
}

/* ═══════════════════════════════════════
   ADD CARD
═══════════════════════════════════════ */
.add-card {
  position: relative; overflow: hidden;
  min-width: 160px; max-width: 160px; flex-shrink: 0;
  border-radius: 12px;
  border: 2px dashed rgba(16,185,129,0.35);
  background: linear-gradient(135deg, rgba(16,185,129,0.07), rgba(6,182,212,0.07));
  backdrop-filter: blur(12px);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(.4,0,.2,1);
  display: flex; align-items: center; justify-content: center;
  min-height: 148px;
}
.add-card:hover {
  border-color: rgba(16,185,129,0.6);
  background: linear-gradient(135deg, rgba(16,185,129,0.13), rgba(6,182,212,0.13));
  box-shadow: 0 8px 24px rgba(16,185,129,0.18);
  transform: translateY(-3px);
}
.add-card-light {
  background: linear-gradient(135deg, rgba(16,185,129,0.04), rgba(6,182,212,0.04));
  border-color: rgba(16,185,129,0.25);
}
.add-card-light:hover {
  background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.08));
  border-color: rgba(16,185,129,0.45);
}

.add-card-inner {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.add-icon-ring {
  width: 52px; height: 52px; border-radius: 50%;
  background: rgba(16,185,129,0.15);
  border: 2px solid rgba(16,185,129,0.35);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s ease;
}
.add-card:hover .add-icon-ring {
  transform: rotate(90deg) scale(1.1);
  background: rgba(16,185,129,0.25);
}
.add-icon-ring-light { background: rgba(16,185,129,0.10); border-color: rgba(16,185,129,0.25); }

.add-card-label-dark  { font-size: .72rem; font-weight: 600; color: #94a3b8; }
.add-card-label-light { font-size: .72rem; font-weight: 600; color: #64748b; }

/* ═══════════════════════════════════════
   PARAM CARD
═══════════════════════════════════════ */
.param-card {
  position: relative; overflow: hidden;
  min-width: 160px; max-width: 160px; flex-shrink: 0;
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

/* Top hover line */
.param-top-line {
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, var(--pc), transparent);
  opacity: 0; transition: opacity .25s ease;
}
.param-card:hover .param-top-line { opacity: 1; }

/* Delete btn */
.param-delete-btn {
  position: absolute; top: 6px; right: 6px; z-index: 10;
  background: rgba(239, 68, 68, 0.18) !important;
  backdrop-filter: blur(8px);
}
.param-delete-btn:hover { background: rgba(239, 68, 68, 0.30) !important; }

/* Status row */
.param-status-row {
  display: flex; align-items: center; gap: 6px; margin-bottom: 10px;
}
.param-icon-circle {
  width: 24px; height: 24px; border-radius: 6px;
  border: 1px solid; display: flex; align-items: center; justify-content: center;
  transition: transform 0.25s ease;
}
.param-card:hover .param-icon-circle { transform: scale(1.1) rotate(5deg); }
.param-status-label {
  font-size: .60rem; font-weight: 700; text-transform: uppercase; letter-spacing: .5px;
}

/* Name */
.param-name {
  font-size: .70rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: .5px; color: #64748b; margin-bottom: 6px;
}
.param-name.param-name-light { color: #94a3b8; }

/* Value */
.param-value {
  font-size: 1.15rem; font-weight: 700; line-height: 1.15; margin-bottom: 10px;
  filter: drop-shadow(0 0 6px rgba(var(--pc-rgb), 0.35));
}
.param-value.param-value-light { filter: none; }

/* Bottom line */
.param-bottom-line {
  height: 2px; border-radius: 1px;
  background: linear-gradient(90deg, var(--pc), transparent);
  opacity: 0.5; transition: opacity .25s ease, height .25s ease;
}
.param-card:hover .param-bottom-line { opacity: 1; height: 3px; }

/* ═══════════════════════════════════════
   OFFLINE BODY
═══════════════════════════════════════ */
.machine-offline-body {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center;
  padding: 36px 20px; text-align: center;
}
.offline-icon-wrap {
  width: 60px; height: 60px; border-radius: 14px;
  background: rgba(107,114,128,0.12); border: 1px solid rgba(107,114,128,0.20);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 14px;
}
.offline-title       { font-size: .875rem; font-weight: 600; color: #64748b; margin-bottom: 6px; }
.offline-title-light { color: #94a3b8; }
.offline-desc        { font-size: .72rem; color: #475569; max-width: 280px; line-height: 1.5; }
.offline-desc-light  { color: #94a3b8; }

/* ═══════════════════════════════════════
   DIALOG
═══════════════════════════════════════ */
.dialog-card {
  background: linear-gradient(135deg, rgba(30,41,59,0.97), rgba(15,23,42,0.99)) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.10) !important;
}
.dialog-card-light {
  background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.95)) !important;
  border: 1px solid rgba(203,213,225,0.30) !important;
}
.dialog-title        { font-size: .9rem; font-weight: 700; color: #f1f5f9; }
.dialog-title-light  { color: #0f172a; }
.dialog-subtitle     { font-size: .72rem; color: #64748b; margin-top: 3px; }

.selection-info {
  margin-top: 12px; padding: 12px; border-radius: 8px;
  background: rgba(16,185,129,0.10); border: 1px solid rgba(16,185,129,0.20);
}
.selection-info-light {
  background: rgba(16,185,129,0.06); border-color: rgba(16,185,129,0.15);
}
</style>
