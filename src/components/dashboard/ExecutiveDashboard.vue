<script setup>
import { computed, ref } from 'vue'
import AlarmLogTrendChart from './operation/AlarmLogTrendChart.vue'
import RealtimeAverageChart from './operation/RealtimeAverageChart.vue'

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

// Alarm Log Trend Data (last 7 days)
const alarmLogTrend = ref([
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
  { id: 6, machine: 'Compressor 05', type: 'Alarm', severity: 'warning', time: '2 days ago', status: 'In Progress' },
  { id: 7, machine: 'Compressor 05', type: 'Alarm', severity: 'warning', time: '2 days ago', status: 'In Progress' },
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
  { title: 'View Alarm Log', icon: 'tabler-bell-minus', color: 'error', route: 'breakdowns' },
  { title: 'Audit Logs', icon: 'tabler-adjustments-cog', color: 'warning', route: 'audit-logs' },
  { title: 'Check Sheet', icon: 'tabler-file-type-doc', color: 'success', route: 'audit-logs' },
  { title: 'System Setting', icon: 'tabler-settings-spark', color: 'secondary', route: 'audit-logs' },
  { title: 'Machine', icon: 'tabler-brand-databricks', color: 'info', route: 'machines' },
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

const maxBreakdownCount = computed(() => Math.max(...alarmLogTrend.value.map(d => d.count)))

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

    <!-- Alarm Log Trend & Active Issues -->
    <VRow class="match-height mb-4">
      <VCol
        cols="12"
        md="8"
      >
        <VCard class="h-100">
          <VCardItem>
            <VCardTitle>Alarm Log Trend (Last 7 Days)</VCardTitle>
            <VCardSubtitle>Daily alarm log incidents tracking</VCardSubtitle>
          </VCardItem>
          <VCardText>
           <AlarmLogTrendChart/>
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
                v-for="issue in activeIssues.slice(0, 8)"
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
        md="6"
      >
      <VRow>
        <VCol cols="12"
        md="12">
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
        <VCol cols="12"
        md="12">
         <VCard class="h-100">
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
        </VRow>
      </VCol>
      <VCol
        cols="12"
        md="6"
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

     
    </VRow>

    <!-- Administrative Insights -->
    <VRow class="match-height">
      <VCol cols="12">
        <h3 class="text-h4 mb-2">
          Administrative Insights
        </h3>
      </VCol>

     

    </VRow>
     <VRow>
      <VCol
        cols="12"
        lg="12"
        md="12"
      >
        <VCard class="fill-height">
          <VCardItem class="d-flex flex-wrap justify-space-between gap-4">
            <VCardTitle>Filter Machine & Parameter</VCardTitle>
            <VCardSubtitle>Performance insights based on COP and energy usage</VCardSubtitle>
          </VCardItem>

          <VCardText>
            <VRow class="h-100">
              <VCol
                class="d-flex flex-row gap-4 align-end"
                cols="12"
                lg="12"
                md="12"



              >
                <AppSelect
                  v-model="selectedMachineIds"
                  :error="!!formErrors.selected_machine_ids"
                  :error-messages="formErrors.selected_machine_ids || []"
                  :items="[]"
                  :rules="[requiredValidator]"
                  label="Machine"
                  placeholder="Select machine"
                />
                <AppSelect
                  v-model="selectedParameterIds"
                  :error="!!formErrors.selected_parameter_ids"
                  :error-messages="formErrors.selected_parameter_ids || []"
                  :items="[]"
                  :rules="[requiredValidator]"
                  label="Parameter"
                  placeholder="Select parameter"
                />
                <AppTextField
                  v-model="interval"
                  label="Interval (Minutes)"
                  placeholder="60"
                />
                <VBtn
                  color="error"
                  type="submit"
                >
                  Stop
                </VBtn>
                <VBtn type="submit">
                  Submit
                </VBtn>
              </VCol>
            </VRow>




          </VCardText>
        </VCard>
      </VCol>
    </VRow>
   <VRow class="match-height">
      

      <VCol
        class="d-flex"
        cols="12"
        lg="12"
        md="12"
      >
        <VCard class="flex-grow-1">
          <VCardItem class="d-flex flex-wrap justify-space-between gap-4">
            <VCardTitle>Realtime Data (kW/hr)</VCardTitle>
            <VCardSubtitle>Hourly efficiency metrics for system performance analysis</VCardSubtitle>

            <template #append>
              <div class="d-flex align-center">
                <VChip
                  color="success"
                  label
                >
                  <VIcon
                    icon="tabler-arrow-up"
                    size="15"
                    start
                  />
                  <span>22</span>
                </VChip>
              </div>
            </template>
          </VCardItem>

          <VCardText>
            <RealtimeAverageChart mode="realtime"/>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
    <VRow class="match-height">
      <VCol
        class="d-flex"
        cols="6"
        lg="6"
        md="6"
      >
        <VCard class="flex-grow-1">
          <VCardItem class="d-flex flex-wrap justify-space-between gap-4">
            <VCardTitle>Monthly Average (kW/hr)</VCardTitle>
            <VCardSubtitle>Hourly efficiency metrics for system performance analysis</VCardSubtitle>

            <template #append>
              <div class="d-flex align-center">
                <VChip

                  color="success"
                  label


                >
                  <VIcon
                    icon="tabler-arrow-up"
                    size="15"
                    start
                  />
                  <span>22</span>
                </VChip>



              </div>
            </template>
          </VCardItem>
          <VCardText>
          <RealtimeAverageChart/>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        class="d-flex"
        cols="6"
        lg="6"
        md="6"
      >
        <VCard class="flex-grow-1">
          <VCardItem class="d-flex flex-wrap justify-space-between gap-4">
            <VCardTitle>Weekly Average (kW/hr)</VCardTitle>
            <VCardSubtitle>Hourly efficiency metrics for system performance analysis</VCardSubtitle>

            <template #append>
              <div class="d-flex align-center">
                <VChip
                  color="success"
                  label
                >
                  <VIcon
                    icon="tabler-arrow-up"
                    size="15"
                    start
                  />
                  <span>22</span>
                </VChip>
              </div>
            </template>
          </VCardItem>

          <VCardText>
          <RealtimeAverageChart/>
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
