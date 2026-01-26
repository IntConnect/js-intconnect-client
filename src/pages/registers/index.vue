<script setup>
import AlertDialog from "@/components/general/AlertDialog.vue"
import DeleteDialog from "@/components/general/DeleteDialog.vue"
import { useManageRegister } from "@/composables/useManageRegister"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import TablePagination from "@core/components/TablePagination.vue"
import { nextTick, onMounted, ref, watch } from 'vue'

// ==========================================
// Composable
// ==========================================
const {
  registers,
  registerDependency,
  loading,
  actionLoading,
  fetchRegistersPagination,
  fetchRegisterDependency,
  saveRegister,
  deleteRegister,
  totalItems,
  totalPages,
  error,
  formErrors,
  clearFormErrors,
  clearErrors,
  currentPage: page, pageSize: itemsPerPage,
} = useManageRegister()

// ==========================================
// Constants
// ==========================================
const TABLE_HEADERS = [
  { title: 'Id', key: 'id', sortable: true },
  { title: 'Machine', key: 'machine', sortable: true },
  { title: 'Modbus Server', key: 'modbus_server', sortable: true },
  { title: 'Memory Location', key: 'memory_location', sortable: true },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Description', key: 'description', sortable: true },
  { title: 'Data Type', key: 'data_type', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

// ==========================================
// Reactive States
// ==========================================
const searchQuery = ref("")
const sortBy = ref("id")
const sortOrder = ref("asc")

// UI States
const showDeleteDialog = ref(false)
const selectedRegister = ref(null)
const showAlertDialog = ref(false)
const alertMessage = ref('')


// ==========================================
// Methods
// ==========================================

/**
 * Load registers from API
 */
const loadRegister = async () => {
  await fetchRegistersPagination({
    page: page.value,
    size: itemsPerPage.value,
    query: searchQuery.value,
    sort: sortBy.value,
    order: sortOrder.value,
  })
}



/**
 * Close add/edit drawer
 */
const closeManageRegister = () => {
  selectedRegister.value = null
  clearFormErrors()
}

/**
 * Open drawer for editing register
 */
const handleEdit = register => {
  selectedRegister.value = { ...register }
  clearFormErrors()
}

/**
 * Open delete confirmation dialog
 */
const openDeleteDialog = register => {
  selectedRegister.value = register
  showDeleteDialog.value = true
}

/**
 * Close delete dialog
 */
const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  selectedRegister.value = null
}

/**
 * Handle save register (create or update)
 */
const handleSaveRegister = async registerData => {

  const result = await saveRegister(registerData)

  if (result.success) {
    closeManageRegister()
    await nextTick()

    showAlertDialog.value = true
    alertMessage.value = 'Success manage Register'
  } else {
    console.error('Failed to save register:', result.error || result.errors)
  }
}

/**
 * Handle delete register
 */
const handleDeleteRegister = async formData => {
  if (!selectedRegister.value?.id) {
    console.warn('No Register selected for deletion')

    return
  }


  const result = await deleteRegister(selectedRegister.value.id, formData)

  if (result.success) {
    closeDeleteDialog()
    showAlertDialog.value = true
    alertMessage.value = 'Success delete Register'

  } else {
    console.error('Failed to delete Register:', result.error)

    // Optional: Show error notification
  }
}

// ==========================================
// Watchers
// ==========================================

// Reset to page 1 when search query changes
watch(searchQuery, () => {
  page.value = 1
  loadRegister()
})


watch([page, itemsPerPage], loadRegister)

// ==========================================
// Lifecycle
// ==========================================
onMounted(async () => {
  loadRegister()
  await fetchRegisterDependency()
  await nextTick()
})
</script>

<template>
  <section>
    <VCol cols="12">
      <h4 class="text-h4 mb-1">
        All Registers
      </h4>
      <p class="text-body-1 mb-0">
        Find all of your company’s administrator accounts and their associate roles.
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
            :to="{ name: 'register-create'}"
          >
            New Register
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
        :key="registers.length"
        :headers="TABLE_HEADERS"
        :items="registers"
        :items-per-page="itemsPerPage"
        :loading="loading"
        class="text-no-wrap"
        hide-default-footer
        no-data-text="No Registers found"
      >
        <!-- ID Column -->
        <template #item.id="{ index }">
          {{ (page - 1) * itemsPerPage + index + 1 }}
        </template>


        <template #item.machine="{ item }">
          <div class="d-flex align-center gap-x-4">
            {{ item.machine.name }}
          </div>
        </template>

        <template #item.modbus_server="{ item }">
          <div class="d-flex align-center gap-x-4">
            {{ item.modbus_server.ip_address }}
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
              :to="{ name: 'register-edit', params: { id: item.id } }"
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
        type: 'text',
      }]"
      :form-errors="formErrors"

      :loading="actionLoading"
      message="Please provide a reason for deletion"
      title="Delete Register"
      @submit="handleDeleteRegister"
    />
  </section>
  <AlertDialog
    v-model:is-dialog-visible="showAlertDialog"
    :title-alert="alertMessage"
  />
</template>
