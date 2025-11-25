<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import TablePagination from "@core/components/TablePagination.vue"
import DeleteDialog from "@/components/general/DeleteDialog.vue"
import { useManageParameter } from "@/composables/useManageParameter"
import ManageParameterDrawer from "@/components/drawer/ManageParameterDrawer.vue"

// ==========================================
// Composable
// ==========================================
const {
  parameters,
  loading,
  actionLoading,
  fetchParameters,
  saveParameter,
  deleteParameter,
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
  { title: 'Description', key: 'label', sortable: true },
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
const isManageParameterDrawerVisible = ref(false)
const showDeleteDialog = ref(false)
const selectedParameter = ref(null)

// ==========================================
// Methods
// ==========================================

/**
 * Load parameters from API
 */
const loadParameters = async () => {
  await fetchParameters({
    page: page.value,
    size: itemsPerPage.value,
    query: searchQuery.value,
    sort: sortBy.value,
    order: sortOrder.value,
  })
  await nextTick()
  console.log('Current page:', page.value)
  console.log('Parameters:', parameters.value)
  console.log('Total items:', totalItems.value)
}

/**
 * Open drawer for adding new parameter
 */
const openAddParameterDrawer = () => {
  selectedParameter.value = null
  clearFormErrors()
  isManageParameterDrawerVisible.value = true
}

/**
 * Close add/edit drawer
 */
const closeAddParameterDrawer = () => {
  isManageParameterDrawerVisible.value = false
  selectedParameter.value = null
  clearFormErrors()
}

/**
 * Open drawer for editing parameter
 */
const handleEdit = parameter => {
  selectedParameter.value = { ...parameter }
  clearFormErrors()
  isManageParameterDrawerVisible.value = true
}

/**
 * Open delete confirmation dialog
 */
const openDeleteDialog = parameter => {
  selectedParameter.value = parameter
  showDeleteDialog.value = true
}

/**
 * Close delete dialog
 */
const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  selectedParameter.value = null
}

/**
 * Handle save parameter (create or update)
 */
const handleSaveParameter = async parameterData => {
  const result = await saveParameter(parameterData)

  if (result.success) {
    closeAddParameterDrawer()
    await loadParameters()

    // Optional: Show success notification
    console.log('Parameter saved successfully')
  } else {
    // Errors sudah di-set di formErrors oleh composable
    console.error('Failed to save parameter:', result.error || result.errors)
  }
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

    // Optional: Show success notification
    console.log('Parameter deleted successfully')
  } else {
    console.error('Failed to delete parameter:', result.error)

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
  console.log('Page changed to:', page.value)
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
            @click="openAddParameterDrawer"
          >
            + New Parameter
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

        <!-- Role Column -->
        <template #item.role="{ item }">
          <VChip
            color="primary"
            size="small"
          >
            {{ item.role?.name || 'N/A' }}
          </VChip>
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
      title="Delete Parameter"
      @submit="handleDeleteParameter"
    />

    <!-- Add/Edit Parameter Drawer -->
    <ManageParameterDrawer
      v-model:is-drawer-open="isManageParameterDrawerVisible"
      :form-errors="formErrors"
      :loading="actionLoading"
      :parameter-data="selectedParameter"
      @close="closeAddParameterDrawer"
      @parameter-data="handleSaveParameter"
    />
  </section>
</template>
