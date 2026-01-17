<script setup>
import ManageParameterOperationDialog from "@/components/dialogs/ManageParameterOperationDialog.vue"
import DeleteDialog from "@/components/general/DeleteDialog.vue"
import { useManageParameter } from "@/composables/useManageParameter"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import TablePagination from "@core/components/TablePagination.vue"
import { nextTick, onMounted, ref, watch } from 'vue'

// ==========================================
// Composable
// ==========================================
const {
  parameters,
  loading,
  actionLoading,
  fetchParametersPagination,
  saveParameter,
  deleteParameter,
  manageParameterOperation,
  totalItems,
  totalPages,
  error,
  formErrors,
  clearFormErrors,
  clearErrors,
} = useManageParameter()

// ==========================================
// Constants
// ==========================================
const TABLE_HEADERS = [
  { title: 'Id', key: 'id', sortable: true },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Code', key: 'code', sortable: true },
  { title: 'Unit', key: 'unit', sortable: true },
  { title: 'Min Value', key: 'min_value' },
  { title: 'Max Value', key: 'max_value' },
  { title: 'Description', key: 'description' },
  { title: 'Actions', key: 'actions', sortable: false },
]


// ==========================================
// Reactive States
// ==========================================
const page = ref(1)
const itemsPerPage = ref(10)
const searchQuery = ref("")
const sortBy = ref("id")
const sortOrder = ref("asc")

// UI States
const showDeleteDialog = ref(false)
const showParameterOperationDialog = ref(false)
const selectedParameter = ref(null)

// ==========================================
// Methods
// ==========================================

/**
 * Load parameters from API
 */
const loadParameters = async () => {
  await fetchParametersPagination({
    page: page.value,
    size: itemsPerPage.value,
    query: searchQuery.value,
    sort: sortBy.value,
    order: sortOrder.value,
  })
  await nextTick()
}

/**
 * Open delete confirmation dialog
 */
const openDeleteDialog = parameter => {
  selectedParameter.value = parameter
  showDeleteDialog.value = true
}

const openParameterOperationDialog = parameter => {
  showParameterOperationDialog.value = true
  selectedParameter.value = parameter
}


/**
 * Close delete dialog
 */
const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  selectedParameter.value = null
}

const closeParameterOperationDialog = () => {
  showParameterOperationDialog.value = false
  selectedParameter.value = null
}



/**
 * Handle delete parameter
 */
const handleDeleteParameter = async formData => {
  if (!selectedParameter.value?.id) {
    console.warn('No parameter selected for deletion')

    return
  }

  const reason = formData.reason || ''
  const result = await deleteParameter(selectedParameter.value.id, reason)

  if (result.success) {
    closeDeleteDialog()
    await loadParameters()

  } else {
    console.error('Failed to delete parameter:', result.error)

    // Optional: Show error notification
  }
}

const handleManageParameterOperation = async payload => {
  if (!selectedParameter.value?.id) {
    console.warn('No parameter selected for operation')

    return
  }

  const result = await  manageParameterOperation(selectedParameter.value.id, payload)

  if (result.success) {
    closeParameterOperationDialog()
    await loadParameters()

  } else {
    console.error('Failed to delete parameter:', formErrors)

    // Optional: Show error notification
  }
}

// ==========================================
// Watchers
// ==========================================

// Reset to page 1 when search query changes
watch(searchQuery, () => {
  page.value = 1
  loadParameters()
})

// Reload data when page or itemsPerPage changes
watch([page, itemsPerPage], () => {
  loadParameters()
})

// ==========================================
// Lifecycle
// ==========================================
onMounted(() => {
  loadParameters()
})
</script>

<template>
  <section>
    <VCol cols="12">
      <h4 class="text-h4 mb-1">
        All Parameters
      </h4>
      <p class="text-body-1 mb-0">
        Manage all parameters configured for your 3D model.
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
            <VBtn color="primary"
            :to="{ name: 'parameter-create'}">
              New Parameter
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
        :headers="TABLE_HEADERS"
        :items="parameters"
        :items-per-page="itemsPerPage"
        :loading="loading"
        class="text-no-wrap"
        hide-default-footer
        no-data-text="No parameters found"
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
                :to="{ name: 'parameter-edit', params: { id: item.id } }"
              >
                <VIcon
                  icon="tabler-pencil"
                  size="20"
                />
                <VTooltip activator="parent" location="top">
                <span>Edit</span>
              </VTooltip>
              </VBtn>
            <VBtn
              color="warning"
              icon
              size="small"
              variant="text"
              @click="openParameterOperationDialog(item)"
            >
              <VIcon
                icon="tabler-math"
                size="20"
              />
              <VTooltip activator="parent" location="top">
                <span>Operations</span>
              </VTooltip>
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
               <VTooltip activator="parent" location="top">
                <span>Delete</span>
              </VTooltip>
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
        :form-errors="formErrors"
      :loading="actionLoading"
      message="Please provide a reason for deletion"
      title="Delete Parameter"
      @submit="handleDeleteParameter"
    />
    <ManageParameterOperationDialog
      :is-dialog-visible="showParameterOperationDialog"
      :parameter="selectedParameter"
      @submit="handleManageParameterOperation"
    />
  </section>
</template>
