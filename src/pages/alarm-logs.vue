<script setup>
import { useManageAlarmLog } from "@/composables/useManageAlarmLog"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import { format } from 'date-fns'
import { onMounted, ref, watch } from 'vue'

const {
  alarmLogs,
  totalItems,
  currentPage,
  pageSize,
  totalPages,
  actionLoading,
  errorMessage,
  formErrors,

  fetchAlarmLogsPagination,
  updateAlarmLog,
  clearErrors,
  currentPage: page, pageSize: itemsPerPage,
} = useManageAlarmLog()


const searchQuery = ref("")
const sortBy = ref("id")
const sortOrder = ref("asc")
const showNoteDialog = ref(false)
const selectedAlarmLog = ref('')

const loadAlarmLogs = async () => {
  await fetchAlarmLogsPagination({
    page: page.value,
    size: itemsPerPage.value,
    query: searchQuery.value,
    sort: sortBy.value,
    order: sortOrder.value,
  })
}

const getStatusColor = status => {
  switch (status) {
    case false: return 'success'
    case true: return 'warning'
    case 'Open': return 'error'
    case 'Resolved': return 'info'
    case 'Acknowledged': return 'success'
    default: return 'info'
  }
}

onMounted(() => {
  loadAlarmLogs()
})

// Reset ke halaman 1 saat search
watch(searchQuery, () => {
  page.value = 1
  loadAlarmLogs()
})

// Load data saat page atau itemsPerPage berubah
watch([page, itemsPerPage], () => {
  loadAlarmLogs()
})

// Header table
const headers = [
  { title: '', key: 'data-table-expand' },
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Machine Name', key: 'machine_name', sortable: true },

  { title: 'Parameter Name', key: 'parameter_name', sortable: true },
  { title: 'Type', key: 'type', sortable: true },
  { title: 'Value', key: 'value', sortable: true },
  { title: 'Is Active', key: 'is_active', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Acknowledged By', key: 'acknowledged_by', sortable: false },
  { title: 'Created At', key: 'created_at', sortable: true },
  { title: 'Updated At', key: 'updated_at', sortable: true },
  { title: 'Acknowledged At', key: 'acknowledged_at', sortable: true },
  { title: 'Actions', key: 'actions', align: 'center' },
]


const handleUpdate = alarmLog => {
  selectedAlarmLog.value = { ...alarmLog }
  showNoteDialog.value = true
}

const handleUpdateAction = async (note) => {
  let actionResult = await updateAlarmLog({
    id: selectedAlarmLog.value.id,
    note: note,
  })
  if (actionResult.success) {
    showNoteDialog.value = false
  }
}


</script>


<template>
  <section>
    <VCol cols="12">
      <h4 class="text-h4 mb-1">
        All Alarm Logs
      </h4>
      <p class="text-body-1 mb-0">
        Review and view alarm logs in system
      </p>
    </VCol>
    <VCard>
      <VCardText class="d-flex flex-wrap gap-4 justify-space-between align-center">
        <!-- Items per page selector -->
        <div class="d-flex gap-2 align-center">
          <span class="text-body-1">Show</span>
          <AppSelect v-model="itemsPerPage" :items="ITEMS_PER_PAGE_OPTIONS" style="inline-size: 5.5rem;" />
        </div>

        <!-- Right side controls -->
        <div class="d-flex gap-2 align-center flex-wrap">
          <AppTextField v-model="searchQuery" clearable placeholder="Search something..."
            style="inline-size: 15.625rem;" />
        </div>
      </VCardText>

      <VDivider />

      <!-- Error Alert -->
      <VAlert v-if="errorMessage" class="mx-4 mt-4" closable type="error" @click:close="clearErrors">
        {{ errorMessage }}
      </VAlert>

      <!-- Data Table -->
      <VDataTable :key="alarmLogs.length" :headers="headers" :items="alarmLogs" :items-per-page="itemsPerPage"
        :loading="actionLoading" class="text-no-wrap" hide-default-footer no-data-text="No alarm logs found"
        expand-on-click>
        <!-- ID Column -->
        <template #item.id="{ index }">
          {{ (page - 1) * itemsPerPage + index + 1 }}
        </template>
        <template #item.machine_name="{ item }">
          {{ item.parameter.mqtt_topic.machine.name }}
        </template>
        <template #item.parameter_name="{ item }">
          {{ item.parameter.name }}
        </template>

        <template #expanded-row="{ item, columns }">
          <tr>
            <td :colspan="columns.length" class="pa-3">
              <h2>Note</h2>
              <p class="d-flex text-wrap">
                {{ item.note }}
              </p>
            </td>
          </tr>
        </template>

        <template #item.is_active="{ item }">
          <VChip :color="getStatusColor(item.is_active)" variant="tonal" class="status-chip">
            {{ item.is_active ? 'Active' : 'Inactive' }}
          </VChip>
        </template>
        <template #item.status="{ item }">
          <VChip :color="getStatusColor(item.status)" variant="tonal" class="status-chip">
            {{ item.status }}
          </VChip>
        </template>
          <template #item.acknowledged_by="{ item }">
         <div class="d-flex align-center gap-2">
          {{ item.acknowledged_by.name }}
         </div>
        </template>



        <!-- Created At Column -->
        <template #item.created_at="{ item }">
          {{ format(new Date(item.created_at), 'dd MMM yyyy HH:mm:ss') }}
        </template>

        <template #item.updated_at="{ item }">
          {{ format(new Date(item.updated_at), 'dd MMM yyyy HH:mm:ss') }}
        </template>
<template #item.acknowledged_at="{ item }">
          {{ format(new Date(item.acknowledged_at), 'dd MMM yyyy HH:mm:ss') }}
        </template>
        <template #header.actions>
          <div class="text-center w-100">
            Actions
          </div>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex justify-center gap-1">
            <VBtn v-if="item.status !== 'Finished' && item.is_active" icon color="info" variant="text"
              @click="handleUpdate(item)">
              <VIcon icon="tabler-pencil" size="18" />
            </VBtn>
          </div>
        </template>


        <!-- Bottom Pagination -->
        <template #bottom>
          <TablePagination v-model:page="page" :items-per-page="itemsPerPage" :total-items="totalItems" />
        </template>
      </VDataTable>
    </VCard>
  </section>
  <!-- Delete Dialog -->
  <DeleteDialog v-model="showNoteDialog" :fields="[{
    key: 'note',
    label: 'Note',
    placeholder: 'Type your note...',
    type: 'text',
    formErrors: formErrors
  }]" :loading="actionLoading" message="Please provide a note before acknowledged issue" title="Acknowledged Issue"
    @submit="handleUpdateAction" />
</template>
