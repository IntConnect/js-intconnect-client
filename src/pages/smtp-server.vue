<script setup>
import { ref, watch, onMounted } from 'vue'
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import TablePagination from "@core/components/TablePagination.vue"
import DeleteDialog from "@/components/general/DeleteDialog.vue"
import { format } from "date-fns"
import { useManageSmtpServer } from "@/composables/useManageSmtpServer"
import ManageSmtpServerDrawer from "@/components/drawer/ManageSmtpServerDrawer.vue"
import AlertDialog from "@/components/general/AlertDialog.vue"

// ==========================================
// Composable
// ==========================================
const {
  smtpServers,
  loading,
  actionLoading,
  fetchSmtpServers,
  saveSmtpServer,
  deleteSmtpServer,
  totalItems,
  totalPages,
  error,
  formErrors,
  clearFormErrors,
  clearErrors,
  currentPage: page, pageSize: itemsPerPage,
} = useManageSmtpServer()

// ==========================================
// Constants
// ==========================================
const TABLE_HEADERS = [
  { title: 'Id', key: 'id', sortable: true },
  { title: 'Host', key: 'host', sortable: true },
  { title: 'Port', key: 'port', sortable: true },
  { title: 'Username', key: 'username', sortable: false },
  { title: 'Password', key: 'password', sortable: false },
  { title: 'Mail Address', key: 'mail_address', sortable: false },
  { title: 'Mail Name', key: 'mail_name', sortable: false },
  { title: 'Password', key: 'password', sortable: false },

  { title: 'Status', key: 'is_active', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]


// ==========================================
// Reactive States
// ==========================================
const searchQuery = ref("")
const sortBy = ref("id")
const sortOrder = ref("asc")

// UI States
const isManageSmtpServerVisible = ref(false)
const showDeleteDialog = ref(false)
const selectedSmtpServer = ref(null)
const showAlertDialog = ref(false)
const alertMessage = ref('')


// ==========================================
// Methods
// ==========================================

/**
 * Load smtpServers from API
 */
const loadSmtpServers = async () => {
  await fetchSmtpServers({
    page: page.value,
    size: itemsPerPage.value,
    query: searchQuery.value,
    sort: sortBy.value,
    order: sortOrder.value,
  })
}

/**
 * Open drawer for adding new smtpServer
 */
const openManageSmtpServerDrawer = () => {
  selectedSmtpServer.value = null
  clearFormErrors()
  isManageSmtpServerVisible.value = true
}

/**
 * Close add/edit drawer
 */
const closeManageSmtpServerDrawer = () => {
  isManageSmtpServerVisible.value = false
  selectedSmtpServer.value = null
  clearFormErrors()
}

/**
 * Open drawer for editing smtpServer
 */
const handleEdit = smtpServer => {
  selectedSmtpServer.value = { ...smtpServer }
  clearFormErrors()
  isManageSmtpServerVisible.value = true
}

/**
 * Open delete confirmation dialog
 */
const openDeleteDialog = smtpServer => {
  selectedSmtpServer.value = smtpServer
  showDeleteDialog.value = true
}

/**
 * Close delete dialog
 */
const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  selectedSmtpServer.value = null
}

/**
 * Handle save smtpServer (create or update)
 */
const handleSaveSmtpServer = async smtpServerData => {

  const result = await saveSmtpServer(smtpServerData)

  if (result.success) {
    closeManageSmtpServerDrawer()
    await nextTick()

    showAlertDialog.value = true
    alertMessage.value = 'Success manage SMTP Server'
  } else {
    console.error('Failed to save smtpServer:', result.error || result.errors)
  }
}

/**
 * Handle delete smtpServer
 */
const handleDeleteSmtpServer = async formData => {
  if (!selectedSmtpServer.value?.id) {
    console.warn('No SMTP Server selected for deletion')

    return
  }


  const result = await deleteSmtpServer(selectedSmtpServer.value.id, formData)

  if (result.success) {
    closeDeleteDialog()
    showAlertDialog.value = true
    alertMessage.value = 'Success delete SMTP Server'

  } else {
    console.error('Failed to delete SMTP Server:', result.error)

    // Optional: Show error notification
  }
}

// ==========================================
// Watchers
// ==========================================

// Reset to page 1 when search query changes
watch(searchQuery, () => {
  page.value = 1
  loadSmtpServers()
})


watch([page, itemsPerPage], loadSmtpServers)

// ==========================================
// Lifecycle
// ==========================================
onMounted(() => {
  loadSmtpServers()
})
</script>

<template>
  <section>
    <VCol cols="12">
      <h4 class="text-h4 mb-1">
        All SMTP Servers
      </h4>
      <p class="text-body-1 mb-0">
        View and manage all MQTT brokers connected to your company’s system.
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
            @click="openManageSmtpServerDrawer"
          >
            New SMTP Server
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
        :key="smtpServers.length"
        :headers="TABLE_HEADERS"
        :items="smtpServers"
        :items-per-page="itemsPerPage"
        :loading="loading"
        class="text-no-wrap"
        hide-default-footer
        no-data-text="No SMTP Servers found"
      >
        <!-- ID Column -->
        <template #item.id="{ index }">
          {{ (page - 1) * itemsPerPage + index + 1 }}
        </template>

        <!-- Role Column -->
        <template #item.role="{ item }">
          <VChip
            color="primary"
            size="small"
          >
            {{ item.role?.name || 'N/A' }}
          </VChip>
        </template>

        <template #item.is_active="{ item }">
          <div
            v-if="item.is_active"
            class="d-flex align-center gap-x-4"
          >
            <VChip color="primary">
              Active
            </VChip>
          </div>
          <div
            v-if="!item.is_active"
            class="d-flex align-center gap-x-4"
          >
            <VChip color="error">
              Inactive
            </VChip>
          </div>
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
      message="Please provide a reason for deletion"
      title="Delete SMTP Server"
      @submit="handleDeleteSmtpServer"
    />

    <!-- Add/Edit SmtpServer Drawer -->
    <ManageSmtpServerDrawer
      v-model:is-drawer-open="isManageSmtpServerVisible"
      :form-errors="formErrors"
      :loading="actionLoading"
      :smtp-server-data="selectedSmtpServer"
      @close="closeManageSmtpServerDrawer"
      @smtp-server-data="handleSaveSmtpServer"
    />
  </section>
  <AlertDialog
    v-model:is-dialog-visible="showAlertDialog"
    :title-alert="alertMessage"
  />
</template>
