<script setup>
import { computed, ref } from 'vue'

// Executive Summary Data
const systemHealth = ref({
  totalMachines: 24,
  onlineMachines: 21,
  offlineMachines: 3,
  activeAlerts: 7,
  criticalAlerts: 2,
})

// KPI Data
const kpiData = ref({
  uptime: 94.5,
  mtbf: 168, // hours
  mttr: 4.2, // hours
  totalBreakdowns: 18,
})

// Breakdown Trend Data (last 7 days)
const breakdownTrend = ref([
  { day: 'Mon', count: 3 },
  { day: 'Tue', count: 2 },
  { day: 'Wed', count: 4 },
  { day: 'Thu', count: 1 },
  { day: 'Fri', count: 5 },
  { day: 'Sat', count: 2 },
  { day: 'Sun', count: 1 },
])

// Active Issues
const activeIssues = ref([
  { id: 1, machine: 'Chiller Unit 01', type: 'Breakdown', severity: 'critical', time: '2 hours ago', status: 'In Progress' },
  { id: 2, machine: 'Cooling Tower 03', type: 'Alarm', severity: 'warning', time: '5 hours ago', status: 'Pending' },
  { id: 3, machine: 'Pump System 12', type: 'Breakdown', severity: 'critical', time: '1 day ago', status: 'Assigned' },
  { id: 4, machine: 'AHU Unit 07', type: 'Alarm', severity: 'info', time: '1 day ago', status: 'Pending' },
  { id: 5, machine: 'Compressor 05', type: 'Alarm', severity: 'warning', time: '2 days ago', status: 'In Progress' },
])

// Recent Activity Timeline
const recentActivities = ref([
  { id: 1, type: 'breakdown', user: 'John Doe', action: 'Created breakdown report for Chiller Unit 01', time: '30 mins ago', icon: 'tabler-robot-off', color: 'error' },
  { id: 2, type: 'report', user: 'Jane Smith', action: 'Generated monthly performance report', time: '2 hours ago', icon: 'tabler-file-type-doc', color: 'success' },
  { id: 3, type: 'config', user: 'Admin', action: 'Updated MQTT Broker configuration', time: '4 hours ago', icon: 'tabler-settings', color: 'primary' },
  { id: 4, type: 'user', user: 'System', action: 'New user registered: Mike Wilson', time: '6 hours ago', icon: 'tabler-user-plus', color: 'info' },
  { id: 5, type: 'alarm', user: 'System', action: 'Alarm triggered on Cooling Tower 03', time: '8 hours ago', icon: 'tabler-bell', color: 'warning' },
])

// User Activity
const userActivity = ref({
  activeUsers: 12,
  totalUsers: 28,
  todayLogins: 18,
  mostActiveUser: 'John Doe',
})

// Document Status
const documentStatus = ref({
  reportsToday: 5,
  pendingCheckSheets: 8,
  completedCheckSheets: 24,
  totalTemplates: 12,
})

// Connection Health
const connectionHealth = ref([
  { name: 'MQTT Broker', status: 'connected', uptime: '99.8%', icon: 'tabler-cooker', color: 'success' },
  { name: 'Modbus Server', status: 'connected', uptime: '98.5%', icon: 'tabler-server-spark', color: 'success' },
  { name: 'SMTP Server', status: 'connected', uptime: '99.2%', icon: 'tabler-mail', color: 'success' },
  { name: 'Database', status: 'connected', uptime: '99.9%', icon: 'tabler-database', color: 'success' },
])

// Configuration Summary
const configSummary = ref({
  facilities: 4,
  machines: 24,
  parameters: 156,
  mqttTopics: 48,
})

// Recent Audit Logs
const auditLogs = ref([
  { id: 1, user: 'admin@company.com', action: 'Updated system settings', module: 'System', time: '1 hour ago' },
  { id: 2, user: 'john.doe@company.com', action: 'Created new machine', module: 'Configuration', time: '3 hours ago' },
  { id: 3, user: 'jane.smith@company.com', action: 'Modified user permissions', module: 'User Management', time: '5 hours ago' },
  { id: 4, user: 'admin@company.com', action: 'Added MQTT topic', module: 'Connection', time: '7 hours ago' },
  { id: 5, user: 'mike.wilson@company.com', action: 'Generated report', module: 'Document', time: '9 hours ago' },
])

// Notifications
const notifications = ref([
  { id: 1, type: 'warning', message: '3 machines require maintenance this week', priority: 'high' },
  { id: 2, type: 'info', message: '5 check sheets pending approval', priority: 'medium' },
  { id: 3, type: 'error', message: '2 critical breakdowns need immediate attention', priority: 'critical' },
  { id: 4, type: 'success', message: 'System backup completed successfully', priority: 'low' },
])

// Quick Actions
const quickActions = ref([
  { title: 'Generate Report', icon: 'tabler-file-type-doc', color: 'primary', route: 'generate-reports' },
  { title: 'View Breakdowns', icon: 'tabler-robot-off', color: 'error', route: 'breakdowns' },
  { title: 'Check Alarms', icon: 'tabler-bell-minus', color: 'warning', route: 'breakdowns' },
  { title: 'Audit Logs', icon: 'tabler-adjustments-cog', color: 'info', route: 'audit-logs' },
])

const getSeverityColor = severity => {
  const colors = {
    critical: 'error',
    warning: 'warning',
    info: 'info',
  }
  
  return colors[severity] || 'default'
}

const getNotificationColor = type => {
  const colors = {
    error: 'error',
    warning: 'warning',
    info: 'info',
    success: 'success',
  }
  
  return colors[type] || 'default'
}

const maxBreakdownCount = computed(() => Math.max(...breakdownTrend.value.map(d => d.count)))

const {
  systemSetting,
  fetchSystemSetting,
} = useManageSystemSetting()

const {
  facilities,
  fetchFacilities,
} = useManageFacility()


const selectedMachineIds = ref([])
const selectedParameterIds = ref([])
const parameterId = ref([])
const interval = ref(0)
const formErrors = ref({})


const modelConfigurationReady = computed(() => {
  console.log(Boolean(systemSetting.value) && Boolean(facilities.value))
  
  return Boolean(systemSetting.value) && Boolean(facilities.value)
})

onMounted(async () => {
  fetchSystemSetting({ isMinimal: true, key: "DASHBOARD_SETTINGS" })
  await fetchFacilities({ isMinimal: true })
  await nextTick()
})
</script>

<template>
  <div>
    <!-- Executive Summary Section -->
    <VRow class="match-height mb-4">
      <VCol
        cols="8"
        lg="8"
        md="8"
      >
        <ThreeViewer
          v-if="modelConfigurationReady"
          :facilities="facilities"
          :model-configuration="systemSetting"
          class="flex-grow-1"
        />
      </VCol>
      <VCol
        cols="6"
        lg="4"
        md="4"
      >
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <VCard>
              <VCardText>
                <div class="d-flex justify-space-between align-center mb-2">
                  <div class="text-body-1 text-high-emphasis">
                    System Health
                  </div>
                  <VAvatar
                    color="success"
                    variant="tonal"
                    rounded
                    size="42"
                  >
                    <VIcon
                      icon="tabler-server"
                      size="26"
                    />
                  </VAvatar>
                </div>
                <h4 class="text-h4 mb-4">
                  {{ systemHealth.onlineMachines }}/{{ systemHealth.totalMachines }}
                </h4>
                <div class="d-flex flex-column gap-2">
                  <div class="d-flex justify-space-between">
                    <span class="text-sm">Online</span>
                    <span class="text-sm font-weight-medium text-success">{{ systemHealth.onlineMachines }}</span>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span class="text-sm">Offline</span>
                    <span class="text-sm font-weight-medium text-error">{{ systemHealth.offlineMachines }}</span>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span class="text-sm">Active Alerts</span>
                    <span class="text-sm font-weight-medium text-warning">{{ systemHealth.activeAlerts }}</span>
                  </div>
                </div>
              </VCardText>
            </VCard>
          </VCol>

          <!-- KPI Cards -->
          <VCol
            cols="12"
            md="6"
          >
            <VCard>
              <VCardText>
                <div class="d-flex justify-space-between align-center mb-2">
                  <div class="text-body-1 text-high-emphasis">
                    System Uptime
                  </div>
                  <VAvatar
                    color="primary"
                    variant="tonal"
                    rounded
                    size="42"
                  >
                    <VIcon
                      icon="tabler-clock"
                      size="26"
                    />
                  </VAvatar>
                </div>
                <h4 class="text-h4 mb-1">
                  {{ kpiData.uptime }}%
                </h4>
                <div class="text-sm text-success">
                  <VIcon
                    icon="tabler-arrow-up"
                    size="16"
                  />
                  +2.3% from last month
                </div>
              </VCardText>
            </VCard>
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VCard>
              <VCardText>
                <div class="d-flex justify-space-between align-center mb-2">
                  <div class="text-body-1 text-high-emphasis">
                    MTBF
                  </div>
                  <VAvatar
                    color="info"
                    variant="tonal"
                    rounded
                    size="42"
                  >
                    <VIcon
                      icon="tabler-chart-line"
                      size="26"
                    />
                  </VAvatar>
                </div>
                <h4 class="text-h4 mb-1">
                  {{ kpiData.mtbf }}h
                </h4>
                <div class="text-sm text-medium-emphasis">
                  Mean Time Between Failures
                </div>
              </VCardText>
            </VCard>
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VCard>
              <VCardText>
                <div class="d-flex justify-space-between align-center mb-2">
                  <div class="text-body-1 text-high-emphasis">
                    MTTR
                  </div>
                  <VAvatar
                    color="warning"
                    variant="tonal"
                    rounded
                    size="42"
                  >
                    <VIcon
                      icon="tabler-tool"
                      size="26"
                    />
                  </VAvatar>
                </div>
                <h4 class="text-h4 mb-1">
                  {{ kpiData.mttr }}h
                </h4>
                <div class="text-sm text-error">
                  <VIcon
                    icon="tabler-arrow-up"
                    size="16"
                  />
                  +0.5h from last month
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCol>
      <!-- System Health Overview -->
    </VRow>

    <!-- Breakdown Trend & Active Issues -->
    <VRow class="match-height mb-4">
      <VCol
        cols="12"
        md="8"
      >
        <VCard class="h-100">
          <VCardItem>
            <VCardTitle>Breakdown Trend (Last 7 Days)</VCardTitle>
            <VCardSubtitle>Daily breakdown incidents tracking</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <div class="d-flex align-end justify-space-around gap-4">
              <div
                v-for="day in breakdownTrend"
                :key="day.day"
                class="d-flex flex-column align-center gap-2"
              >
                <div class="text-sm font-weight-medium">
                  {{ day.count }}
                </div>
                <div
                  class="breakdown-bar"
                  :style="{ 
                    height: `${(day.count / maxBreakdownCount) * 120}px`,
                    backgroundColor: day.count > 3 ? 'rgb(var(--v-theme-error))' : day.count > 1 ? 'rgb(var(--v-theme-warning))' : 'rgb(var(--v-theme-success))'
                  }"
                />
                <div class="text-sm text-medium-emphasis">
                  {{ day.day }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="4"
      >
        <VCard class="h-100">
          <VCardItem>
            <VCardTitle>Active Issues</VCardTitle>
            <VCardSubtitle>{{ activeIssues.length }} pending issues</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <VList class="py-0">
              <VListItem
                v-for="issue in activeIssues.slice(0, 5)"
                :key="issue.id"
                class="px-0"
              >
                <template #prepend>
                  <VAvatar
                    :color="getSeverityColor(issue.severity)"
                    size="36"
                    class="me-3"
                  >
                    <VIcon
                      :icon="issue.type === 'Breakdown' ? 'tabler-robot-off' : 'tabler-bell'"
                      size="20"
                    />
                  </VAvatar>
                </template>
                <VListItemTitle class="text-sm font-weight-medium">
                  {{ issue.machine }}
                </VListItemTitle>
                <VListItemSubtitle class="text-xs">
                  {{ issue.time }} • {{ issue.status }}
                </VListItemSubtitle>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Recent Activity & Quick Actions -->
    <VRow class="match-height mb-4">
      <VCol
        cols="12"
        md="8"
      >
        <VCard class="h-100">
          <VCardItem>
            <VCardTitle>Recent Activity Timeline</VCardTitle>
            <VCardSubtitle>Latest system activities and events</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <VTimeline
              side="end"
              density="compact"
              truncate-line="both"
              align="start"
            >
              <VTimelineItem
                v-for="activity in recentActivities"
                :key="activity.id"
                :dot-color="activity.color"
                size="x-small"
              >
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="text-sm font-weight-medium">
                      {{ activity.action }}
                    </div>
                    <div class="text-xs text-medium-emphasis">
                      by {{ activity.user }} • {{ activity.time }}
                    </div>
                  </div>
                  <VIcon
                    :icon="activity.icon"
                    size="20"
                    :color="activity.color"
                  />
                </div>
              </VTimelineItem>
            </VTimeline>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="4"
      >
        <VCard class="h-100">
          <VCardItem>
            <VCardTitle>Quick Actions</VCardTitle>
            <VCardSubtitle>Frequently used features</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <div class="d-flex flex-column gap-3">
              <VBtn
                v-for="action in quickActions"
                :key="action.title"
                :color="action.color"
                variant="tonal"
                block
                size="large"
              >
                <VIcon
                  :icon="action.icon"
                  start
                />
                {{ action.title }}
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Administrative Insights -->
    <VRow class="match-height mb-4">
      <VCol cols="12">
        <h3 class="text-h4 mb-2">
          Administrative Insights
        </h3>
      </VCol>

      <VCol
        cols="12"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex justify-space-between align-center mb-4">
              <div class="text-body-1 text-high-emphasis">
                User Activity
              </div>
              <VAvatar
                color="primary"
                variant="tonal"
                rounded
                size="42"
              >
                <VIcon
                  icon="tabler-users"
                  size="26"
                />
              </VAvatar>
            </div>
            <div class="d-flex flex-column gap-3">
              <div>
                <div class="text-h5 mb-1">
                  {{ userActivity.activeUsers }}/{{ userActivity.totalUsers }}
                </div>
                <div class="text-xs text-medium-emphasis">
                  Active Users
                </div>
              </div>
              <VDivider />
              <div>
                <div class="text-h6 mb-1">
                  {{ userActivity.todayLogins }}
                </div>
                <div class="text-xs text-medium-emphasis">
                  Logins Today
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex justify-space-between align-center mb-4">
              <div class="text-body-1 text-high-emphasis">
                Documents
              </div>
              <VAvatar
                color="success"
                variant="tonal"
                rounded
                size="42"
              >
                <VIcon
                  icon="tabler-file-type-doc"
                  size="26"
                />
              </VAvatar>
            </div>
            <div class="d-flex flex-column gap-3">
              <div class="d-flex justify-space-between">
                <span class="text-sm">Reports Today</span>
                <span class="text-sm font-weight-medium">{{ documentStatus.reportsToday }}</span>
              </div>
              <div class="d-flex justify-space-between">
                <span class="text-sm">Pending Checks</span>
                <span class="text-sm font-weight-medium text-warning">{{ documentStatus.pendingCheckSheets }}</span>
              </div>
              <div class="d-flex justify-space-between">
                <span class="text-sm">Completed</span>
                <span class="text-sm font-weight-medium text-success">{{ documentStatus.completedCheckSheets }}</span>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="6"
      >
        <VCard class="h-100">
          <VCardItem>
            <VCardTitle>Configuration Summary</VCardTitle>
            <VCardSubtitle>System configuration overview</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <div class="d-flex justify-space-around align-center">
              <div class="text-center">
                <VAvatar
                  color="primary"
                  variant="tonal"
                  size="56"
                  class="mb-2"
                >
                  <VIcon
                    icon="tabler-building-factory-2"
                    size="30"
                  />
                </VAvatar>
                <div class="text-h5 mb-1">
                  {{ configSummary.facilities }}
                </div>
                <div class="text-xs text-medium-emphasis">
                  Facilities
                </div>
              </div>
              <div class="text-center">
                <VAvatar
                  color="success"
                  variant="tonal"
                  size="56"
                  class="mb-2"
                >
                  <VIcon
                    icon="tabler-brand-databricks"
                    size="30"
                  />
                </VAvatar>
                <div class="text-h5 mb-1">
                  {{ configSummary.machines }}
                </div>
                <div class="text-xs text-medium-emphasis">
                  Machines
                </div>
              </div>
              <div class="text-center">
                <VAvatar
                  color="info"
                  variant="tonal"
                  size="56"
                  class="mb-2"
                >
                  <VIcon
                    icon="tabler-binary-tree-2"
                    size="30"
                  />
                </VAvatar>
                <div class="text-h5 mb-1">
                  {{ configSummary.parameters }}
                </div>
                <div class="text-xs text-medium-emphasis">
                  Parameters
                </div>
              </div>
              <div class="text-center">
                <VAvatar
                  color="warning"
                  variant="tonal"
                  size="56"
                  class="mb-2"
                >
                  <VIcon
                    icon="tabler-topology-star-3"
                    size="30"
                  />
                </VAvatar>
                <div class="text-h5 mb-1">
                  {{ configSummary.mqttTopics }}
                </div>
                <div class="text-xs text-medium-emphasis">
                  MQTT Topics
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- System Status & Audit Logs -->
    <VRow class="match-height mb-4">
      <VCol
        cols="12"
        md="6"
      >
        <VCard class="h-100">
          <VCardItem>
            <VCardTitle>Connection Health</VCardTitle>
            <VCardSubtitle>System connections status</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <VList class="py-0">
              <VListItem
                v-for="connection in connectionHealth"
                :key="connection.name"
                class="px-0"
              >
                <template #prepend>
                  <VAvatar
                    :color="connection.color"
                    size="40"
                    class="me-3"
                  >
                    <VIcon
                      :icon="connection.icon"
                      size="22"
                    />
                  </VAvatar>
                </template>
                <VListItemTitle class="text-sm font-weight-medium">
                  {{ connection.name }}
                </VListItemTitle>
                <VListItemSubtitle class="text-xs">
                  Uptime: {{ connection.uptime }}
                </VListItemSubtitle>
                <template #append>
                  <VChip
                    :color="connection.color"
                    size="small"
                    label
                  >
                    {{ connection.status }}
                  </VChip>
                </template>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="6"
      >
        <VCard class="h-100">
          <VCardItem>
            <VCardTitle>Recent Audit Logs</VCardTitle>
            <VCardSubtitle>Latest system changes</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <VList class="py-0">
              <VListItem
                v-for="log in auditLogs"
                :key="log.id"
                class="px-0"
              >
                <VListItemTitle class="text-sm">
                  {{ log.action }}
                </VListItemTitle>
                <VListItemSubtitle class="text-xs">
                  {{ log.user }} • {{ log.module }} • {{ log.time }}
                </VListItemSubtitle>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Notifications Center -->
    <VRow>
      <VCol cols="12">
        <VCard>
          <VCardItem>
            <VCardTitle>Notification Center</VCardTitle>
            <VCardSubtitle>Important alerts and updates</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <div class="d-flex flex-column gap-3">
              <VAlert
                v-for="notification in notifications"
                :key="notification.id"
                :type="notification.type"
                variant="tonal"
              >
                <div class="d-flex justify-space-between align-center">
                  <span>{{ notification.message }}</span>
                  <VChip
                    size="small"
                    :color="notification.priority === 'critical' ? 'error' : notification.priority === 'high' ? 'warning' : 'default'"
                  >
                    {{ notification.priority }}
                  </VChip>
                </div>
              </VAlert>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
.breakdown-bar {
  width: 40px;
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
}

.breakdown-bar:hover {
  opacity: 0.8;
}
</style>
