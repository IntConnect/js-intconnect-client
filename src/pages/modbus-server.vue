<script setup>
import ManageModbusServerDrawer from "@/components/drawer/ManageModbusServerDrawer.vue"
import AlertDialog from "@/components/general/AlertDialog.vue"
import DeleteDialog from "@/components/general/DeleteDialog.vue"
import { useManageModbusServer } from "@/composables/useManageModbusServer"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import TablePagination from "@core/components/TablePagination.vue"
import { onMounted, ref, watch } from 'vue'

// ==========================================
// Composable
// ==========================================
const {
  modbusServers,
  loading,
  actionLoading,
  fetchModbusServers,
  saveModbusServer,
  deleteModbusServer,
  totalItems,
  totalPages,
  error,
  formErrors,
  clearFormErrors,
  clearErrors,
  currentPage: page, pageSize: itemsPerPage,
} = useManageModbusServer()

// ==========================================
// Constants
// ==========================================
const TABLE_HEADERS = [
  { title: 'Id', key: 'id', sortable: true },
  { title: 'IP Address', key: 'ip_address', sortable: true },
  { title: 'Port', key: 'port', sortable: true },
  { title: 'Slave ID', key: 'slave_id', sortable: true },
  { title: 'Timeout', key: 'timeout', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

// ==========================================
// Reactive States
// ==========================================
const searchQuery = ref("")
const sortBy = ref("id")
const sortOrder = ref("asc")

// UI States
const isManageModbusServer = ref(false)
const showDeleteDialog = ref(false)
const selectedModbusServer = ref(null)
const showAlertDialog = ref(false)
const alertMessage = ref('')


// ==========================================
// Methods
// ==========================================

/**
 * Load modbusServers from API
 */
const loadModbusServer = async () => {
  await fetchModbusServers({
    page: page.value,
    size: itemsPerPage.value,
    query: searchQuery.value,
    sort: sortBy.value,
    order: sortOrder.value,
  })
}

/**
 * Open drawer for adding new modbusServer
 */
const openManageModbusServer = () => {
  selectedModbusServer.value = null
  clearFormErrors()
  isManageModbusServer.value = true
}

/**
 * Close add/edit drawer
 */
const closeManageModbusServer = () => {
  isManageModbusServer.value = false
  selectedModbusServer.value = null
  clearFormErrors()
}

/**
 * Open drawer for editing modbusServer
 */
const handleEdit = modbusServer => {
  selectedModbusServer.value = { ...modbusServer }
  clearFormErrors()
  isManageModbusServer.value = true
}

/**
 * Open delete confirmation dialog
 */
const openDeleteDialog = modbusServer => {
  selectedModbusServer.value = modbusServer
  showDeleteDialog.value = true
}

/**
 * Close delete dialog
 */
const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  selectedModbusServer.value = null
}

/**
 * Handle save modbusServer (create or update)
 */
const handleSaveModbusServer = async modbusServerData => {

  const result = await saveModbusServer(modbusServerData)

  if (result.success) {
    closeManageModbusServer()
    await nextTick()

    showAlertDialog.value = true
    alertMessage.value = 'Success manage Modbus Server'
  } else {
    console.error('Failed to save modbusServer:', result.error || result.errors)
  }
}

/**
 * Handle delete modbusServer
 */
const handleDeleteModbusServer = async formData => {
  if (!selectedModbusServer.value?.id) {
    console.warn('No Modbus Server selected for deletion')

    return
  }


  const result = await deleteModbusServer(selectedModbusServer.value.id, formData)

  if (result.success) {
    closeDeleteDialog()
    showAlertDialog.value = true
    alertMessage.value = 'Success delete Modbus Server'

  } else {
    console.error('Failed to delete user:', result.error)

    // Optional: Show error notification
  }
}

// ==========================================
// Watchers
// ==========================================

// Reset to page 1 when search query changes
watch(searchQuery, () => {
  page.value = 1
  loadModbusServer()
})


watch([page, itemsPerPage], loadModbusServer)

// ==========================================
// Lifecycle
// ==========================================
onMounted(() => {
  loadModbusServer()
})
</script>

<template>
  <section>
    <VCol cols="12">
      <h4 class="text-h4 mb-1">
        All Modbus Servers
      </h4>
      <p class="text-body-1 mb-0">
        View and manage all Modbus servers connected to your company’s infrastructure.
      </p>
    </VCol>
    <VCard>
      <VCardText class="d-flex flex-wrap gap-4 justify-space-between align-center">
        <!-- Items per page selector -->
        <div class="d-flex gap-2 align-center">
          <span class="text-body-1">Show</span>
          <AppSelect
            v-model="itemsPerPage"
            :items="ITEMS_PER_PAGE_OPTIONS"
            style="inline-size: 5.5rem;"
          />
        </div>

        <!-- Right side controls -->
        <div class="d-flex gap-2 align-center flex-wrap">
          <AppTextField
            v-model="searchQuery"
            clearable
            placeholder="Search something..."
            style="inline-size: 15.625rem;"
          />
          <VBtn
            :loading="actionLoading"
            color="primary"
            @click="openManageModbusServer"
          >
            New Modbus Server
          </VBtn>
        </div>
      </VCardText>

      <VDivider />

      <!-- Error Alert -->
      <VAlert
        v-if="error"
        class="mx-4 mt-4"
        closable
        type="error"
        @click:close="clearErrors"
      >
        {{ error }}
      </VAlert>

      <!-- Data Table -->
      <VDataTable
        :key="modbusServers.length"
        :headers="TABLE_HEADERS"
        :items="modbusServers"
        :items-per-page="itemsPerPage"
        :loading="loading"
        class="text-no-wrap"
        hide-default-footer
        no-data-text="No Modbus Servers found"
      >
        <!-- ID Column -->
        <template #item.id="{ index }">
          {{ (page - 1) * itemsPerPage + index + 1 }}
        </template>


        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-2">
            <VBtn
              color="info"
              icon
              size="small"
              variant="text"
              @click="handleEdit(item)"
            >
              <VIcon
                icon="tabler-pencil"
                size="20"
              />
            </VBtn>
            <VBtn
              color="error"
              icon
              size="small"
              variant="text"
              @click="openDeleteDialog(item)"
            >
              <VIcon
                icon="tabler-trash"
                size="20"
              />
            </VBtn>
          </div>
        </template>

        <!-- Bottom Pagination -->
        <template #bottom>
          <TablePagination
            v-model:page="page"
            :items-per-page="itemsPerPage"
            :total-items="totalItems"
          />
        </template>
      </VDataTable>
    </VCard>

    <!-- Delete Dialog -->
    <DeleteDialog
      v-model="showDeleteDialog"
      :fields="[{
        key: 'reason',
        label: 'Reason',
        placeholder: 'Type your reason...',
        type: 'text'
      }]"
      :loading="actionLoading"
        :form-errors="formErrors"
      message="Please provide a reason for deletion"
      title="Delete Modbus Server"
      @submit="handleDeleteModbusServer"
    />

    <!-- Add/Edit ModbusServer Drawer -->
    <ManageModbusServerDrawer
      v-model:is-drawer-open="isManageModbusServer"
      :form-errors="formErrors"
      :loading="actionLoading"
      :modbus-server-data="selectedModbusServer"
      @close="closeManageModbusServer"
      @modbus-server-data="handleSaveModbusServer"
    />
  </section>
  <AlertDialog
    v-model:is-dialog-visible="showAlertDialog"
    :title-alert="alertMessage"
  />
</template>
